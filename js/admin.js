/* Bếp Nhà Muội — admin UI. Depends on window.AdminCore */
(function () {
  'use strict';
  var C = window.AdminCore;
  var SS_KEY = 'bnm_admin_tk';   // sessionStorage: token for this tab only
  var token = null;      // in memory
  var api = null;
  var keyExists = false; // does data/admin-key.json exist (known from last check)
  var data = null;       // {shop, categories, products}
  var editingId = null;  // null = new
  var pickedImage = null; // {b64, previewUrl}
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function show(el, on) { el.hidden = !on; }
  function setText(el, t) { el.textContent = t; show(el, !!t); }
  function ssGet() { try { return sessionStorage.getItem(SS_KEY); } catch (e) { return null; } }
  function ssSet(v) { try { if (v) sessionStorage.setItem(SS_KEY, v); else sessionStorage.removeItem(SS_KEY); } catch (e) { /* ignore */ } }
  try { localStorage.removeItem('bnm_admin'); } catch (e) { /* legacy storage, no longer used */ }

  /* ---------- views ---------- */
  function showView(name) {
    show($('view-setup'), name === 'setup');
    show($('view-login'), name === 'login');
    show($('view-main'), name === 'main');
    show($('btn-logout'), name === 'main');
    show($('btn-chpw'), name === 'main');
    show($('setup-back-wrap'), name === 'setup' && keyExists);
    if (name !== 'main') { banner(''); show($('auth-box'), false); }
  }
  var bannerTimer = null;
  function banner(text, isError) {
    var b = $('banner');
    b.textContent = text || '';
    b.classList.toggle('is-error', !!isError);
    show(b, !!text);
    clearTimeout(bannerTimer);
    if (text && !isError) bannerTimer = setTimeout(function () { show(b, false); }, 8000);
  }
  function failText(err) {
    var r = C.friendlyReason(err);
    return 'Không lưu được, thử lại' + (r ? ' (' + r + ')' : '');
  }
  /* 401/403: token expired or revoked */
  function isAuth(e) { return !!(e && e.kind === 'auth'); }
  function showAuthExpired() { show($('auth-box'), true); }

  function netText(e) {
    if (e && e.kind === 'network') return 'Mất mạng, thử lại.';
    return 'Không đọc được dữ liệu đăng nhập, thử lại.';
  }

  /* decide first screen */
  function showLoginOrSetup() {
    return C.readKeyFile().then(function (r) {
      keyExists = r.state === 'ok';
      showView(keyExists ? 'login' : 'setup');
      if (keyExists) $('login-pw').focus();
    }, function (e) {
      console.error(e);
      keyExists = true; // unknown: show login, submit re-reads
      showView('login');
      setText($('login-error'), netText(e));
    });
  }

  function start() {
    token = null; api = null; data = null;
    var saved = ssGet();
    if (saved) {
      token = saved; api = C.createApi({ token: saved });
      keyExists = true;
      return enterMain();
    }
    return showLoginOrSetup();
  }

  function logout() {
    ssSet(null); token = null; api = null; data = null;
    closeModal(); closePw();
    $('list').innerHTML = '';
    $('login-pw').value = ''; setText($('login-error'), '');
    return showLoginOrSetup();
  }

  function loggedIn(tk, tmpApi) {
    token = tk; api = tmpApi || C.createApi({ token: tk });
    keyExists = true;
    ssSet(tk);
    enterMain();
  }

  /* ---------- login ---------- */
  $('form-login').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    var pw = $('login-pw').value, err = $('login-error');
    if (!pw) return setText(err, 'Vui lòng nhập password.');
    setText(err, '');
    busy = true;
    var btn = $('login-submit'); btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
    C.loginWithPassword(pw).then(function (tk) {
      $('login-pw').value = '';
      loggedIn(tk);
    }, function (e) {
      if (e && e.kind === 'badpw') {
        setText(err, 'Sai password');
        $('login-pw').value = ''; $('login-pw').focus();
      } else if (e && e.kind === 'nokey') {
        keyExists = false; showView('setup');
      } else {
        console.error(e);
        setText(err, netText(e));
      }
    }).then(function () { busy = false; btn.disabled = false; btn.textContent = 'Vào'; });
  });

  function openSetup() {
    $('setup-token').value = ''; $('setup-pw').value = ''; $('setup-pw2').value = '';
    setText($('setup-error'), '');
    showView('setup');
    $('setup-token').focus();
  }
  $('link-forgot').addEventListener('click', function (ev) { ev.preventDefault(); openSetup(); });
  $('btn-newtoken').addEventListener('click', function () {
    ssSet(null); token = null; api = null; data = null;
    $('list').innerHTML = '';
    openSetup();
  });
  $('link-back').addEventListener('click', function (ev) {
    ev.preventDefault();
    setText($('login-error'), '');
    showView('login'); $('login-pw').focus();
  });

  /* ---------- setup / forgot ---------- */
  $('form-setup').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    var tk = $('setup-token').value.trim(), pw = $('setup-pw').value, pw2 = $('setup-pw2').value;
    var err = $('setup-error');
    if (!tk) return setText(err, 'Vui lòng dán mã quản lý.');
    var problem = C.passwordProblem(pw, pw2);
    if (problem) return setText(err, problem);
    setText(err, '');
    busy = true;
    var btn = $('setup-submit'); btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
    var tmp = C.createApi({ token: tk });
    C.validateToken(tmp).then(function () {
      return C.setupPassword(tmp, tk, pw, pw2);
    }).then(function () {
      $('setup-token').value = ''; $('setup-pw').value = ''; $('setup-pw2').value = '';
      loggedIn(tk, tmp);
    }).catch(function (e) {
      console.error(e);
      var msg = 'Không lưu được, thử lại.';
      if (e && (e.kind === 'auth' || (e.kind === 'notfound' && e.status === 404))) msg = 'Mã quản lý không đúng hoặc đã hết hạn.';
      else if (e && e.kind === 'noperm') msg = 'Mã này không có quyền sửa website. Hãy nhờ Pháp tạo mã mới.';
      else if (e && e.kind === 'network') msg = 'Mất mạng, thử lại.';
      else if (e && e.kind === 'invalid') msg = e.detail;
      setText(err, msg);
    }).then(function () {
      busy = false; btn.disabled = false; btn.textContent = 'Lưu và bắt đầu';
    });
  });

  $('btn-logout').addEventListener('click', function () { logout(); });

  /* ---------- change password ---------- */
  function openPw() {
    $('pw-old').value = ''; $('pw-new').value = ''; $('pw-new2').value = '';
    setText($('pw-error'), ''); show($('pw-saving'), false); setPwBusy(false);
    show($('modal-pw'), true);
    document.body.style.overflow = 'hidden';
    $('pw-old').focus();
  }
  function closePw() {
    show($('modal-pw'), false);
    document.body.style.overflow = '';
    $('pw-old').value = ''; $('pw-new').value = ''; $('pw-new2').value = '';
  }
  function setPwBusy(on) {
    $('pw-ok').disabled = on; $('pw-cancel').disabled = on;
    show($('pw-saving'), on);
  }
  $('btn-chpw').addEventListener('click', openPw);
  $('pw-cancel').addEventListener('click', function () { if (!busy) closePw(); });
  $('form-pw').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    var o = $('pw-old').value, n = $('pw-new').value, n2 = $('pw-new2').value, err = $('pw-error');
    if (!o) return setText(err, 'Vui lòng nhập password cũ.');
    var problem = C.passwordProblem(n, n2, o);
    if (problem) return setText(err, problem);
    setText(err, '');
    busy = true; setPwBusy(true);
    C.changePassword(api, o, n, n2).then(function () {
      closePw();
      banner('Đã đổi password!');
      window.scrollTo(0, 0);
    }, function (e) {
      console.error(e);
      if (e && e.kind === 'badpw') { setText(err, 'Sai password cũ'); $('pw-old').value = ''; $('pw-old').focus(); }
      else if (isAuth(e)) { closePw(); showAuthExpired(); window.scrollTo(0, 0); }
      else if (e && e.kind === 'invalid') setText(err, e.detail);
      else setText(err, 'Không đổi được password, thử lại' + (C.friendlyReason(e) ? ' (' + C.friendlyReason(e) + ')' : '') + '.');
    }).then(function () { busy = false; setPwBusy(false); });
  });

  /* ---------- list ---------- */
  function enterMain() {
    showView('main');
    refresh();
  }

  function refresh() {
    show($('loading'), true); setText($('list-error'), '');
    return C.loadData(api).then(function (r) {
      data = r.data;
      renderList();
    }).catch(function (e) {
      console.error(e);
      setText($('list-error'), 'Không tải được danh sách (' + (C.friendlyReason(e) || 'lỗi') + '). Kéo xuống để thử lại hoặc bấm Thoát rồi vào lại.');
      if (isAuth(e)) showAuthExpired();
    }).then(function () { show($('loading'), false); });
  }

  function catName(id) {
    var c = (data.categories || []).filter(function (x) { return x.id === id; })[0];
    return c ? c.name : id;
  }
  function norm(s) { return C.slug(s).replace(/-/g, ' '); }

  function renderList() {
    var q = norm($('search').value || '');
    var ul = $('list'); ul.innerHTML = '';
    var shown = 0;
    data.products.forEach(function (p) {
      if (q && (norm(p.name) + ' ' + norm(catName(p.category))).indexOf(q) < 0) return;
      shown++;
      var li = document.createElement('li');
      li.className = 'adm-item' + (p.hidden ? ' is-hidden' : '');
      var img = document.createElement('img');
      img.className = 'adm-thumb'; img.alt = ''; img.loading = 'lazy';
      img.src = p.image ? (p.image.indexOf('assets/products/') === 0 ? p.image + '?v=' + Date.now().toString(36).slice(0, -3) : p.image) : '';
      var info = document.createElement('div');
      var n = document.createElement('div'); n.className = 'adm-name'; n.textContent = p.name;
      var pr = document.createElement('div'); pr.className = 'adm-price-line'; pr.textContent = C.formatPrice(p.price) + 'đ';
      var cat = document.createElement('div'); cat.className = 'adm-meta'; cat.textContent = catName(p.category);
      info.appendChild(n); info.appendChild(pr); info.appendChild(cat);
      var badges = document.createElement('div'); badges.className = 'adm-badges';
      if (p.featured) badges.appendChild(badge('Trang chủ', false));
      if (p.hidden) badges.appendChild(badge('Đang ẩn', true));
      if (badges.children.length) info.appendChild(badges);
      var acts = document.createElement('div'); acts.className = 'adm-item-actions';
      var be = document.createElement('button'); be.type = 'button'; be.className = 'btn btn-outline'; be.textContent = 'Sửa';
      be.addEventListener('click', function () { openForm(p.id); });
      var bd = document.createElement('button'); bd.type = 'button'; bd.className = 'btn btn-outline adm-del'; bd.textContent = 'Xóa';
      bd.addEventListener('click', function () { doDelete(p); });
      acts.appendChild(be); acts.appendChild(bd);
      li.appendChild(img); li.appendChild(info); li.appendChild(acts);
      ul.appendChild(li);
    });
    show($('list-empty'), shown === 0);
  }
  function badge(text, off) {
    var s = document.createElement('span'); s.className = 'adm-badge' + (off ? ' off' : ''); s.textContent = text; return s;
  }
  $('search').addEventListener('input', function () { if (data) renderList(); });

  function doDelete(p) {
    if (busy) return;
    if (!confirm('Xóa "' + p.name + '"?')) return;
    busy = true; banner(''); show($('loading'), true);
    C.removeProduct(api, p.id, p.name).then(function (res) {
      data = res.data; renderList();
      banner('Đã xóa! Website sẽ cập nhật sau khoảng 1 phút.');
    }).catch(function (e) {
      console.error(e);
      if (isAuth(e)) showAuthExpired(); else banner(failText(e), true);
    }).then(function () { busy = false; show($('loading'), false); window.scrollTo(0, 0); });
  }

  /* ---------- form ---------- */
  $('btn-add').addEventListener('click', function () { openForm(null); });
  $('btn-cancel').addEventListener('click', function () { if (!busy) closeModal(); });

  function openForm(id) {
    editingId = id; pickedImage = null;
    var p = id ? data.products.filter(function (x) { return x.id === id; })[0] : null;
    $('form-title').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
    var sel = $('f-category'); sel.innerHTML = '';
    (data.categories || []).forEach(function (c) {
      var o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o);
    });
    $('f-name').value = p ? p.name : '';
    $('f-desc').value = p ? (p.desc || '') : '';
    $('f-price').value = p ? C.formatPrice(p.price) : '';
    $('f-featured').checked = p ? !!p.featured : false;
    $('f-hidden').checked = p ? !!p.hidden : false;
    if (p) sel.value = p.category;
    $('f-file').value = '';
    var pv = $('f-preview');
    if (p && p.image) { pv.src = p.image; show(pv, true); } else { pv.removeAttribute('src'); show(pv, false); }
    setText($('form-error'), ''); show($('form-saving'), false);
    setFormBusy(false);
    show($('modal'), true);
    document.body.style.overflow = 'hidden';
    $('f-name').focus();
  }
  function closeModal() {
    show($('modal'), false);
    document.body.style.overflow = '';
    if (pickedImage && pickedImage.previewUrl) URL.revokeObjectURL(pickedImage.previewUrl);
    pickedImage = null;
  }
  function setFormBusy(on) {
    $('btn-ok').disabled = on; $('btn-cancel').disabled = on; $('btn-pick').disabled = on;
    show($('form-saving'), on);
  }

  $('f-price').addEventListener('input', function () {
    var n = C.parsePrice(this.value);
    this.value = isNaN(n) ? '' : C.formatPrice(n);
  });

  $('btn-pick').addEventListener('click', function () { $('f-file').click(); });
  $('f-file').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var err = $('form-error'); setText(err, '');
    setFormBusy(true); $('form-saving').lastChild.textContent = ' Đang xử lý ảnh…';
    resizeImage(file).then(function (r) {
      if (pickedImage && pickedImage.previewUrl) URL.revokeObjectURL(pickedImage.previewUrl);
      pickedImage = r;
      var pv = $('f-preview'); pv.src = r.previewUrl; show(pv, true);
    }).catch(function (e) {
      console.error(e);
      setText(err, 'Không đọc được ảnh này, hãy chọn ảnh khác.');
    }).then(function () { setFormBusy(false); $('form-saving').lastChild.textContent = ' Đang lưu…'; });
  });

  /* ---------- image resize (canvas) ---------- */
  function loadBitmap(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () { return loadImgEl(file); });
    }
    return loadImgEl(file);
  }
  function loadImgEl(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image load')); };
      im.src = url;
    });
  }
  function toBlob(canvas, q) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob')); }, 'image/jpeg', q);
    });
  }
  function resizeImage(file) {
    var MAX_BYTES = 300 * 1024;
    return loadBitmap(file).then(function (bmp) {
      var w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
      function render(longest, q) {
        var scale = Math.min(1, longest / Math.max(w0, h0));
        var w = Math.max(1, Math.round(w0 * scale)), h = Math.max(1, Math.round(h0 * scale));
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bmp, 0, 0, w, h);
        return toBlob(cv, q);
      }
      var steps = [];
      [1200, 900].forEach(function (side) {
        [0.82, 0.74, 0.66, 0.58, 0.5].forEach(function (q) { steps.push([side, q]); });
      });
      var i = 0, last = null;
      function next() {
        var s = steps[i++];
        return render(s[0], s[1]).then(function (b) {
          last = b;
          if (b.size <= MAX_BYTES || i >= steps.length) return b;
          return next();
        });
      }
      return next().then(function (blob) {
        if (bmp.close) bmp.close();
        return blobToB64(blob).then(function (b64) {
          return { b64: b64, previewUrl: URL.createObjectURL(blob) };
        });
      });
    });
  }
  function blobToB64(blob) {
    return blob.arrayBuffer().then(function (buf) { return C.bytesToB64(new Uint8Array(buf)); });
  }

  /* ---------- save ---------- */
  $('form-product').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    var err = $('form-error');
    var name = $('f-name').value.trim(), cat = $('f-category').value;
    var price = C.parsePrice($('f-price').value);
    if (!cat) return setText(err, 'Vui lòng chọn danh mục.');
    if (!name) return setText(err, 'Vui lòng nhập tên sản phẩm.');
    if (!editingId && !pickedImage) return setText(err, 'Vui lòng chọn hình ảnh.');
    if (!(price > 0)) return setText(err, 'Vui lòng nhập giá lớn hơn 0.');
    setText(err, '');
    var fields = {
      name: name, category: cat, price: price, desc: $('f-desc').value.trim(),
      featured: $('f-featured').checked, hidden: $('f-hidden').checked
    };
    busy = true; setFormBusy(true);
    C.saveProduct(api, {
      id: editingId, fields: fields,
      imageB64: pickedImage ? pickedImage.b64 : null,
      imageName: pickedImage ? C.imageFileName(name) : null
    }).then(function (res) {
      data = res.data;
      closeModal(); renderList();
      banner('Đã lưu! Website sẽ cập nhật sau khoảng 1 phút.');
      window.scrollTo(0, 0);
      refresh();
    }).catch(function (e) {
      console.error(e);
      if (isAuth(e)) { closeModal(); showAuthExpired(); window.scrollTo(0, 0); }
      else setText(err, failText(e));
    }).then(function () { busy = false; setFormBusy(false); });
  });

  start();
})();
