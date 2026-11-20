# 🧁 Hướng Dẫn Trang Quản Lý — Bếp Nhà Muội

**Dành cho:** Chủ cửa hàng (không cần biết kỹ thuật)
**Trang quản lý:** https://bepnhamuoi.com/admin.html
**Dự phòng (nếu trang trên không vào được):** https://huynhgia3004-hub.github.io/Bepnhamuoi/admin.html
**Mỗi lần thêm / sửa sản phẩm:** ~2 phút, làm ngay trên điện thoại

---

## 1. 🔑 Làm một lần duy nhất (cùng với Pháp, ~10 phút)

Bước này tạo "mã quản lý" để trang quản lý được phép cập nhật website giúp bạn.

1. Đăng nhập **GitHub** bằng tài khoản của tiệm.
2. Bấm **ảnh đại diện** (góc trên bên phải) → **Settings**.
3. Ở menu bên trái, kéo xuống cuối → chọn **Developer settings**.
4. Chọn **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
5. Điền:
   - **Token name:** `Quan ly web`
   - **Expiration:** chọn thời hạn dài nhất (1 năm)
   - **Repository access:** chọn **Only select repositories** → chọn **Bepnhamuoi**
   - **Permissions** → **Repository permissions** → **Contents** → chọn **Read and write**
6. Bấm **Generate token**.
7. **SAO CHÉP mã hiện ra** (bắt đầu bằng `github_pat_…`). ⚠️ Mã chỉ hiện **một lần**, tắt trang là mất!
8. Gửi mã cho chính mình để giữ (ví dụ Zalo "Cloud của tôi" hoặc Ghi chú).
9. Mở trang quản lý trên điện thoại → dán mã vào → tự chọn **mã PIN 4–8 chữ số** (dễ nhớ với bạn).

> ⚠️ **Không đưa mã quản lý hay PIN cho bất kỳ ai.** Nếu mất điện thoại, báo Pháp để hủy mã ngay trên GitHub.

---

## 2. ➕ Hằng ngày: Thêm sản phẩm mới

1. Mở trang quản lý → nhập **mã PIN**.
2. Bấm **"+ Thêm sản phẩm"**.
3. Điền thông tin theo thứ tự. Ví dụ:
   - **Danh mục:** Bánh Kem
   - **Tên sản phẩm:** Bánh Kem Socola
   - **Hình ảnh:** bấm **"Chọn ảnh…"** rồi chọn ảnh (ảnh tự thu nhỏ, không cần đổi tên hay nén gì)
   - **Ghi chú:** Vị socola đậm đà, phủ ganache mượt…
   - **Giá (đ):** gõ `320000` → trang tự hiện **320.000đ**
4. Bấm **"OK"**.
5. Khi thấy **"Đã lưu! Website sẽ cập nhật sau khoảng 1 phút."** là xong.
6. Chờ ~1 phút rồi xem website. Máy tính: bấm **Ctrl+F5**. Điện thoại: **kéo màn hình xuống** để tải lại.

> Bấm **"Hủy"** nếu muốn bỏ, **"Thoát"** khi dùng xong.

---

## 3. ✏️ Sửa, xóa, tạm ẩn

- **Sửa / đổi giá / đổi ảnh:** bấm **"Sửa"** cạnh sản phẩm → đổi thông tin (muốn đổi ảnh thì bấm **"Chọn ảnh…"** chọn ảnh mới) → **"OK"**.
- **Xóa sản phẩm:** bấm **"Xóa"** → xác nhận **"OK"** (hoặc **"Hủy"** nếu bấm nhầm).
- **Tạm ẩn / hết hàng:** bấm **"Sửa"** → tick ô **"Tạm ẩn / hết hàng"** → **"OK"**. Khi có hàng lại, **bỏ tick** là sản phẩm hiện lại.
- **"Hiện ở trang chủ":** tick ô này để sản phẩm xuất hiện ở trang chủ. Trang chủ hiện tối đa **4 sản phẩm nổi bật**.

---

## 4. 🆘 Gặp lỗi?

| Tình huống | Cách xử lý |
|---|---|
| Hiện **"Sai mã PIN"** / quên PIN | Bấm **"Quên PIN / dùng mã mới"**, dán lại mã quản lý và đặt PIN mới. Nếu mất luôn mã → tạo mã mới theo **mục 1** |
| Báo **mã quản lý hết hạn** | Tạo mã mới theo **mục 1**. Mã dùng được tối đa 1 năm, nhớ gia hạn mỗi năm |
| Báo **mất mạng** | Kiểm tra wifi / 4G rồi thử lại |
| Đã lưu nhưng website chưa đổi | Chờ 2–3 phút rồi tải lại trang (Ctrl+F5 / kéo xuống) |
| Vẫn không được | Liên hệ **Pháp (0xxx)** |

---

## 5. 📌 Lưu ý

Hai hướng dẫn cũ (`HUONG_DAN_CAP_NHAT_SAN_PHAM.md`, `HUONG_DAN_SUA_NOI_DUNG_TRANG.md`) **không cần dùng nữa cho sản phẩm**. Còn việc sửa chữ của tiệm (giờ mở cửa, giới thiệu…) vẫn làm theo cách cũ, cho đến khi trang quản lý có thêm tính năng này.
