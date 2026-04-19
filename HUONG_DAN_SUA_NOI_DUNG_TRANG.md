# ✏️ Hướng Dẫn Sửa Nội Dung Trang — Bếp Nhà Muội

**Dành cho:** Chủ cửa hàng (không cần biết code)
**Cần biết trước:** đã đọc `HUONG_DAN_CAP_NHAT_SAN_PHAM.md` (biết cách bấm cây bút chì ✏️ sửa file + Commit)
**Thời gian mỗi lần sửa:** ~2 phút

---

## 📑 Các nội dung thường sửa

1. [Đổi địa chỉ, SĐT, Zalo, Facebook (sửa 1 nơi, tự đồng bộ toàn trang)](#1-đổi-địa-chỉ-sđt-zalo-facebook)
2. [Đổi giờ mở cửa](#2-đổi-giờ-mở-cửa)
3. [Đổi tiêu đề trang chủ / câu slogan](#3-đổi-tiêu-đề-trang-chủ--slogan)
4. [Đổi phần "Về chúng tôi"](#4-đổi-phần-về-chúng-tôi)
5. [Đổi danh mục sản phẩm (Bánh Kem, Trà, ...)](#5-đổi-danh-mục-sản-phẩm)
6. [Đổi tên cửa hàng](#6-đổi-tên-cửa-hàng)
7. [Đổi số liệu "50+ món bánh / 100% thủ công"](#7-đổi-số-liệu-50-món-bánh)

---

## 🧭 Hai file cần biết

| File | Nội dung |
|---|---|
| `data/products.json` | Thông tin chung cửa hàng (tên, SĐT, địa chỉ, Zalo, FB) → **sửa 1 chỗ, web tự cập nhật mọi nơi** |
| `index.html` | Văn bản cố định ở trang chủ (About us, tiêu đề, giờ mở cửa, số liệu) |
| `products.html` | Văn bản cố định ở trang Thực đơn (thường không cần sửa) |

**Quy tắc vàng:** luôn ưu tiên sửa `products.json` trước — vì đổi ở đó thì mọi trang tự cập nhật. Chỉ khi không tìm thấy ở `products.json` mới sửa `index.html`.

---

## 1. Đổi địa chỉ, SĐT, Zalo, Facebook

**File:** `data/products.json`

Mở file → bấm ✏️ → xem khối đầu tiên tên `"shop"`:

```json
"shop": {
  "name": "Bếp Nhà Muội",
  "tagline": "Tea & Bakery — An Nhơn",
  "address": "356 Ngô Gia Tự, An Nhơn, Việt Nam",
  "phone": "0933402327",
  "phoneDisplay": "0933 402 327",
  "zalo": "0933402327",
  "facebookId": "100063909225074",
  "facebookUrl": "https://www.facebook.com/profile.php?id=100063909225074"
}
```

### Muốn đổi gì — sửa trường nào?

| Muốn đổi | Sửa trường |
|---|---|
| Địa chỉ hiển thị | `"address"` |
| Số điện thoại (dạng bấm gọi) | `"phone"` (**không có khoảng trắng**) |
| Số điện thoại (dạng hiển thị đẹp) | `"phoneDisplay"` (có khoảng trắng cho dễ đọc) |
| Số Zalo | `"zalo"` (không khoảng trắng) — thường giống `"phone"` |
| Link Facebook | `"facebookUrl"` — copy full link từ trình duyệt |

### ⚠ Lưu ý quan trọng

- Mỗi giá trị phải nằm trong **2 dấu ngoặc kép**: `"..."`
- Cuối mỗi dòng (trừ dòng cuối khối) có **dấu phẩy `,`**
- `"phone"` và `"zalo"` **KHÔNG được có khoảng trắng** — chỉ chữ số, vì dùng để tạo link `tel:` và `zalo.me/...`
- `"phoneDisplay"` thì CÓ khoảng trắng cho đẹp — đây là phần người dùng nhìn thấy

### Ví dụ — đổi sang số mới `0908123456`

Sửa thành:
```json
"phone": "0908123456",
"phoneDisplay": "0908 123 456",
"zalo": "0908123456",
```

Commit → 1 phút sau, tất cả 15+ chỗ hiển thị SĐT trên website (header, footer, nút Zalo, trang liên hệ, nút nổi bên phải màn hình) đều tự đổi.

---

## 2. Đổi giờ mở cửa

**File:** `index.html` và `products.html` (cả hai file đều có)

Mở `index.html` → Ctrl+F tìm: `7:00 — 22:00`

Bạn sẽ thấy **2 chỗ** cần sửa:

### Chỗ 1 — Phần Liên hệ (gần cuối trang)
```html
<h4>Giờ mở cửa</h4>
<p>Hằng ngày: 7:00 — 22:00</p>
```

### Chỗ 2 — Footer
```html
<h4>Giờ mở cửa</h4>
<p>Thứ 2 — Chủ Nhật</p>
<p>7:00 — 22:00</p>
```

**Đổi** thành giờ thực tế, VD: `6:00 — 21:00`. Làm tương tự cho `products.html`.

### Mẹo
- Đóng cửa Chủ Nhật? Sửa "Hằng ngày" thành "Thứ 2 — Thứ 7"
- Giờ khác nhau các ngày? VD:
  ```html
  <p>T2–T6: 7:00 — 22:00</p>
  <p>T7–CN: 8:00 — 23:00</p>
  ```

---

## 3. Đổi tiêu đề trang chủ / slogan

**File:** `index.html`

Tìm đoạn Hero (đầu trang chủ):

```html
<span class="hero-kicker">★ Tea & Bakery — An Nhơn</span>
<h1>Bánh ngọt <em>thủ công</em>,<br/>trà tươi mỗi ngày.</h1>
<p data-shop-tagline>Mỗi chiếc bánh là một câu chuyện — được nướng bằng tâm, phục vụ bằng nụ cười.</p>
```

| Muốn đổi | Sửa |
|---|---|
| Dòng nhỏ phía trên tiêu đề (kicker) | Phần `★ Tea & Bakery — An Nhơn` |
| Tiêu đề lớn (h1) | Phần `Bánh ngọt thủ công, trà tươi mỗi ngày.` — giữ `<em>` và `<br/>` nếu muốn chữ nghiêng + xuống dòng |
| Câu mô tả dưới tiêu đề | Phần giữa `<p data-shop-tagline>...</p>` |

### Ví dụ — đổi slogan
```html
<h1>Mẻ bánh <em>mới</em>,<br/>mỗi sáng.</h1>
```

- `<em>` bao quanh chữ nào → chữ đó sẽ nghiêng và có màu vàng caramel
- `<br/>` là xuống dòng

---

## 4. Đổi phần "Về chúng tôi"

**File:** `index.html` — tìm `id="about"`:

```html
<section class="about" id="about">
  <div class="container about-grid">
    <div class="about-image">🥐</div>
    <div>
      <span class="hero-kicker">Về chúng tôi</span>
      <h2>Nơi hương vị gặp sự ấm áp.</h2>
      <p>Bếp Nhà Muội ra đời từ tình yêu với bánh trái...</p>
      <p>Chúng tôi tin rằng một chiếc bánh ngon không chỉ ở hương vị...</p>
      ...
```

Bạn có thể sửa bất kỳ phần nào:

| Vị trí | Nội dung |
|---|---|
| `🥐` | Biểu tượng emoji to — đổi thành emoji khác VD: `🧁`, `🍰`, `☕`, `🥖` |
| `Về chúng tôi` | Label nhỏ phía trên |
| `Nơi hương vị gặp sự ấm áp.` | Tiêu đề phần About |
| 2 thẻ `<p>...</p>` | 2 đoạn mô tả |

### ⚠ Cảnh báo
- **KHÔNG** xóa các thẻ `<div>`, `<section>`, `<span>`, `<h2>`, `<p>` — chỉ sửa chữ giữa các thẻ
- Nếu muốn **thêm đoạn văn**: copy cả 1 dòng `<p>...</p>` rồi dán xuống dưới, sửa nội dung

### Ví dụ — thêm đoạn thứ 3

Sau:
```html
<p>Chúng tôi tin rằng...</p>
```

Thêm:
```html
<p>Mỗi sáng, bếp chúng tôi thức dậy lúc 4 giờ để mẻ bánh đầu tiên ra lò lúc 7 giờ.</p>
```

---

## 5. Đổi danh mục sản phẩm

**File:** `data/products.json`

Tìm khối `"categories"`:

```json
"categories": [
  { "id": "banh-kem", "name": "Bánh Kem" },
  { "id": "banh-nuong", "name": "Bánh Nướng" },
  { "id": "cheesecake", "name": "Cheesecake" },
  { "id": "tea", "name": "Trà & Đồ Uống" },
  { "id": "cookies", "name": "Cookies & Bánh Ngọt" }
]
```

### Muốn thêm danh mục mới (VD: "Sữa Chua")

Thêm 1 dòng:
```json
{ "id": "sua-chua", "name": "Sữa Chua" }
```

**⚠ Nhớ dấu phẩy** ở dòng trước.

### Muốn đổi tên hiển thị

Chỉ đổi `"name"` — **KHÔNG đổi `"id"`** (nếu đổi `id` sẽ phải sửa lại trong tất cả sản phẩm dùng danh mục đó).

Ví dụ: đổi `"Cookies & Bánh Ngọt"` → `"Bánh Quy"`:
```json
{ "id": "cookies", "name": "Bánh Quy" }
```

### Muốn xóa danh mục

**Lưu ý:** nếu còn sản phẩm nào đang dùng danh mục đó, phải đổi danh mục của chúng trước, nếu không sản phẩm sẽ bị "lạc" (hiển thị không có tên danh mục).

---

## 6. Đổi tên cửa hàng

**File:** `data/products.json` — sửa trường `"name"` trong khối `"shop"`:

```json
"shop": {
  "name": "Bếp Nhà Muội",
  ...
```

Đổi sang tên mới → Commit → toàn bộ web tự cập nhật (header, footer, title tab trình duyệt).

### ⚠ Cảnh báo thêm
- Tên xuất hiện **lớn** trên Hero trang chủ KHÔNG đọc từ JSON — mà viết thẳng trong `index.html`. Cần sửa thêm:
  ```html
  <span>Bếp Nhà Muội</span>
  ```
  → thành tên mới, trong header và footer.

- Tab browser title (`<title>...</title>`) ở đầu mỗi HTML cũng sửa thủ công.

---

## 7. Đổi số liệu "50+ món bánh"

**File:** `index.html` — tìm:

```html
<div class="about-stats">
  <div class="stat"><div class="num">50+</div><div class="lbl">Món bánh</div></div>
  <div class="stat"><div class="num">100%</div><div class="lbl">Thủ công</div></div>
  <div class="stat"><div class="num">Mỗi ngày</div><div class="lbl">Tươi mới</div></div>
</div>
```

- `<div class="num">...</div>` → con số to (màu vàng)
- `<div class="lbl">...</div>` → nhãn chữ nhỏ bên dưới

### Ví dụ — đổi thành số cụ thể
```html
<div class="stat"><div class="num">100+</div><div class="lbl">Món bánh</div></div>
<div class="stat"><div class="num">5</div><div class="lbl">Năm kinh nghiệm</div></div>
<div class="stat"><div class="num">4.9★</div><div class="lbl">Đánh giá FB</div></div>
```

---

## ✅ Kiểm tra trước khi Commit

Sau mỗi lần sửa, hãy tự check:

- [ ] Không xóa nhầm các thẻ `<...>` mở/đóng
- [ ] Nếu sửa `products.json`: kiểm tra dấu phẩy, dấu ngoặc kép bằng https://jsonlint.com
- [ ] Mỗi commit 1 việc — nếu đổi nhiều chỗ nên chia thành nhiều commit nhỏ (VD: "Đổi giờ mở cửa", "Đổi about us") để dễ revert nếu lỗi
- [ ] Commit message có ý nghĩa (tiếng Việt không dấu): "Doi gio mo cua", "Them doan ve chung toi"

---

## 🔙 Lỡ tay sửa sai?

1. Trang repo GitHub → bấm **"Commits"** (biểu tượng đồng hồ nhỏ)
2. Tìm commit lúc web còn chạy đúng
3. Bấm vào commit → bấm **"..."** → **Revert** → OK

Hoặc: mở file → cây bút chì → Ctrl+Z (Undo) trước khi Commit.

Hoặc: báo Pháp, Pháp sẽ rollback bằng git.

---

## 🎨 Muốn thay đổi màu sắc / font chữ?

Đây là việc phức tạp hơn — **cần Pháp hỗ trợ**, đừng tự sửa. File liên quan: `css/style.css` (250+ dòng). Sai 1 dòng có thể làm cả trang biến dạng.

Nếu muốn đổi ý tưởng về màu sắc, chỉ cần mô tả bằng lời (VD: "tone xanh lá nhẹ nhàng như quán trà"), Pháp sẽ đổi toàn bộ trong 5 phút.

---

## 📞 Cần giúp đỡ?

Chụp màn hình lỗi / phần muốn sửa → gửi cho Pháp (0xxx) → Pháp sẽ hướng dẫn cụ thể hoặc sửa giúp.

---

**Chúc nội dung trang luôn tươi mới cùng bánh của bạn!** 🥐

*Cập nhật lần cuối: Apr 2026*
