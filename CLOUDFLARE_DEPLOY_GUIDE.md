# Hướng Dẫn Chi Tiết Triển Khai Cloudflare Pages + D1 Database + Resend OTP

Tài liệu này hướng dẫn từng bước chi tiết để bạn triển khai dự án **CertFlash** lên Cloudflare, thiết lập cơ sở dữ liệu **Cloudflare D1** và cấu hình **Resend** để gửi mã OTP đăng nhập thật về Gmail `huyhoangpham387@gmail.com`.

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Cấu Hình Cloudflare D1 Database](#2-cấu-hình-cloudflare-d1-database)
3. [Cấu Hình Resend Gửi OTP Qua Gmail](#3-cấu-hình-resend-gửi-otp-qua-gmail)
4. [Triển Khai Web Lên Cloudflare Pages](#4-triển-khai-web-lên-cloudflare-pages)
5. [Cơ Chế Đăng Nhập Quản Trị Viên Duy Nhất](#5-cơ-chế-đăng-nhập-quản-trị-viên-duy-nhất)

---

## 1. Tổng Quan Kiến Trúc

- **Frontend:** Single Page Application (React 19 + TypeScript + Vite + Tailwind CSS).
- **Backend / Edge Functions:** Cloudflare Pages Functions (`functions/api/auth/otp/*`).
- **Database:** Cloudflare D1 (Serverless SQLite phân tán tại Edge, không tốn tài nguyên server truyền thống).
- **Email Service:** Resend API (Gửi OTP trực tiếp tới Gmail `huyhoangpham387@gmail.com`).

---

## 2. Cấu Hình Cloudflare D1 Database

Cloudflare D1 là cơ sở dữ liệu SQLite chạy tại Edge của Cloudflare. Hệ thống đã có sẵn tệp `schema.sql` hoàn chỉnh.

### Bước 2.1: Đăng nhập Wrangler CLI
Mở terminal trên máy tính của bạn và đăng nhập vào tài khoản Cloudflare:
```bash
npx wrangler login
```
*(Trình duyệt sẽ mở ra, bạn chỉ cần bấm "Allow" để cấp quyền).*

### Bước 2.2: Tạo D1 Database
Chạy lệnh sau để tạo database mới mang tên `certflash-db`:
```bash
npx wrangler d1 create certflash-db
```

Kết quả trả về trên màn hình sẽ có dạng:
```toml
[[d1_databases]]
binding = "DB"
database_name = "certflash-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Bước 2.3: Điền `database_id` vào `wrangler.toml`
Mở tệp `wrangler.toml` trong thư mục dự án và thay `database_id` thực tế bạn vừa nhận được:
```toml
[[d1_databases]]
binding = "DB"
database_name = "certflash-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" # Thay bằng ID thật của bạn
```

### Bước 2.4: Khởi tạo bảng dữ liệu (Execute Schema)
Chạy lệnh sau để nạp toàn bộ cấu trúc bảng và tài khoản Admin `huyhoangpham387@gmail.com`:
```bash
# Nạp dữ liệu lên Cloudflare D1 production
npx wrangler d1 execute certflash-db --file=./schema.sql --remote
```

*(Nếu muốn kiểm tra cục bộ trên máy, thêm cờ `--local`: `npx wrangler d1 execute certflash-db --file=./schema.sql --local`)*.

---

## 3. Cấu Hình Resend Gửi OTP Qua Gmail

Dịch vụ Resend (resend.com) cho phép bạn gửi email giao dịch với tỷ lệ vào Inbox rất cao, miễn phí 3,000 email/tháng.

### Bước 3.1: Lấy API Key từ Resend
1. Truy cập [https://resend.com](https://resend.com) và đăng ký tài khoản (miễn phí).
2. Vào mục **API Keys** -> Bấm **Create API Key**.
3. Đặt tên (ví dụ: `CertFlash OTP`) -> Quyền **Full Access** -> Bấm **Add**.
4. Sao chép chuỗi khóa API bắt đầu bằng `re_...`.

### Bước 3.2: Lưu RESEND_API_KEY lên Cloudflare
Chạy lệnh sau trong thư mục dự án để lưu secret an toàn:
```bash
npx wrangler secret put RESEND_API_KEY
```
*(Khi được hỏi, hãy dán chuỗi API Key `re_...` vừa tạo ở Resend vào rồi nhấn Enter).*

### Bước 3.3: Địa chỉ Email gửi đi (Sender)
- Mặc định, bạn có thể gửi ngay từ: `onboarding@resend.dev` (được cấu hình sẵn trong `wrangler.toml` và hàm `request.ts`).
- Khi gửi bằng `onboarding@resend.dev`, Resend cho phép gửi trực tiếp đến chính email mà bạn đã dùng để đăng ký tài khoản Resend.
- Nếu bạn có tên miền riêng (ví dụ `yourdomain.com`), hãy thêm tên miền vào mục **Domains** trên Resend để gửi từ `otp@yourdomain.com`.

---

## 4. Triển Khai Web Lên Cloudflare Pages

Bạn có 2 cách triển khai:

### Cách 1: Tự động qua GitHub (Khuyên dùng - Tiện lợi nhất)
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Vào menu **Workers & Pages** -> Bấm **Create application** -> Chọn tab **Pages** -> Bấm **Connect to Git**.
3. Chọn tài khoản GitHub `yukiyeuem` và chọn repository **`web-flashcard-on-thi`**.
4. Cấu hình Build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Bấm **Save and Deploy**.
6. Sau khi deploy xong, vào mục **Settings** của dự án Pages:
   - Vào **Functions** -> **D1 database bindings** -> Bấm **Add binding**:
     - Variable name: `DB`
     - D1 database: Chọn `certflash-db`.
   - Vào **Environment variables** -> Bấm **Add variable**:
     - Variable name: `RESEND_API_KEY`
     - Value: Dán mã `re_...` từ Resend.

Mỗi khi bạn đẩy code mới lên GitHub (`git push`), Cloudflare sẽ tự động build và cập nhật trang web trong 1 phút!

---

### Cách 2: Deploy trực tiếp bằng lệnh Wrangler
```bash
# 1. Build mã nguồn
npm run build

# 2. Deploy thư mục dist lên Cloudflare Pages
npx wrangler pages deploy dist --project-name web-flashcard-on-thi
```

---

## 5. Cơ Chế Đăng Nhập Quản Trị Viên Duy Nhất

1. Hệ thống chỉ công nhận **1 tài khoản Admin duy nhất**: **`huyhoangpham387@gmail.com`**.
2. Khi bạn nhập `huyhoangpham387@gmail.com` vào form Đăng nhập:
   - Hệ thống gọi hàm API Cloudflare Edge Functions.
   - Hàm gửi yêu cầu đến **Resend API**.
   - Resend gửi email chứa mã OTP 6 số đẹp mắt thẳng vào hòm thư Gmail của bạn.
   - Bạn mở Gmail, lấy mã OTP và nhập vào web để đăng nhập.
3. Khi đăng nhập thành công với `huyhoangpham387@gmail.com`, bạn sẽ có toàn quyền truy cập thanh menu **Quản trị Admin**, duyệt hoặc từ chối các học viên đăng ký khác.
