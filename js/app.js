// Bếp Nhà Muội — site logic
// Loads products.json, renders featured + full catalog, handles filter/search/order via Messenger.

const DATA_URL = 'data/products.json';
const VND = n => new Intl.NumberFormat('vi-VN').format(n) + '₫';

let STATE = { shop: null, categories: [], products: [], activeCat: 'all', query: '' };

async function loadData() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    STATE.shop = data.shop;
    STATE.categories = data.categories;
    STATE.products = data.products;
    applyShop();
    renderAll();
  } catch (err) {
    console.error('Failed to load products:', err);
    const host = document.querySelector('#products-grid') || document.querySelector('#featured-grid');
    if (host) host.innerHTML = `<p style="color:var(--muted);text-align:center;grid-column:1/-1;">Không tải được sản phẩm. Vui lòng thử lại.</p>`;
  }
}

function messengerUrl() {
  return 'https://m.me/' + STATE.shop.facebookId;
}

// Fill shop details across the page (phone, address, social links, etc.)
function applyShop() {
  const s = STATE.shop;
  document.querySelectorAll('[data-shop-name]').forEach(el => el.textContent = s.name);
  document.querySelectorAll('[data-shop-tagline]').forEach(el => el.textContent = s.tagline);
  document.querySelectorAll('[data-shop-addr]').forEach(el => el.textContent = s.address);
  document.querySelectorAll('[data-shop-phone]').forEach(el => {
    if (!el.hasAttribute('data-shop-phone-icon')) el.textContent = s.phoneDisplay;
    el.href = 'tel:' + s.phone;
  });
  document.querySelectorAll('[data-shop-zalo]').forEach(el => el.href = 'https://zalo.me/' + s.zalo);
  document.querySelectorAll('[data-shop-fb]').forEach(el => el.href = s.facebookUrl);
  document.querySelectorAll('[data-shop-messenger]').forEach(el => el.href = messengerUrl());
  document.querySelectorAll('[data-shop-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function orderMessage(p) {
  const catName = (STATE.categories.find(c => c.id === p.category) || {}).name || '';
  const img = new URL(p.image, location.href).href;
  return [
    'mình muốn order món này Bếp ơi!',
    '',
    '• Tên: ' + p.name,
    '• Mã: ' + p.id,
    '• Giá: ' + VND(p.price),
    '• Loại: ' + catName,
    '• Hình: ' + img,
  ].join('\n');
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
}

async function orderProduct(productId) {
  const p = STATE.products.find(x => x.id === productId);
  if (!p) return;
  const msg = orderMessage(p);
  const ok = await copyToClipboard(msg);
  showToast(ok
    ? '✅ Đã copy đơn! Dán (Ctrl+V) vào Messenger rồi gửi cho Bếp nhé.'
    : '⚠️ Không copy được. Hãy chụp màn hình sản phẩm và gửi Messenger.');
  window.open(messengerUrl(), '_blank', 'noopener');
}

function showToast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 4000);
}

function productCard(p) {
  const catName = (STATE.categories.find(c => c.id === p.category) || {}).name || '';
  return `
    <article class="prod-card">
      <a class="prod-img" href="#" data-order="${p.id}" aria-label="Đặt ${p.name} qua Messenger">
        <img src="${p.image}" alt="${p.name}" loading="lazy"/>
      </a>
      <div class="prod-body">
        <span class="prod-cat">${catName}</span>
        <h3 class="prod-name">${p.name}</h3>
        <p class="prod-desc">${p.desc}</p>
        <div class="prod-foot">
          <span class="prod-price">${VND(p.price)}</span>
          <a class="prod-order" href="#" data-order="${p.id}">Đặt Messenger</a>
        </div>
      </div>
    </article>`;
}

function renderFeatured() {
  const host = document.querySelector('#featured-grid');
  if (!host) return;
  const items = STATE.products.filter(p => p.featured).slice(0, 4);
  host.innerHTML = items.map(productCard).join('');
}

function renderCatalog() {
  const host = document.querySelector('#products-grid');
  if (!host) return;
  let items = STATE.products;
  if (STATE.activeCat !== 'all') items = items.filter(p => p.category === STATE.activeCat);
  if (STATE.query) {
    const q = STATE.query.toLowerCase();
    items = items.filter(p => (p.name + ' ' + p.desc).toLowerCase().includes(q));
  }
  host.innerHTML = items.length
    ? items.map(productCard).join('')
    : `<p style="color:var(--muted);text-align:center;grid-column:1/-1;padding:40px;">Không tìm thấy sản phẩm phù hợp.</p>`;
}

function renderFilters() {
  const host = document.querySelector('#filter-bar');
  if (!host) return;
  const cats = [{ id: 'all', name: 'Tất cả' }, ...STATE.categories];
  host.innerHTML = cats.map(c =>
    `<button class="filter-btn ${c.id === STATE.activeCat ? 'active' : ''}" data-cat="${c.id}">${c.name}</button>`
  ).join('') + `<input type="search" class="search-box" id="search-input" placeholder="Tìm sản phẩm..." value="${STATE.query}"/>`;

  host.querySelectorAll('.filter-btn').forEach(btn =>
    btn.addEventListener('click', () => { STATE.activeCat = btn.dataset.cat; renderFilters(); renderCatalog(); })
  );
  const input = host.querySelector('#search-input');
  input.addEventListener('input', e => { STATE.query = e.target.value.trim(); renderCatalog(); });
  if (STATE.query) { input.focus(); input.setSelectionRange(STATE.query.length, STATE.query.length); }
}

function renderAll() {
  renderFeatured();
  renderFilters();
  renderCatalog();
}

// Mobile nav
function initNav() {
  const burger = document.querySelector('.burger');
  const links = document.querySelector('.nav-links');
  if (burger && links) {
    burger.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }
}

// Delegated click: any element with [data-order] triggers Messenger order flow
document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-order]');
  if (!trigger) return;
  e.preventDefault();
  orderProduct(trigger.dataset.order);
});

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  loadData();
});
