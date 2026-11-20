/* Bếp Nhà Muội — admin core (pure logic, no DOM). UMD: window.AdminCore / module.exports */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AdminCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var OWNER = 'huynhgia3004-hub';
  var REPO = 'Bepnhamuoi';
  var BRANCH = 'main';
  var DATA_PATH = 'data/products.json';
  var IMG_DIR = 'assets/products/';
  var PRODUCT_KEYS = ['id', 'name', 'category', 'price', 'image', 'desc', 'featured', 'hidden'];

  /* ---------- text helpers ---------- */
  function slug(s) {
    return String(s == null ? '' : s)
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function parsePrice(v) {
    if (typeof v === 'number') return isFinite(v) ? Math.round(v) : NaN;
    var digits = String(v == null ? '' : v).replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : NaN;
  }

  function formatPrice(n) {
    var x = parsePrice(n);
    if (isNaN(x)) return '';
    return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function nextId(products) {
    var max = 0;
    (products || []).forEach(function (p) {
      var m = /(\d+)\s*$/.exec(p && p.id != null ? String(p.id) : '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    var n = String(max + 1);
    return 'p' + (n.length < 2 ? '0' + n : n);
  }

  function imageFileName(name, now) {
    var s = slug(name) || 'sp';
    return s + '-' + (now == null ? Date.now() : now).toString(36) + '.jpg';
  }

  function commitSlug(name) { return slug(name) || 'san-pham'; }

  /* ---------- base64 (UTF-8 safe) ---------- */
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(String(b64).replace(/\s/g, ''));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function utf8ToB64(str) { return bytesToB64(new TextEncoder().encode(str)); }
  function b64ToUtf8(b64) { return new TextDecoder('utf-8').decode(b64ToBytes(b64)); }

  /* ---------- data helpers ---------- */
  function serialize(data) { return JSON.stringify(data, null, 2) + '\n'; }

  function orderProduct(src) {
    var out = {};
    PRODUCT_KEYS.forEach(function (k) {
      if (k === 'hidden') { if (src.hidden === true) out.hidden = true; return; }
      if (src[k] !== undefined) out[k] = src[k];
    });
    Object.keys(src).forEach(function (k) {
      if (PRODUCT_KEYS.indexOf(k) < 0 && src[k] !== undefined) out[k] = src[k];
    });
    return out;
  }

  /* fields: {name, category, price, image, desc, featured, hidden}; id null => new. Returns {data, product, oldImage} */
  function upsertProduct(data, fields, id) {
    var products = data.products.slice();
    var oldImage = null, product;
    if (id) {
      var idx = -1;
      for (var i = 0; i < products.length; i++) if (products[i].id === id) { idx = i; break; }
      if (idx < 0) { var e = new Error('notfound'); e.kind = 'notfound'; throw e; }
      var cur = products[idx];
      oldImage = cur.image || null;
      var merged = {};
      Object.keys(cur).forEach(function (k) { merged[k] = cur[k]; });
      ['name', 'category', 'price', 'image', 'desc', 'featured', 'hidden'].forEach(function (k) {
        if (fields[k] !== undefined) merged[k] = fields[k];
      });
      merged.featured = !!merged.featured;
      if (!merged.hidden) delete merged.hidden;
      product = orderProduct(merged);
      products[idx] = product;
    } else {
      var np = {
        id: nextId(products), name: fields.name, category: fields.category, price: fields.price,
        image: fields.image, desc: fields.desc || '', featured: !!fields.featured
      };
      if (fields.hidden) np.hidden = true;
      product = orderProduct(np);
      products.push(product);
    }
    return { data: withProducts(data, products), product: product, oldImage: oldImage };
  }

  function deleteProduct(data, id) {
    var removed = null;
    var products = data.products.filter(function (p) {
      if (p.id === id) { removed = p; return false; }
      return true;
    });
    return { data: withProducts(data, products), removed: removed };
  }

  function withProducts(data, products) {
    var out = {};
    Object.keys(data).forEach(function (k) { out[k] = k === 'products' ? products : data[k]; });
    return out;
  }

  function canDeleteImage(path, products) {
    if (!path || typeof path !== 'string') return false;
    if (path.indexOf(IMG_DIR) !== 0) return false;
    var base = path.split('/').pop();
    if (!base || base.indexOf('placeholder-') === 0) return false;
    return !products.some(function (p) { return p.image === path; });
  }

  /* ---------- GitHub API ---------- */
  function ApiError(kind, status, detail) {
    var e = new Error('api:' + kind + ':' + status);
    e.kind = kind; e.status = status; e.detail = detail;
    return e;
  }

  function createApi(opts) {
    var f = opts.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    var token = opts.token;
    var owner = opts.owner || OWNER, repo = opts.repo || REPO, branch = opts.branch || BRANCH;
    var base = 'https://api.github.com/repos/' + owner + '/' + repo;

    function request(method, url, body) {
      var init = {
        method: method,
        headers: {
          'Accept': 'application/vnd.github+json'
        }
      };
      if (token) init.headers['Authorization'] = 'Bearer ' + token;
      if (body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
      return Promise.resolve().then(function () { return f(url, init); }).then(function (res) {
        return Promise.resolve(res.json ? res.json().catch(function () { return {}; }) : {}).then(function (json) {
          if (res.ok) return json;
          var kind = 'other';
          if (res.status === 401 || res.status === 403) kind = 'auth';
          else if (res.status === 404) kind = 'notfound';
          else if (res.status === 409 || res.status === 422) kind = 'conflict';
          throw ApiError(kind, res.status, json && json.message);
        });
      }, function (err) {
        if (err && err.kind) throw err;
        throw ApiError('network', 0, String(err && err.message));
      });
    }

    function contentsUrl(path) {
      return base + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
    }

    return {
      getRepo: function () { return request('GET', base); },
      getFile: function (path) {
        return request('GET', contentsUrl(path) + '?ref=' + branch).then(function (j) {
          return { sha: j.sha, text: b64ToUtf8(j.content || '') };
        });
      },
      putFile: function (path, b64, message, sha) {
        var body = { message: message, content: b64, branch: branch };
        if (sha) body.sha = sha;
        return request('PUT', contentsUrl(path), body);
      },
      deleteFile: function (path, sha, message) {
        return request('DELETE', contentsUrl(path), { message: message, sha: sha, branch: branch });
      },
      getFileSha: function (path) {
        return request('GET', contentsUrl(path) + '?ref=' + branch).then(function (j) { return j.sha; });
      }
    };
  }

  function validateToken(api) {
    return api.getRepo().then(function (r) {
      if (!r || !r.permissions || r.permissions.push !== true) throw ApiError('noperm', 200);
      return true;
    });
  }

  function loadData(api) {
    return api.getFile(DATA_PATH).then(function (f) {
      return { data: JSON.parse(f.text), sha: f.sha };
    });
  }

  /* Re-GET fresh, mutate, PUT; retry on conflict (max 2 retries). mutate(data) => {data, ...extra} */
  function commitData(api, mutate, message) {
    var attempt = 0;
    function run() {
      return loadData(api).then(function (cur) {
        var res = mutate(cur.data);
        return api.putFile(DATA_PATH, utf8ToB64(serialize(res.data)), message, cur.sha).then(function () {
          return res;
        });
      }).catch(function (err) {
        if (err && err.kind === 'conflict' && attempt < 2) { attempt++; return run(); }
        throw err;
      });
    }
    return run();
  }

  function cleanupImage(api, path, products, name) {
    if (!canDeleteImage(path, products)) return Promise.resolve(false);
    return api.getFileSha(path).then(function (sha) {
      return api.deleteFile(path, sha, 'Xoa anh ' + commitSlug(name));
    }).then(function () { return true; }, function () { return false; });
  }

  /* opts: {id|null, fields, imageB64|null, imageName|null}. */
  function saveProduct(api, opts) {
    var fields = {};
    Object.keys(opts.fields).forEach(function (k) { fields[k] = opts.fields[k]; });
    var s = commitSlug(fields.name);
    var up = Promise.resolve();
    if (opts.imageB64) {
      var path = IMG_DIR + (opts.imageName || imageFileName(fields.name));
      fields.image = path;
      up = api.putFile(path, opts.imageB64, 'Them anh ' + s);
    }
    return up.then(function () {
      return commitData(api, function (data) { return upsertProduct(data, fields, opts.id || null); },
        (opts.id ? 'Sua san pham ' : 'Them san pham ') + s);
    }).then(function (res) {
      var p = Promise.resolve();
      if (opts.id && opts.imageB64 && res.oldImage && res.oldImage !== res.product.image) {
        p = cleanupImage(api, res.oldImage, res.data.products, fields.name);
      }
      return p.then(function () { return res; });
    });
  }

  function removeProduct(api, id, name) {
    return commitData(api, function (data) {
      var r = deleteProduct(data, id);
      if (!r.removed) { var e = new Error('notfound'); e.kind = 'notfound'; throw e; }
      return r;
    }, 'Xoa san pham ' + commitSlug(name || id)).then(function (res) {
      return cleanupImage(api, res.removed.image, res.data.products, res.removed.name).then(function () { return res; });
    });
  }

  /* ---------- password encryption (WebCrypto) + key file in repo ---------- */
  var KEY_PATH = 'data/admin-key.json';
  var KDF_ITER = 600000;
  var MIN_PW = 8;
  var PW_HINT = 'Password phải có ít nhất 8 ký tự — càng dài càng an toàn';

  /* null = ok, else Vietnamese message. pw2 / oldPw optional. */
  function passwordProblem(pw, pw2, oldPw) {
    pw = pw == null ? '' : String(pw);
    if (pw.length < MIN_PW) return PW_HINT;
    if (pw2 !== undefined && pw !== pw2) return 'Hai password không giống nhau.';
    if (oldPw !== undefined && pw === oldPw) return 'Password mới phải khác password cũ.';
    return null;
  }

  function subtle() { return (globalThis.crypto || {}).subtle; }
  function deriveKey(pw, salt, iter) {
    return subtle().importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (km) {
      return subtle().deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' },
        km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  /* => {v,kdf,iter,salt,iv,ct} (the exact content of data/admin-key.json) */
  function encryptToken(token, pw) {
    var salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
    var iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pw, salt, KDF_ITER).then(function (key) {
      return subtle().encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(token));
    }).then(function (ct) {
      return { v: 1, kdf: 'PBKDF2-SHA256', iter: KDF_ITER, salt: bytesToB64(salt), iv: bytesToB64(iv), ct: bytesToB64(new Uint8Array(ct)) };
    });
  }
  /* wrong password (or tampered file) => ApiError('badpw') */
  function decryptToken(blob, pw) {
    return Promise.resolve().then(function () {
      var iter = blob.iter;
      if (!(iter >= 100000 && iter <= 5000000)) throw ApiError('badkey', 0);
      return deriveKey(pw, b64ToBytes(blob.salt), iter).then(function (key) {
        return subtle().decrypt({ name: 'AES-GCM', iv: b64ToBytes(blob.iv) }, key, b64ToBytes(blob.ct));
      }).then(function (pt) { return new TextDecoder().decode(pt); }, function () { throw ApiError('badpw', 0); });
    });
  }

  function parseKeyText(text) {
    var j;
    try { j = JSON.parse(text); } catch (e) { throw ApiError('badkey', 0); }
    if (!j || j.v !== 1 || typeof j.salt !== 'string' || typeof j.iv !== 'string' || typeof j.ct !== 'string') throw ApiError('badkey', 0);
    return j;
  }

  /* Public read of the key file. => {state:'ok', blob, sha|null} | {state:'no-key'}.
     GitHub API first (fresh, unauthenticated); on any non-404 failure fall back to same-origin file. */
  function readKeyFile(opts) {
    opts = opts || {};
    var f = opts.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    var api = createApi({ fetch: f, token: null });
    function sameOrigin() {
      return Promise.resolve().then(function () { return f(KEY_PATH + '?t=' + Date.now()); }).then(function (res) {
        if (res.status === 404) return { state: 'no-key' };
        if (!res.ok) throw ApiError('other', res.status);
        return res.text().then(function (t) { return { state: 'ok', blob: parseKeyText(t), sha: null }; });
      }, function (err) {
        if (err && err.kind) throw err;
        throw ApiError('network', 0, String(err && err.message));
      });
    }
    return api.getFile(KEY_PATH).then(function (r) {
      return { state: 'ok', blob: parseKeyText(r.text), sha: r.sha };
    }, function (err) {
      if (err && err.kind === 'notfound') return { state: 'no-key' };
      return sameOrigin();
    });
  }

  /* => token string. Errors: nokey | badpw | badkey | network ... */
  function loginWithPassword(pw, opts) {
    return readKeyFile(opts).then(function (r) {
      if (r.state !== 'ok') throw ApiError('nokey', 404);
      return decryptToken(r.blob, pw);
    });
  }

  function invalid(msg) { return ApiError('invalid', 0, msg); }
  function putKey(api, blob, sha, message) {
    return api.putFile(KEY_PATH, utf8ToB64(serialize(blob)), message, sha);
  }
  function retryConflict(run) {
    var attempt = 0;
    function go() {
      return run().catch(function (err) {
        if (err && err.kind === 'conflict' && attempt < 2) { attempt++; return go(); }
        throw err;
      });
    }
    return go();
  }

  /* First-time setup / forgot: api must hold a validated write token. */
  function setupPassword(api, token, pw, pw2) {
    var problem = passwordProblem(pw, pw2);
    if (problem) return Promise.reject(invalid(problem));
    return encryptToken(token, pw).then(function (blob) {
      return retryConflict(function () {
        return api.getFileSha(KEY_PATH).then(null, function (err) {
          if (err && err.kind === 'notfound') return undefined;
          throw err;
        }).then(function (sha) { return putKey(api, blob, sha, 'Dat password quan ly'); });
      });
    });
  }

  /* Change password; token stays the same. => token. Errors: invalid | badpw | conflict | auth ... */
  function changePassword(api, oldPw, newPw, newPw2) {
    var problem = passwordProblem(newPw, newPw2, oldPw);
    if (problem) return Promise.reject(invalid(problem));
    return retryConflict(function () {
      return api.getFile(KEY_PATH).then(function (f) {
        return decryptToken(parseKeyText(f.text), oldPw).then(function (tk) {
          return encryptToken(tk, newPw).then(function (nb) {
            return putKey(api, nb, f.sha, 'Doi password quan ly');
          }).then(function () { return tk; });
        });
      });
    });
  }

  /* friendly Vietnamese reason for an error */
  function friendlyReason(err) {
    if (!err) return '';
    if (err.kind === 'auth') return 'mã quản lý hết hạn';
    if (err.kind === 'network') return 'mất mạng';
    if (err.kind === 'conflict') return 'có người khác vừa sửa, thử lại';
    if (err.kind === 'notfound') return 'không tìm thấy dữ liệu';
    return 'lỗi không xác định';
  }

  return {
    OWNER: OWNER, REPO: REPO, BRANCH: BRANCH, DATA_PATH: DATA_PATH, IMG_DIR: IMG_DIR,
    slug: slug, parsePrice: parsePrice, formatPrice: formatPrice, nextId: nextId,
    imageFileName: imageFileName, commitSlug: commitSlug,
    utf8ToB64: utf8ToB64, b64ToUtf8: b64ToUtf8, bytesToB64: bytesToB64, b64ToBytes: b64ToBytes,
    serialize: serialize, upsertProduct: upsertProduct, deleteProduct: deleteProduct,
    canDeleteImage: canDeleteImage, createApi: createApi, validateToken: validateToken,
    loadData: loadData, commitData: commitData, saveProduct: saveProduct, removeProduct: removeProduct,
    KEY_PATH: KEY_PATH, MIN_PW: MIN_PW, PW_HINT: PW_HINT, passwordProblem: passwordProblem,
    encryptToken: encryptToken, decryptToken: decryptToken, readKeyFile: readKeyFile,
    loginWithPassword: loginWithPassword, setupPassword: setupPassword, changePassword: changePassword,
    friendlyReason: friendlyReason
  };
});
