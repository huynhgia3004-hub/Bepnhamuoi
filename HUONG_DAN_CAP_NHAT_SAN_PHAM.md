# 📖 Hướng Dẫn Cập Nhật Sản Phẩm — Bếp Nhà Muội

**Dành cho:** Chủ cửa hàng (không cần biết code)
**Thời gian mỗi lần cập nhật:** ~3 phút
**Cần chuẩn bị:** Ảnh sản phẩm (điện thoại hoặc máy ảnh) + tài khoản GitHub đã có

---

## 📋 Mục Lục

1. [Chuẩn bị ảnh](#1-chuẩn-bị-ảnh-sản-phẩm)
2. [Đăng nhập GitHub](#2-đăng-nhập-github)
3. [Thêm sản phẩm mới](#3-thêm-sản-phẩm-mới)
4. [Xóa sản phẩm](#4-xóa-sản-phẩm)
5. [Sửa giá / mô tả sản phẩm](#5-sửa-giá--mô-tả-sản-phẩm)
6. [Thay ảnh sản phẩm cũ](#6-thay-ảnh-sản-phẩm-cũ)
7. [Xem kết quả trên website](#7-xem-kết-quả-trên-website)
8. [Những lỗi hay gặp](#8-những-lỗi-hay-gặp)

---

## 1. Chuẩn bị ảnh sản phẩm

### ✅ Yêu cầu ảnh
- **Định dạng:** JPG, PNG, hoặc WebP
- **Kích thước:** Khuyên 800×600 đến 1600×1200 pixel
- **Dung lượng:** Nên dưới 500 KB (ảnh to sẽ làm web chậm)

### 💡 Mẹo
- Chụp ảnh **sáng, rõ, nền đơn giản**
- Nếu ảnh điện thoại quá to, dùng **tinypng.com** (miễn phí) để nén lại
- **Đặt tên ảnh không dấu, không khoảng trắng**:
  - ✅ `banh-kem-dau.jpg`
  - ✅ `cheesecake-chanh-day.jpg`
  - ❌ `Bánh Kem Dâu.jpg` (có dấu + khoảng trắng → gây lỗi)
  - ❌ `IMG_1234.jpg` (không ý nghĩa → khó nhớ sau này)

---

## 2. Đăng nhập GitHub

1. Mở trình duyệt, vào: **https://github.com/huynhgia3004-hub/Bepnhamuoi**
2. Nếu chưa đăng nhập → bấm **Sign in** (góc trên bên phải) → nhập username + password
3. Sau khi đăng nhập, bạn sẽ thấy danh sách các file của website

### 📁 Các thư mục bạn cần biết

| Thư mục/File | Ý nghĩa |
|---|---|
| `assets/products/` | Nơi chứa **tất cả ảnh sản phẩm** |
| `data/products.json` | File chứa **danh sách sản phẩm** (tên, giá, mô tả) |

Chỉ cần thao tác với 2 chỗ này là đủ.

---

## 3. Thêm sản phẩm mới

### Bước 3.1 — Upload ảnh

1. Trên trang GitHub, bấm vào thư mục **`assets`** → rồi bấm **`products`**
2. Góc phải bấm nút **Add file** (màu xanh) → chọn **Upload files**
3. Kéo ảnh từ máy tính thả vào ô "Drag files here" (hoặc bấm "choose your files")
4. Xuống dưới, trong ô **"Commit changes"**:
   - Ô trên: gõ `Them anh [tên sản phẩm]` (VD: `Them anh banh kem dau`)
   - Bấm nút xanh **Commit changes** ở cuối
5. ✅ Ảnh đã lên repo. Ghi nhớ **tên file ảnh** (VD: `banh-kem-dau.jpg`) — bước sau cần dùng.

### Bước 3.2 — Thêm sản phẩm vào danh sách

1. Quay về trang gốc repo (bấm "Bepnhamuoi" ở đầu trang)
2. Bấm vào thư mục **`data`** → rồi bấm file **`products.json`**
3. Bấm biểu tượng **cây bút chì ✏️** (góc phải, để sửa)
4. Bạn sẽ thấy nội dung file. Kéo xuống phần `"products": [` — đây là danh sách sản phẩm.
5. Mỗi sản phẩm là một khối như sau:
   ```json
   {
     "id": "p08",
     "name": "Matcha Latte",
     "category": "tea",
     "price": 48000,
     "image": "assets/products/placeholder-8.svg",
     "desc": "Matcha Nhật thượng hạng, sữa tươi béo nhẹ.",
     "featured": false
   },
   ```
6. **Copy toàn bộ 1 khối như trên** (bao gồm cả dấu `{` và `},`), dán xuống cuối danh sách, **trước dấu `]` đóng**.
7. **Chỉnh sửa các giá trị** trong khối vừa dán:

| Trường | Giải thích | Ví dụ |
|---|---|---|
| `id` | Mã duy nhất — **không được trùng** với sản phẩm khác | `"p09"` (tăng dần) |
| `name` | Tên hiển thị trên web | `"Bánh Mì Que"` |
| `category` | Danh mục — phải là **một trong 5 giá trị** bên dưới | `"banh-nuong"` |
| `price` | Giá bằng số, không có chấm/dấu phẩy | `15000` (không phải `"15.000₫"`) |
| `image` | Đường dẫn đến ảnh vừa upload | `"assets/products/banh-mi-que.jpg"` |
| `desc` | Mô tả ngắn, trong 1–2 câu | `"Giòn rụm, nhân pate đậm đà."` |
| `featured` | `true` = hiển thị ở trang chủ, `false` = chỉ trong thực đơn | `true` hoặc `false` |

**5 giá trị hợp lệ cho `category`:**
- `"banh-kem"` — Bánh Kem
- `"banh-nuong"` — Bánh Nướng
- `"cheesecake"` — Cheesecake
- `"tea"` — Trà & Đồ Uống
- `"cookies"` — Cookies & Bánh Ngọt

8. **Kiểm tra dấu phẩy** — mỗi khối sản phẩm phải kết thúc bằng `},` **trừ khối cuối cùng** trong danh sách (khối cuối kết thúc bằng `}` không có dấu phẩy).

9. Xuống dưới, trong phần **"Commit changes"**:
   - Ô trên: gõ `Them san pham [tên]` (VD: `Them san pham banh mi que`)
   - Chọn **"Commit directly to the main branch"** (đã chọn sẵn)
   - Bấm nút xanh **Commit changes**

10. ✅ Xong! Website sẽ tự cập nhật trong **~1 phút**.

---

## 4. Xóa sản phẩm

1. Mở file `data/products.json` (như bước 3.2)
2. Bấm cây bút chì ✏️ để sửa
3. Tìm khối của sản phẩm muốn xóa (dựa theo `name`)
4. **Xóa toàn bộ khối đó**, từ dấu `{` đến dấu `},` (nhớ xóa cả dấu phẩy cuối)
5. Nếu bạn xóa khối **cuối cùng**, phải đảm bảo khối mới-trở-thành-cuối-cùng **không có dấu phẩy** sau `}`
6. Cuộn xuống, gõ "Xoa san pham [tên]" trong commit message, bấm **Commit changes**

### 🗑 Xóa ảnh luôn (không bắt buộc)
Vào `assets/products/`, bấm vào file ảnh của sản phẩm đã xóa → bấm biểu tượng **thùng rác 🗑** → confirm → Commit changes.

(Không xóa cũng không sao, chỉ chiếm dung lượng nhỏ.)

---

## 5. Sửa giá / mô tả sản phẩm

1. Mở `data/products.json` → bấm cây bút chì
2. Tìm sản phẩm cần sửa
3. Chỉ thay đổi các giá trị cần sửa:
   - **Đổi giá:** thay số trong `"price":`  (ví dụ `285000` → `295000`)
   - **Đổi mô tả:** thay text trong `"desc":` (giữ dấu ngoặc kép 2 bên)
   - **Đổi tên:** thay text trong `"name":`
4. **KHÔNG** đổi `id` (nếu đổi `id` sẽ bị coi là sản phẩm mới).
5. Commit changes.

---

## 6. Thay ảnh sản phẩm cũ

**Cách 1 (dễ nhất):** Upload ảnh mới với **tên giống hệt** ảnh cũ → GitHub sẽ hỏi "Overwrite?" → chọn Yes → Commit. Ảnh cũ bị thay.

**Cách 2:** Upload ảnh mới với tên khác → vào `products.json` → sửa `"image":` trỏ đến tên file mới → Commit.

---

## 7. Xem kết quả trên website

1. Sau khi Commit changes, **đợi 1–2 phút**.
2. Vào website: **https://bepnhamuoi.com** (hoặc `https://huynhgia3004-hub.github.io/Bepnhamuoi/` nếu chưa có tên miền)
3. **Bấm Ctrl + F5** (máy tính) hoặc **kéo xuống để refresh** (điện thoại) để bỏ cache.
4. Sản phẩm mới sẽ xuất hiện.

### ⏱ Không thấy thay đổi?
- Đợi thêm 2–3 phút (GitHub build web cần thời gian)
- Xóa cache trình duyệt: Ctrl + Shift + Delete → "Cached images and files" → Clear
- Kiểm tra tab **Actions** trên GitHub repo → nếu có dấu ✗ đỏ → commit bị lỗi, xem phần [8. Lỗi hay gặp]

---

## 8. Những lỗi hay gặp

### ❌ Lỗi 1: "Unexpected token" hoặc sản phẩm không hiện
**Nguyên nhân:** File `products.json` sai cú pháp (thường do thiếu/thừa dấu phẩy, dấu ngoặc kép).

**Cách sửa:**
1. Copy toàn bộ nội dung `products.json`
2. Dán vào **https://jsonlint.com** → bấm **Validate JSON**
3. Công cụ sẽ báo dòng lỗi (VD: `Line 45: missing comma`) — sửa lại rồi commit.

### ❌ Lỗi 2: Ảnh không hiện, thành "ô vuông trắng"
**Nguyên nhân:** Đường dẫn `image` không khớp với tên file ảnh thật.

**Cách sửa:**
- Vào `assets/products/` xem tên file chính xác (**chữ hoa/chữ thường, dấu gạch nối đều phải giống**)
- Vào `products.json`, sửa `"image":` cho đúng, VD:
  ```
  "image": "assets/products/banh-mi-que.jpg"
  ```
  (không phải `Banh-Mi-Que.JPG` hay `banh_mi_que.jpg`)

### ❌ Lỗi 3: Sản phẩm mới không hiện, dù đã Commit
- **Kiểm tra `featured`:** nếu muốn hiện trên **trang chủ**, phải là `"featured": true`. Nếu `false` → chỉ hiện trong trang **Thực đơn**.
- **Đợi 2 phút** nữa rồi refresh.
- **Kiểm tra Actions tab** trên GitHub — nếu có commit nào bị lỗi đỏ ✗, website sẽ không cập nhật.

### ❌ Lỗi 4: Lỡ xóa/sửa nhầm, muốn quay lại
1. Vào trang repo → bấm **Commits** (đồng hồ nhỏ)
2. Tìm commit lúc còn đúng, bấm vào
3. Bấm "Browse files" → "Revert" hoặc hỏi Pháp hỗ trợ

---

## 📞 Cần giúp đỡ?

- Trước khi sửa nhiều, **chụp màn hình file `products.json` hiện tại** lưu lại — để còn so sánh/đối chiếu nếu bị lỗi.
- Có vấn đề gì → Zalo **Pháp (0xxx)** hoặc mở **Issues** trên GitHub repo.

---

## 🎯 Checklist trước mỗi lần commit

- [ ] Tên file ảnh **không dấu, không khoảng trắng**
- [ ] `id` mới **không trùng** với sản phẩm cũ
- [ ] `price` là **số**, không có ký hiệu `₫` hay dấu chấm
- [ ] `category` là **1 trong 5 giá trị** hợp lệ
- [ ] Sau mỗi khối sản phẩm (trừ khối cuối) có **dấu phẩy**
- [ ] Commit message **có nghĩa** (VD: "Them sua chua")

---

Chúc bạn bán đắt hàng! 🥐🧁☕

**Bếp Nhà Muội — Tea & Bakery**
*Cập nhật lần cuối: Apr 2026*
