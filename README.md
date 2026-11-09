# CertFlash – Web Flashcard & Thi Thử Chứng Chỉ (BA v1.1)

> Hệ thống ôn thi chứng chỉ chuẩn quốc tế (AWS, Azure, Scrum, PMP, CPA...) tích hợp thuật toán lặp ngắt quãng SuperMemo SM-2, hệ thống thi thử mô phỏng thực tế và quản lý học liệu theo tài liệu phân tích nghiệp vụ Business Analysis v1.1.

---

## 🌟 Tính Năng Nổi Bật Theo Đặc Tả BA v1.1

### 1. Phân Quyền & Quản Trị Hệ Thống (Auth & Administration)
- **ADD-01 & BR-20 (Xác minh Gmail trước khi duyệt):** Học viên đăng ký phải xác minh quyền sở hữu Gmail qua mã OTP (`VERIFY_EMAIL`) trước khi được đưa vào hàng đợi chờ duyệt.
- **BR-21 (Phân tách mục đích OTP):** Mã OTP xác minh email và OTP đăng nhập (`LOGIN`) phân tách mục đích độc lập, chống dùng nhầm hoặc khai thác sai lệch.
- **ADD-02 (Kiểm soát quyền Admin & Audit Trail):**
  - Ghi nhật ký kiểm toán (Audit Logs) mọi thao tác duyệt, từ chối, khóa/mở khóa tài khoản.
  - Bảo vệ tài khoản Admin mặc định; hỗ trợ thu hồi session khẩn cấp.
  - **NFR-12 & ADD-03 (Bảo mật & Cô lập dữ liệu):** Phân cách ranh giới bảo mật nghiêm ngặt. Admin chỉ quản lý tài khoản và không thể xem/sửa nội dung câu hỏi hoặc bài thi riêng tư của người dùng.

### 2. Quản Lý Học Liệu & Flashcard (Questions & Materials)
- **BR-32 & BR-33 (Khử trùng lặp thống kê):** Mỗi câu hỏi có thể thuộc nhiều chủ đề (Topics) nhưng tổng số câu hỏi của bộ đề luôn được đếm một lần duy nhất.
- **ADD-04 (Hoàn thiện Flashcard 2 mặt):**
  - Loại `SINGLE`: Trắc nghiệm 1 đáp án đúng.
  - Loại `MULTI`: Trắc nghiệm chọn nhiều đáp án.
  - Loại `FLASHCARD`: Bắt buộc có đầy đủ Mặt trước (`content`) và Mặt sau (`answer_content`).
- **BR-36 (Cảnh báo tác động khi xóa Topic):** Khi xóa chủ đề, hệ thống cảnh báo số câu hỏi bị ảnh hưởng và tự động gỡ liên kết an toàn sang nhóm chưa phân loại mà không làm mất câu hỏi.

### 3. Ôn Tập Thông Minh Lặp Ngắt Quãng (Spaced Repetition SM-2)
- **ADD-05 & ADD-07 (Tách biệt đúng/sai và mức độ ghi nhớ):** Người học tự đánh giá theo 4 mức độ:
  - `AGAIN` (Quên / Làm sai)
  - `HARD` (Khó nhớ)
  - `GOOD` (Nhớ tốt)
  - `EASY` (Rất dễ)
- Thuật toán SuperMemo SM-2 tự động tính toán hệ số dễ (`ease`), số lần lặp (`reps`), số lần quên (`lapses`) và khoảng cách ngày ôn tập tiếp theo (`interval_days`).
- **ADD-08 (Snapshot câu hỏi trong phiên ôn):** Danh sách và nội dung câu hỏi được đóng băng (snapshot) tại thời điểm bắt đầu phiên ôn, không bị biến dạng khi câu gốc bị sửa.
- Giao diện thẻ 3D xoay lật trực quan, mượt mà trên cả desktop và mobile.

### 4. Hệ Thống Thi Thử Mô Phỏng (Mock Exam Simulator)
- **ADD-10 (Độc quyền 1 bài thi đang làm dở):** Mỗi tài khoản chỉ được phép có tối đa một bài thi ở trạng thái `IN_PROGRESS` trên toàn hệ thống.
- **ADD-11 (Chống ghi đè đồng thời - Optimistic Concurrency Control):** Đánh số phiên bản `version` trên từng câu hỏi của bài thi; ngăn chặn việc ghi đè đáp án cũ khi mở đồng thời trên nhiều thiết bị.
- **ADD-12 (Thời hạn do Server làm chuẩn & Nộp bài Idempotent):** Đồng hồ đếm ngược căn cứ theo mốc `deadline_at` của máy chủ; tự động thu bài khi hết giờ và đảm bảo kết quả chỉ được chốt một lần duy nhất.
- **BR-30 (Bảo mật đáp án khi thi):** Trong lúc đang làm bài, API và giao diện tuyệt đối không để lộ đáp án đúng hay giải thích; chỉ mở khóa toàn bộ giải thích sau khi đã nộp bài thành công.
- Bảng điều hướng câu hỏi trực quan: Đã làm, Chưa làm, Cắm cờ xem lại (Flagged).
- Báo cáo phân tích kết quả thi thử chi tiết theo từng chủ đề (Topic Radar / Mastery Breakdown).

### 5. Import / Export Chuẩn Hóa (ADD-13, ADD-14, ADD-16)
- **ADD-13 & ADD-14 (Cấu trúc dữ liệu trung gian):** Hỗ trợ nhập liệu từ file Word/DOCX (định dạng văn bản câu hỏi chuẩn), JSON, Markdown.
- **Quy trình Import 3 bước:**
  1. Phân tích văn bản thành JSON trung gian.
  2. Xem trước (Preview) chi tiết: phân loại câu hợp lệ, câu lỗi cú pháp và cảnh báo câu trùng.
  3. Lựa chọn chiến lược xử lý câu trùng: Bỏ qua (Skip), Nhập cả hai (Keep both), Cập nhật câu cũ (Update existing).
- **ADD-16 (Quyền kiểm soát dữ liệu người dùng):** Cho phép xuất toàn bộ dữ liệu cá nhân dạng JSON máy đọc được và quy trình xóa tài khoản an toàn (GDPR).

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion, Canvas-Confetti
- **Kiến trúc dữ liệu:** Data Isolation Engine, Optimistic Concurrency Control, SM-2 Engine, Snapshotting
- **Build Tool:** Vite 8

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

```bash
# Clone repository
git clone https://github.com/yukiyeuem/web-flashcard-on-thi.git

# Di chuyển vào thư mục dự án
cd web-flashcard-on-thi

# Cài đặt thư viện
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

## 👥 Tài Khoản Mẫu Để Trải Nghiệm Nhanh

| Tài khoản | Email | Vai trò | Trạng thái | Ghi chú |
|---|---|---|---|---|
| **Admin** | `admin@certflash.io` | `ADMIN` | `ACTIVE` | Quản trị, duyệt tài khoản, xem audit log |
| **Học viên** | `user@certflash.io` | `USER` | `ACTIVE` | Đầy đủ dữ liệu mẫu AWS SAA, Azure AZ-104, PSM I |
| **Chờ duyệt** | `phuong.thao@techmail.vn` | `USER` | `PENDING` | Đã xác minh Gmail OTP, chờ admin duyệt |
| **Chưa xác minh** | `chua.xac.thuc@gmail.com` | `USER` | `PENDING_VERIFICATION` | Minh họa quy tắc BR-20 |

*(Bạn có thể chuyển đổi nhanh giữa các tài khoản thông qua menu người dùng ở góc trên bên phải).*
