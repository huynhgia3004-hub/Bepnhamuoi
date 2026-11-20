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
  const files = {}; let shaN = 0; const log = []; let conflictsLeft = opts.conflicts || 0; let keyConflictsLeft = opts.keyConflicts || 0;
  const put = (p, text, isB64) => { files[p] = { b64: isB64 ? text : C.utf8ToB64(text), sha: 'sha' + (++shaN) }; };
  put('data/products.json', C.serialize(initialData));
  put('assets/products/tra-dao-abc.jpg', 'IMG', false);
  const res = (status, json) => ({ ok: status >= 200 && status < 300, status, json: async () => json });
  const fetch = async (url, init) => {
    if (opts.offline) throw new TypeError('Failed to fetch');
    const u = new URL(url);
    const unauthKeyGet = init.method === 'GET' && /admin-key\.json/.test(url) && !init.headers.Authorization;
    if (!unauthKeyGet) assert.strictEqual(init.headers.Authorization, 'Bearer TOK');
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
      if (path === 'data/admin-key.json' && keyConflictsLeft > 0) { keyConflictsLeft--; put(path, C.b64ToUtf8(files[path].b64)); return res(409, { message: 'conflict' }); }
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

const keyJson = (m) => JSON.parse(C.b64ToUtf8(m.files['data/admin-key.json'].b64));
const apiOf = (m) => C.createApi({ fetch: m.fetch, token: 'TOK' });

test('password encrypt/decrypt round trip, file format', async () => {
  const blob = await C.encryptToken('ghp_secret', 'matkhau-dai');
  assert.deepStrictEqual(Object.keys(blob), ['v', 'kdf', 'iter', 'salt', 'iv', 'ct']);
  assert.strictEqual(blob.v, 1);
  assert.strictEqual(blob.kdf, 'PBKDF2-SHA256');
  assert.strictEqual(blob.iter, 600000);
  assert.strictEqual(C.b64ToBytes(blob.salt).length, 16);
  assert.strictEqual(C.b64ToBytes(blob.iv).length, 12);
  assert.ok(!JSON.stringify(blob).includes('ghp_secret'));
  assert.strictEqual(await C.decryptToken(blob, 'matkhau-dai'), 'ghp_secret');
});

test('wrong password fails with badpw', async () => {
  const blob = await C.encryptToken('ghp_secret', 'matkhau-dai');
  await assert.rejects(C.decryptToken(blob, 'matkhau-sai!'), e => e.kind === 'badpw');
  const bad = Object.assign({}, blob, { ct: C.bytesToB64(new Uint8Array(30)) });
  await assert.rejects(C.decryptToken(bad, 'matkhau-dai'), e => e.kind === 'badpw');
});

test('passwordProblem: min length, match, differs from old', () => {
  assert.strictEqual(C.MIN_PW, 8);
  assert.strictEqual(C.passwordProblem('1234567'), 'Password phải có ít nhất 8 ký tự — càng dài càng an toàn');
  assert.strictEqual(C.passwordProblem(''), C.PW_HINT);
  assert.strictEqual(C.passwordProblem('12345678'), null);
  assert.ok(C.passwordProblem('12345678', '12345679'));
  assert.strictEqual(C.passwordProblem('12345678', '12345678'), null);
  assert.ok(C.passwordProblem('12345678', '12345678', '12345678'));
  assert.strictEqual(C.passwordProblem('12345678', '12345678', 'abcdefgh'), null);
});

test('setup flow (no key yet): PUT without sha, token round-trips', async () => {
  const m = mockRepo(base());
  const api = apiOf(m);
  await C.validateToken(api);
  await C.setupPassword(api, 'TOK', 'mat-khau-1', 'mat-khau-1');
  const put = m.log.find(l => l.method === 'PUT' && l.path === 'data/admin-key.json');
  assert.strictEqual(put.body.sha, undefined);
  assert.strictEqual(put.body.message, 'Dat password quan ly');
  assert.strictEqual(put.body.branch, 'main');
  const k = keyJson(m);
  assert.strictEqual(k.v, 1); assert.strictEqual(k.iter, 600000);
  assert.strictEqual(await C.decryptToken(k, 'mat-khau-1'), 'TOK');
  assert.ok(C.b64ToUtf8(m.files['data/admin-key.json'].b64).endsWith('}\n'));
});

test('setup flow overwrite (key exists): PUT carries sha; short/mismatch rejected', async () => {
  const m = mockRepo(base());
  const api = apiOf(m);
  await C.setupPassword(api, 'TOK', 'mat-khau-1');
  const sha1 = m.files['data/admin-key.json'].sha;
  await C.setupPassword(api, 'TOK', 'mat-khau-2');
  const puts = m.log.filter(l => l.method === 'PUT' && l.path === 'data/admin-key.json');
  assert.strictEqual(puts[1].body.sha, sha1);
  assert.strictEqual(await C.decryptToken(keyJson(m), 'mat-khau-2'), 'TOK');
  await assert.rejects(C.decryptToken(keyJson(m), 'mat-khau-1'), e => e.kind === 'badpw');
  await assert.rejects(C.setupPassword(api, 'TOK', 'short'), e => e.kind === 'invalid');
  await assert.rejects(C.setupPassword(api, 'TOK', 'mat-khau-3', 'khac-nhau-3'), e => e.kind === 'invalid');
  assert.strictEqual(m.log.filter(l => l.method === 'PUT' && l.path === 'data/admin-key.json').length, 2);
});

test('change password: old fails, new works, token same, new salt/iv', async () => {
  const m = mockRepo(base());
  const api = apiOf(m);
  await C.setupPassword(api, 'TOK', 'mat-khau-cu');
  const before = keyJson(m);
  const tk = await C.changePassword(api, 'mat-khau-cu', 'mat-khau-moi', 'mat-khau-moi');
  assert.strictEqual(tk, 'TOK');
  const after = keyJson(m);
  assert.notStrictEqual(after.salt, before.salt);
  assert.notStrictEqual(after.iv, before.iv);
  const last = m.log.filter(l => l.method === 'PUT').pop();
  assert.strictEqual(last.body.message, 'Doi password quan ly');
  await assert.rejects(C.decryptToken(after, 'mat-khau-cu'), e => e.kind === 'badpw');
  assert.strictEqual(await C.decryptToken(after, 'mat-khau-moi'), 'TOK');
  const n = m.log.length;
  await assert.rejects(C.changePassword(api, 'sai-sai-sai', 'mat-khau-moi2'), e => e.kind === 'badpw');
  assert.ok(!m.log.slice(n).some(l => l.method === 'PUT'), 'wrong old password writes nothing');
  await assert.rejects(C.changePassword(api, 'mat-khau-moi', 'ngan'), e => e.kind === 'invalid');
  await assert.rejects(C.changePassword(api, 'mat-khau-moi', 'mat-khau-moi'), e => e.kind === 'invalid');
  await assert.rejects(C.changePassword(api, 'mat-khau-moi', 'mat-khau-x1', 'mat-khau-x2'), e => e.kind === 'invalid');
});

test('change password retries on 409 (max 2), then gives up', async () => {
  const seed = mockRepo(base());
  await C.setupPassword(apiOf(seed), 'TOK', 'mat-khau-cu');
  const m2 = mockRepo(base(), { keyConflicts: 2 });
  m2.files['data/admin-key.json'] = seed.files['data/admin-key.json'];
  await C.changePassword(apiOf(m2), 'mat-khau-cu', 'mat-khau-moi');
  assert.strictEqual(m2.log.filter(l => l.method === 'PUT').length, 3);
  assert.strictEqual(await C.decryptToken(keyJson(m2), 'mat-khau-moi'), 'TOK');
  const m3 = mockRepo(base(), { keyConflicts: 3 });
  m3.files['data/admin-key.json'] = seed.files['data/admin-key.json'];
  await assert.rejects(C.changePassword(apiOf(m3), 'mat-khau-cu', 'mat-khau-moi'), e => e.kind === 'conflict');
});

test('readKeyFile: API first (unauthenticated), 404 => no-key', async () => {
  const m = mockRepo(base());
  await C.setupPassword(apiOf(m), 'TOK', 'mat-khau-1');
  const seen = [];
  const f = async (url, init) => { seen.push({ url, auth: init && init.headers && init.headers.Authorization }); return m.fetch(url, init); };
  const r = await C.readKeyFile({ fetch: f });
  assert.strictEqual(r.state, 'ok');
  assert.strictEqual(r.sha, m.files['data/admin-key.json'].sha);
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(seen[0].auth, undefined);
  assert.ok(seen[0].url.startsWith('https://api.github.com/repos/huynhgia3004-hub/Bepnhamuoi/contents/data/admin-key.json?ref=main'));
  assert.strictEqual(await C.loginWithPassword('mat-khau-1', { fetch: f }), 'TOK');
  await assert.rejects(C.loginWithPassword('mat-khau-sai', { fetch: f }), e => e.kind === 'badpw');
  const empty = mockRepo(base());
  assert.deepStrictEqual(await C.readKeyFile({ fetch: empty.fetch }), { state: 'no-key' });
  await assert.rejects(C.loginWithPassword('mat-khau-1', { fetch: empty.fetch }), e => e.kind === 'nokey');
});

test('readKeyFile: falls back to same-origin when API fails', async () => {
  const m = mockRepo(base());
  await C.setupPassword(apiOf(m), 'TOK', 'mat-khau-1');
  const text = C.b64ToUtf8(m.files['data/admin-key.json'].b64);
  const urls = [];
  const mk = (apiStatus, localStatus) => async (url) => {
    urls.push(url);
    if (url.startsWith('https://api.github.com')) {
      if (apiStatus === 'net') throw new TypeError('Failed to fetch');
      return { ok: false, status: apiStatus, json: async () => ({ message: 'x' }) };
    }
    return { ok: localStatus === 200, status: localStatus, text: async () => text };
  };
  for (const apiFail of [403, 500, 'net']) {
    urls.length = 0;
    const r = await C.readKeyFile({ fetch: mk(apiFail, 200) });
    assert.strictEqual(r.state, 'ok');
    assert.strictEqual(r.sha, null);
    assert.strictEqual(urls.length, 2);
    assert.ok(/^data\/admin-key\.json\?t=\d+$/.test(urls[1]));
    assert.strictEqual(await C.decryptToken(r.blob, 'mat-khau-1'), 'TOK');
  }
  assert.deepStrictEqual(await C.readKeyFile({ fetch: mk(500, 404) }), { state: 'no-key' });
  await assert.rejects(C.readKeyFile({ fetch: mk('net', 500) }), e => e.kind === 'other');
});

(async () => {
  for (const t of queue) {
    try { await t.fn(); pass++; console.log('PASS ' + t.name); }
    catch (e) { fail++; console.log('FAIL ' + t.name + '\n  ' + (e && e.stack || e)); }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
