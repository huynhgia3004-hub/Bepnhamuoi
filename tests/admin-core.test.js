'use strict';
const assert = require('node:assert');
const C = require('../js/admin-core.js');

let pass = 0, fail = 0;
const queue = [];
function test(name, fn) { queue.push({ name, fn }); }

const base = () => ({
  shop: { name: 'Bếp Nhà Muội', phone: '0933' },
  categories: [{ id: 'banh-kem', name: 'Bánh Kem' }, { id: 'tea', name: 'Trà & Đồ Uống' }],
  products: [
    { id: 'p01', name: 'Bánh Kem Dâu', category: 'banh-kem', price: 285000, image: 'assets/products/placeholder-1.svg', desc: 'a', featured: true },
    { id: 'p08', name: 'Trà Đào', category: 'tea', price: 45000, image: 'assets/products/tra-dao-abc.jpg', desc: 'b', featured: false }
  ]
});

/* in-memory GitHub mock */
function mockRepo(initialData, opts) {
  opts = opts || {};
  const files = {}; let shaN = 0; const log = []; let conflictsLeft = opts.conflicts || 0;
  const put = (p, text, isB64) => { files[p] = { b64: isB64 ? text : C.utf8ToB64(text), sha: 'sha' + (++shaN) }; };
  put('data/products.json', C.serialize(initialData));
  put('assets/products/tra-dao-abc.jpg', 'IMG', false);
  const res = (status, json) => ({ ok: status >= 200 && status < 300, status, json: async () => json });
  const fetch = async (url, init) => {
    if (opts.offline) throw new TypeError('Failed to fetch');
    const u = new URL(url);
    assert.strictEqual(init.headers.Authorization, 'Bearer TOK');
    assert.strictEqual(init.headers.Accept, 'application/vnd.github+json');
    const m = u.pathname.match(/^\/repos\/huynhgia3004-hub\/Bepnhamuoi(?:\/contents\/(.+))?$/);
    assert.ok(m, 'bad url ' + url);
    if (!m[1]) return res(200, { permissions: { push: opts.noPush ? false : true } });
    const path = decodeURIComponent(m[1]);
    const body = init.body ? JSON.parse(init.body) : null;
    log.push({ method: init.method, path, body });
    if (init.method === 'GET') {
      assert.strictEqual(u.searchParams.get('ref'), 'main');
      return files[path] ? res(200, { content: files[path].b64, sha: files[path].sha }) : res(404, { message: 'Not Found' });
    }
    assert.strictEqual(body.branch, 'main');
    assert.ok(/^[\x20-\x7e]+$/.test(body.message), 'commit msg ascii');
    if (init.method === 'PUT') {
      if (path === 'data/products.json' && conflictsLeft > 0) { conflictsLeft--; put(path, files[path] ? C.b64ToUtf8(files[path].b64) : '{}'); return res(409, { message: 'conflict' }); }
      if (files[path] && body.sha !== files[path].sha) return res(409, { message: 'sha mismatch' });
      if (!files[path] && body.sha) return res(422, { message: 'bad' });
      put(path, body.content, true); return res(200, {});
    }
    if (init.method === 'DELETE') {
      if (!files[path]) return res(404, {});
      if (body.sha !== files[path].sha) return res(409, {});
      delete files[path]; return res(200, {});
    }
  };
  return { fetch, files, log, read: () => JSON.parse(C.b64ToUtf8(files['data/products.json'].b64)) };
}

test('slug', () => {
  assert.strictEqual(C.slug('Bánh Kem Socola'), 'banh-kem-socola');
  assert.strictEqual(C.slug('Đào'), 'dao');
  assert.strictEqual(C.slug('  Trà & Đồ Uống!! '), 'tra-do-uong');
});

test('parsePrice/formatPrice', () => {
  assert.strictEqual(C.parsePrice('320.000đ'), 320000);
  assert.strictEqual(C.parsePrice('320,000'), 320000);
  assert.strictEqual(C.parsePrice('320000'), 320000);
  assert.strictEqual(C.parsePrice(320000), 320000);
  assert.ok(isNaN(C.parsePrice('')));
  assert.strictEqual(C.formatPrice(320000), '320.000');
  assert.strictEqual(C.formatPrice(1250000), '1.250.000');
  assert.strictEqual(C.formatPrice(500), '500');
  assert.strictEqual(C.parsePrice(C.formatPrice(1234567)), 1234567);
});

test('nextId', () => {
  assert.strictEqual(C.nextId([{ id: 'p08' }]), 'p09');
  assert.strictEqual(C.nextId([{ id: 'p01' }, { id: 'p05' }]), 'p06');
  assert.strictEqual(C.nextId([]), 'p01');
  assert.strictEqual(C.nextId([{ id: 'p99' }]), 'p100');
});

test('utf8 base64 round trip', () => {
  const s = 'Bánh Kem Đào — Trà & Đồ Uống ✓ ' + 'ặ'.repeat(50000);
  assert.strictEqual(C.b64ToUtf8(C.utf8ToB64(s)), s);
});

test('upsert/delete preserve shop, categories, key order', () => {
  const d = base();
  const r = C.upsertProduct(d, { name: 'Mới', category: 'tea', price: 1000, image: 'assets/products/x.jpg', desc: 'd', featured: false, hidden: true }, null);
  assert.deepStrictEqual(Object.keys(r.data), ['shop', 'categories', 'products']);
  assert.deepStrictEqual(r.data.shop, d.shop);
  assert.deepStrictEqual(r.data.categories, d.categories);
  assert.strictEqual(r.data.products.length, 3);
  assert.strictEqual(r.data.products[2].id, 'p09');
  assert.deepStrictEqual(Object.keys(r.data.products[2]), ['id', 'name', 'category', 'price', 'image', 'desc', 'featured', 'hidden']);
  assert.strictEqual(d.products.length, 2, 'input not mutated');
  const e = C.upsertProduct(r.data, { name: 'Sửa', hidden: false, price: 2000 }, 'p09');
  assert.deepStrictEqual(Object.keys(e.data.products[2]), ['id', 'name', 'category', 'price', 'image', 'desc', 'featured']);
  assert.strictEqual(e.data.products[2].price, 2000);
  assert.strictEqual(e.oldImage, 'assets/products/x.jpg');
  const x = C.deleteProduct(e.data, 'p01');
  assert.strictEqual(x.removed.id, 'p01');
  assert.deepStrictEqual(x.data.shop, d.shop);
  assert.deepStrictEqual(x.data.categories, d.categories);
  assert.deepStrictEqual(x.data.products.map(p => p.id), ['p08', 'p09']);
});

test('canDeleteImage', () => {
  const ps = [{ image: 'assets/products/used.jpg' }];
  assert.strictEqual(C.canDeleteImage('assets/products/used.jpg', ps), false);
  assert.strictEqual(C.canDeleteImage('assets/products/placeholder-1.svg', ps), false);
  assert.strictEqual(C.canDeleteImage('assets/logo.jpg', ps), false);
  assert.strictEqual(C.canDeleteImage('assets/products/free.jpg', ps), true);
});

test('add flow: image PUT then products.json PUT with correct sha', async () => {
  const m = mockRepo(base());
  const api = C.createApi({ fetch: m.fetch, token: 'TOK' });
  await C.validateToken(api);
  const shaBefore = m.files['data/products.json'].sha;
  const res = await C.saveProduct(api, {
    id: null, imageB64: C.utf8ToB64('JPEGDATA'), imageName: 'banh-moi-1.jpg',
    fields: { name: 'Bánh Mới', category: 'banh-kem', price: 99000, desc: 'Ngon', featured: true }
  });
  const puts = m.log.filter(l => l.method === 'PUT');
  assert.strictEqual(puts[0].path, 'assets/products/banh-moi-1.jpg');
  assert.strictEqual(puts[0].body.sha, undefined);
  assert.strictEqual(puts[0].body.message, 'Them anh banh-moi');
  assert.strictEqual(puts[1].path, 'data/products.json');
  assert.strictEqual(puts[1].body.sha, shaBefore);
  assert.strictEqual(puts[1].body.message, 'Them san pham banh-moi');
  const saved = m.read();
  assert.deepStrictEqual(saved.shop, base().shop);
  assert.deepStrictEqual(saved.products[2], { id: 'p09', name: 'Bánh Mới', category: 'banh-kem', price: 99000, image: 'assets/products/banh-moi-1.jpg', desc: 'Ngon', featured: true });
  assert.strictEqual(res.product.id, 'p09');
  assert.ok(C.b64ToUtf8(puts[1].body.content).endsWith('}\n'));
  assert.ok(C.b64ToUtf8(puts[1].body.content).includes('Bánh Mới'));
});

test('409 retry path re-applies change', async () => {
  const m = mockRepo(base(), { conflicts: 2 });
  const api = C.createApi({ fetch: m.fetch, token: 'TOK' });
  await C.saveProduct(api, { id: 'p01', fields: { name: 'Dâu 2', price: 1 } });
  assert.strictEqual(m.log.filter(l => l.method === 'PUT').length, 3);
  assert.strictEqual(m.read().products[0].name, 'Dâu 2');
  const m2 = mockRepo(base(), { conflicts: 3 });
  await assert.rejects(C.saveProduct(C.createApi({ fetch: m2.fetch, token: 'TOK' }), { id: 'p01', fields: { name: 'Z' } }), e => e.kind === 'conflict');
});

test('edit with new image deletes old image (not placeholder)', async () => {
  const m = mockRepo(base());
  const api = C.createApi({ fetch: m.fetch, token: 'TOK' });
  await C.saveProduct(api, { id: 'p08', imageB64: C.utf8ToB64('NEW'), imageName: 'n.jpg', fields: { name: 'Trà Đào' } });
  assert.ok(!m.files['assets/products/tra-dao-abc.jpg']);
  assert.ok(m.files['assets/products/n.jpg']);
  assert.strictEqual(m.read().products[1].image, 'assets/products/n.jpg');
});

test('delete flow removes product and its image; placeholder kept', async () => {
  const m = mockRepo(base());
  const api = C.createApi({ fetch: m.fetch, token: 'TOK' });
  await C.removeProduct(api, 'p08', 'Trà Đào');
  assert.deepStrictEqual(m.read().products.map(p => p.id), ['p01']);
  assert.ok(!m.files['assets/products/tra-dao-abc.jpg']);
  assert.ok(m.log.some(l => l.method === 'DELETE'));
  m.log.length = 0;
  await C.removeProduct(api, 'p01', 'Bánh Kem Dâu');
  assert.ok(!m.log.some(l => l.method === 'DELETE'));
  assert.deepStrictEqual(m.read().products, []);
});

test('error kinds: auth, network, noperm', async () => {
  const bad = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Bad credentials' }) });
  await assert.rejects(C.loadData(C.createApi({ fetch: bad, token: 'x' })), e => e.kind === 'auth');
  const off = mockRepo(base(), { offline: true });
  await assert.rejects(C.loadData(C.createApi({ fetch: off.fetch, token: 'TOK' })), e => e.kind === 'network');
  const np = mockRepo(base(), { noPush: true });
  await assert.rejects(C.validateToken(C.createApi({ fetch: np.fetch, token: 'TOK' })), e => e.kind === 'noperm');
  assert.strictEqual(C.friendlyReason({ kind: 'auth' }), 'mã quản lý hết hạn');
  assert.strictEqual(C.friendlyReason({ kind: 'network' }), 'mất mạng');
});

test('PIN encrypt/decrypt', async () => {
  const blob = await C.encryptToken('ghp_secret', '1234');
  assert.deepStrictEqual(Object.keys(blob).sort(), ['ct', 'iv', 'salt']);
  assert.ok(!JSON.stringify(blob).includes('ghp_secret'));
  assert.strictEqual(await C.decryptToken(blob, '1234'), 'ghp_secret');
  await assert.rejects(C.decryptToken(blob, '9999'));
});

(async () => {
  for (const t of queue) {
    try { await t.fn(); pass++; console.log('PASS ' + t.name); }
    catch (e) { fail++; console.log('FAIL ' + t.name + '\n  ' + (e && e.stack || e)); }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
