# HƯỚNG DẪN TẠO DATABASE CLOUDFLARE D1 & CHẠY SCHEMAS TRỰC TIẾP TRÊN WEB DASHBOARD

Tài liệu này hướng dẫn bạn từng bước vào trang quản trị web của Cloudflare ([dash.cloudflare.com](https://dash.cloudflare.com)), tạo cơ sở dữ liệu **D1 SQL Database** sạch 100% (không có dữ liệu mẫu/seed), chạy file `clean-schema.sql` và cấu hình gửi mã OTP qua **Resend** cho tài khoản quản trị viên duy nhất **huyhoangpham387@gmail.com**.

---

## 📌 BƯỚC 1: ĐĂNG NHẬP VÀO TRANG QUẢN TRỊ CLOUDFLARE

1. Truy cập vào: **[https://dash.cloudflare.com/](https://dash.cloudflare.com/)**
2. Đăng nhập vào tài khoản Cloudflare của bạn.

---

## 📌 BƯỚC 2: TẠO DATABASE D1 TRÊN WEB DASHBOARD

1. Ở thanh menu bên trái màn hình, tìm và nhấn vào mục:
   👉 **Storage & Databases** ➔ chọn **D1 SQL Database**.
2. Nhấn vào nút xanh **Create database** (hoặc nút **Create** ở góc trên bên phải).
3. Tại ô **Database name**, nhập tên database của bạn, ví dụ:
   ```text
   certflash-db
   ```
4. Chọn vùng vị trí (Region) gần Việt Nam nhất (chọn **APAC** hoặc để mặc định).
5. Nhấn nút **Create**. Quá trình tạo database diễn ra trong ~2 giây.

---

## 📌 BƯỚC 3: CHẠY SCHEMAS TẠO BẢNG (FILE `clean-schema.sql`)

1. Sau khi database `certflash-db` được tạo, bạn nhấn vào tên database `certflash-db` để vào trang chi tiết.
2. Trên thanh tab trên cùng của database, bấm chọn tab:
   👉 **Console** (hoặc **Execute SQL**).
3. Mở file **`clean-schema.sql`** trong dự án này (nội dung bên dưới), sao chép (Copy) toàn bộ nội dung SQL.
4. Dán (Paste) toàn bộ đoạn mã SQL vào ô nhập truy vấn (Query console) trên Cloudflare.
5. Nhấn nút **Execute** (hoặc phím tắt Ctrl + Enter).
6. Kết quả sẽ hiển thị:
   - ✅ Tạo thành công 7 bảng: `users`, `exams`, `topics`, `questions`, `question_reviews`, `mock_attempts`, `otp_codes`.
   - ✅ Tạo đầy đủ các chỉ mục (Indexes) tối ưu tốc độ truy vấn.
   - ✅ Đã tạo sẵn 1 tài khoản Lead Admin duy nhất: `huyhoangpham387@gmail.com`.
   - 🚫 **100% Sạch**: Không có bất kỳ câu hỏi giả, đề thi mẫu (AWS/Azure/PSM) nào trong database.

---

## 📌 BƯỚC 4: LIÊN KẾT D1 DATABASE VỚI CLOUDFLARE PAGES

Để ứng dụng web và các API Functions kết nối được với database D1 vừa tạo:

1. Ở thanh menu bên trái Cloudflare, chọn:
   👉 **Compute (Workers & Pages)** ➔ chọn project Pages của bạn (ví dụ: `certflash` hoặc `web-flashcard-on-thi`).
2. Nhấn vào tab **Settings** của project.
3. Ở menu bên trái của Settings, chọn mục **Functions**.
4. Cuộn xuống phần **D1 database bindings**, nhấn nút **Add binding**:
   - **Variable name**: Nhập chính xác `DB` (viết hoa 2 chữ cái).
   - **D1 database**: Chọn database bạn vừa tạo ở Bước 2 (`certflash-db`).
5. Nhấn **Save** để lưu cấu hình.

---

## 📌 BƯỚC 5: CẤU HÌNH GỬI OTP QUA GMAIL BẰNG RESEND

Tài khoản quản trị viên **huyhoangpham387@gmail.com** sẽ nhận mã OTP 6 số bảo mật qua Gmail mỗi lần đăng nhập:

1. Truy cập vào **[https://resend.com](https://resend.com)** và đăng ký tài khoản miễn phí.
2. Vào mục **API Keys** trên Resend ➔ Nhấn **Create API Key** ➔ Đặt tên (ví dụ: `CertFlash-OTP`) ➔ Nhấn **Create**.
3. Sao chép chuỗi API Key vừa tạo (có dạng `re_123456789...`).
4. Quay lại trang Cloudflare Dashboard:
   - Vào project Pages của bạn ➔ **Settings** ➔ **Environment variables**.
   - Bấm **Add variable**:
     - *Variable name*: `RESEND_API_KEY`
     - *Value*: Dán chuỗi API Key của bạn (`re_...`).
   - (Tùy chọn) Thêm biến:
     - *Variable name*: `RESEND_FROM_EMAIL`
     - *Value*: `CertFlash <onboarding@resend.dev>` (hoặc email domain riêng của bạn nếu đã xác thực domain trên Resend).
5. Nhấn **Save**.

---

## 📌 BƯỚC 6: TRIỂN KHAI TỰ ĐỘNG TỪ GITHUB (CLOUDFLARE PAGES)

1. Trên Cloudflare Dashboard, vào **Compute (Workers & Pages)** ➔ **Create application** ➔ chọn thẻ **Pages** ➔ **Connect to Git**.
2. Chọn kho lưu trữ GitHub của bạn:
   ```text
   yukiyeuem/web-flashcard-on-thi
   ```
3. Cấu hình bản dựng (Build Settings):
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Nhấn **Save and Deploy**. Cloudflare sẽ tự động kéo mã nguồn từ GitHub, đóng gói và phát hành website lên domain miễn phí dạng `https://<ten-project>.pages.dev`.

---

## 📌 BƯỚC 7: NẠP ĐỀ VÀ THI THỬ VỚI TỆP WORD / PDF CỦA BẠN

Sau khi vào website:
1. Đăng nhập bằng email: **`huyhoangpham387@gmail.com`**.
2. Hệ thống gửi mã OTP 6 số đến Gmail của bạn. Điền OTP để vào quyền Lead Admin.
3. Vào mục **Ngân hàng câu hỏi**:
   - Bạn có thể nhấn **"Tải tệp Word (.docx) / PDF"** và tải trực tiếp tệp PDF của bạn (ví dụ đề 181 câu `1Z0-083`).
   - Hệ thống tự động nhận diện 181 câu hỏi và các phương án A, B, C, D, E, F.
   - Nếu tệp dump chưa có đáp án, bạn chỉ cần nhấn **"⚡ Gán tạm đáp án A cho tất cả"** hoặc lưu lại để bổ sung đáp án sau.
4. Muốn xem định dạng chuẩn hoặc tải đề thi về máy:
   - Nhấn nút **"Xuất file / Mẫu"** ➔ chọn **"Xuất sang Word (.docx)"** hoặc **"Xuất sang Adobe PDF (.pdf)"**.
