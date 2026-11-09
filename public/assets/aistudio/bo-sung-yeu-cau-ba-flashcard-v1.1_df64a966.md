# Tài liệu bổ sung yêu cầu BA – Web Flashcard ôn thi chứng chỉ

> **Tài liệu gốc:** `thiet-ke-luong-web-flashcard-on-thi.md` – phiên bản 1.0  
> **Phiên bản bổ sung:** 1.1  
> **Loại tài liệu:** Business Analysis Addendum / Phụ lục yêu cầu nghiệp vụ  
> **Mục đích:** Bổ sung và làm rõ các yêu cầu nghiệp vụ, quy tắc, dữ liệu, API và tiêu chí nghiệm thu dựa trên đánh giá BA.  
> **Nguyên tắc:** Tài liệu này bổ sung cho phiên bản 1.0, không thay thế toàn bộ nội dung hiện tại.

---

## 0. Cách sử dụng tài liệu

Tài liệu v1.0 tiếp tục là tài liệu nền. Các nội dung dưới đây được phân thành ba loại:

- **Bổ sung bắt buộc:** Nên hoàn thiện trước khi triển khai chức năng liên quan.
- **Đề xuất:** Phương án BA khuyến nghị; chủ dự án cần xác nhận trước khi Developer thực hiện.
- **Định hướng tương lai:** Chưa thuộc MVP, chỉ cần tránh thiết kế gây cản trở việc mở rộng.

### 0.1. Quy ước mức độ ưu tiên

| Mức | Ý nghĩa | Cách xử lý |
|---|---|---|
| P0 – Critical | Ảnh hưởng bảo mật, toàn vẹn dữ liệu hoặc tính đúng đắn của kết quả | Phải chốt trước khi phát triển chức năng liên quan |
| P1 – High | Ảnh hưởng trực tiếp đến trải nghiệm và khả năng vận hành | Nên hoàn thành trong MVP hoặc ngay sau MVP |
| P2 – Medium | Cải thiện trải nghiệm, hiệu quả quản trị hoặc khả năng mở rộng | Đưa vào các phase tiếp theo |
| P3 – Future | Chức năng mở rộng, chưa cần cho phiên bản đầu | Để backlog |

### 0.2. Nguyên tắc không tự ý thay đổi yêu cầu v1.0

1. Các quy tắc hiện có trong v1.0 vẫn được giữ nguyên, trừ khi phụ lục này ghi rõ nội dung cần làm rõ hoặc đề xuất thay đổi.
2. Những nội dung được ghi là **Đề xuất** chưa được coi là quyết định cuối cùng cho đến khi chủ dự án xác nhận.
3. Không đưa các chức năng P2/P3 vào MVP chỉ vì đã được mô tả trong tài liệu.
4. Mọi thay đổi liên quan đến dữ liệu, phân quyền hoặc kết quả thi phải có migration, kiểm thử hồi quy và UAT tương ứng.

---

# 1. Tổng hợp các nội dung cần bổ sung

| ID | Nhóm | Nội dung bổ sung | Ưu tiên |
|---|---|---|---|
| ADD-01 | Tài khoản | Xác minh quyền sở hữu Gmail trước khi admin duyệt | P0 |
| ADD-02 | Quản trị | Bổ sung quy trình thay thế/khôi phục Admin và thu hồi session khẩn cấp | P0 |
| ADD-03 | Bảo mật dữ liệu | Kiểm soát quyền sở hữu xuyên suốt API và quan hệ database | P0 |
| ADD-04 | Câu hỏi | Hoàn thiện dữ liệu mặt trước/mặt sau cho FLASHCARD | P0 |
| ADD-05 | Ôn tập | Lưu mức tự đánh giá Again/Hard/Good/Easy và thời gian trả lời | P1 |
| ADD-06 | Phiên ôn | Quy định dữ liệu câu hỏi khi câu gốc bị sửa/xóa trong lúc ôn | P1 |
| ADD-07 | Thi thử | Chặn nhiều bài thi đang làm dở theo đúng phạm vi tài khoản | P0 |
| ADD-08 | Thi thử | Kiểm soát xung đột khi nhiều thiết bị cùng cập nhật đáp án | P0 |
| ADD-09 | Import | Chuẩn hóa định dạng dữ liệu trung gian và cách xử lý câu trùng | P1 |
| ADD-10 | Dashboard | Định nghĩa thống nhất các chỉ số học tập | P1 |
| ADD-11 | Dữ liệu | Bổ sung chính sách xuất dữ liệu, xóa tài khoản và dữ liệu file | P1 |
| ADD-12 | Học liệu | Định hướng hỗ trợ hình ảnh/tệp đính kèm trong câu hỏi | P2 |
| ADD-13 | Mở rộng | Định hướng nhiều chứng chỉ, CSV/XLSX, Anki và AI | P2/P3 |

---

# 2. Bổ sung quy trình tài khoản và xác thực

## 2.1. ADD-01 – Xác minh Gmail trước khi admin duyệt

**Ưu tiên:** P0  
**Trạng thái:** Đề xuất cần chủ dự án xác nhận.

### Mục tiêu

Đảm bảo người đăng ký thực sự có quyền truy cập địa chỉ Gmail được khai báo. Admin chỉ duyệt những tài khoản đã xác minh email.

### Luồng nghiệp vụ đề xuất

```text
Guest
  |
  | Nhập Gmail + tên hiển thị
  v
Tạo tài khoản ở trạng thái chờ xác minh
  |
  | Hệ thống gửi mã xác minh email
  v
User nhập mã xác minh
  |
  +---- Sai/hết hạn ----> Cho nhập lại hoặc yêu cầu gửi mã mới theo giới hạn
  |
  v
Email đã xác minh
  |
  v
PENDING (chờ admin duyệt)
  |
  +---- Admin từ chối ----> REJECTED
  |
  +---- Admin duyệt ------> ACTIVE
                              |
                              v
                         Đăng nhập OTP
```

### Quy tắc nghiệp vụ bổ sung

| Mã | Quy tắc |
|---|---|
| BR-20 | Chỉ tài khoản có `email_verified_at` khác NULL mới được đưa vào danh sách chờ admin duyệt. |
| BR-21 | OTP xác minh đăng ký và OTP đăng nhập phải được phân biệt bằng mục đích sử dụng (`purpose`). Mã dùng cho mục đích này không được dùng cho mục đích khác. |
| BR-22 | OTP xác minh email có hạn dùng, giới hạn số lần thử và giới hạn gửi lại tương tự hoặc chặt hơn OTP đăng nhập. |
| BR-23 | Email được chuẩn hóa về chữ thường và loại bỏ khoảng trắng đầu/cuối trước khi kiểm tra trùng. |
| BR-24 | Email đang ở trạng thái PENDING, ACTIVE, REJECTED hoặc BLOCKED không được tạo thêm bản ghi trùng. |
| BR-25 | Chính sách đăng ký lại sau khi REJECTED phải được định nghĩa rõ: cập nhật bản ghi hiện hữu hay cho phép đăng ký lại sau khi bản ghi cũ được xử lý. Không tạo nhiều tài khoản có cùng email. |

### Dữ liệu đề xuất bổ sung

- `users.email_verified_at`: thời điểm xác minh email thành công.
- `otp_codes.purpose`: `VERIFY_EMAIL` hoặc `LOGIN`.
- Có thể bổ sung `otp_codes.consumed_at` thay cho việc chỉ dựa vào `used_at`, nếu muốn thống nhất cách đặt tên; không cần tạo cả hai trường.

### Tiêu chí nghiệm thu bổ sung

1. Tài khoản chưa xác minh email không xuất hiện trong danh sách chờ duyệt.
2. OTP xác minh đăng ký không dùng được để đăng nhập.
3. OTP đăng nhập không dùng được để xác minh email.
4. OTP hết hạn, đã sử dụng hoặc vượt số lần thử đều bị từ chối.
5. Email đã tồn tại không thể tạo thêm tài khoản thứ hai.
6. Admin chỉ duyệt được tài khoản đã xác minh email.

---

## 2.2. ADD-02 – Bảo vệ và khôi phục quyền Admin

**Ưu tiên:** P0  
**Trạng thái:** Đề xuất cần chủ dự án xác nhận.

### Vấn đề cần xử lý

Quy tắc v1.0 bảo vệ tài khoản Admin mặc định khỏi thao tác khóa, xóa hoặc hạ quyền. Tuy nhiên, nếu hộp thư Admin bị mất quyền kiểm soát hoặc tài khoản bị xâm nhập, hệ thống cần có phương án khôi phục.

### Yêu cầu bổ sung

1. Không cho phép User thường truy cập API quản trị.
2. Các thao tác duyệt, từ chối, khóa/mở khóa User phải được ghi audit log.
3. Thao tác thay đổi quyền Admin, thay đổi email quản trị hoặc thu hồi toàn bộ session phải yêu cầu xác thực bổ sung.
4. Có quy trình khẩn cấp để thu hồi session quản trị khi nghi ngờ tài khoản bị xâm nhập.
5. Không hard-code email Admin trong nhiều vị trí của source code. Email bootstrap phải lấy từ cấu hình triển khai.
6. Có khả năng thêm Admin thứ hai hoặc thay thế Admin ban đầu theo quy trình được chủ dự án phê duyệt.
7. Không ghi OTP, session token hoặc nội dung học liệu vào audit log.

### Quyết định cần chốt

- MVP chỉ có một Admin hay cho phép nhiều Admin?
- Ai được phép cấp quyền Admin thứ hai?
- Có cần quy trình khôi phục ngoài giao diện (ví dụ thao tác vận hành có kiểm soát) không?
- Khi thay Admin mặc định, tài khoản cũ được hạ quyền, khóa hay giữ làm tài khoản dự phòng?

### Tiêu chí nghiệm thu bổ sung

1. User thường gọi API quản trị nhận phản hồi 403.
2. Không thể khóa/xóa/hạ quyền Admin bằng API nghiệp vụ thông thường nếu vi phạm chính sách bảo vệ Admin.
3. Khi thực hiện thao tác quản trị quan trọng, hệ thống ghi nhận người thực hiện, đối tượng, hành động và thời điểm.
4. Có thể thu hồi session của tài khoản Admin theo quy trình khẩn cấp đã được phê duyệt.

---

# 3. Bổ sung yêu cầu bảo mật và cách ly dữ liệu

## 3.1. ADD-03 – Quyền sở hữu dữ liệu xuyên suốt hệ thống

**Ưu tiên:** P0 – Bắt buộc.

### Nguyên tắc

`user_id` phải được lấy từ session đã xác thực ở phía server. Không tin `user_id`, `owner_id` hoặc thông tin chủ sở hữu do client gửi lên.

Mọi truy vấn, cập nhật, xóa hoặc tạo quan hệ giữa các đối tượng đều phải kiểm tra quyền sở hữu.

### Các quan hệ cần kiểm tra

| Đối tượng | Điều kiện bắt buộc |
|---|---|
| Exam | Exam thuộc User đang đăng nhập |
| Topic | Topic thuộc đúng User và đúng Exam |
| Question | Question thuộc đúng User và đúng Exam |
| Question–Topic | Question và Topic cùng User, cùng Exam |
| Study Session | Session thuộc User và Exam hợp lệ |
| Answer Log | Log thuộc Session và User hiện tại |
| Mock Attempt | Attempt thuộc User và Exam hợp lệ |
| Mock Attempt Item | Item thuộc Attempt của User hiện tại |
| File đính kèm | File được tham chiếu bởi đối tượng thuộc User hiện tại |
| Statistics | Chỉ tổng hợp dữ liệu thuộc User hiện tại |

### Quy tắc nghiệp vụ bổ sung

| Mã | Quy tắc |
|---|---|
| BR-26 | Mọi API đọc/ghi học liệu phải xác thực quyền sở hữu đối tượng ở phía server trước khi xử lý. |
| BR-27 | Không được tạo quan hệ Question–Topic nếu Question và Topic không thuộc cùng một User và cùng một Exam. |
| BR-28 | Không được tạo Study Session hoặc Mock Attempt bằng Exam không thuộc User hiện tại. |
| BR-29 | Không được đọc kết quả thi thử, lịch sử ôn tập hoặc thống kê của User khác bằng cách thay ID trên URL/API. |
| BR-30 | API không trả các trường nội bộ không cần thiết, đặc biệt là đáp án đúng/giải thích trong khi thi thử chưa nộp. |
| BR-31 | Việc Admin không xem nội dung học liệu phải được áp dụng ở API và giao diện quản trị; không chỉ ẩn menu hoặc nút trên frontend. |

### Yêu cầu triển khai

- Tạo một lớp/service dùng chung để lấy user hiện tại và kiểm tra quyền sở hữu.
- Với các bảng có quan hệ cha-con, ưu tiên truy vấn theo cả ID đối tượng và `user_id` lấy từ session.
- Bổ sung khóa ngoại tổng hợp hoặc ràng buộc database phù hợp để ngăn quan hệ chéo User/Exam ở mức dữ liệu.
- Bật và kiểm tra foreign key enforcement trong môi trường SQLite/D1.
- Không dựa duy nhất vào việc UUID khó đoán để bảo vệ dữ liệu.

### SQL tham khảo cho ràng buộc quan hệ

Đây là hướng thiết kế, cần điều chỉnh theo migration thực tế và schema hiện hữu:

```sql
-- Bảo đảm cặp ID + owner có thể được tham chiếu bằng khóa ngoại tổng hợp.
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_id_user
ON exams(id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_id_user_exam
ON topics(id, user_id, exam_id);

-- Khi tạo/sửa schema questions, có thể khai báo:
-- FOREIGN KEY (exam_id, user_id)
--   REFERENCES exams(id, user_id)

-- Khi tạo/sửa schema question_topics, có thể bổ sung user_id, exam_id
-- và dùng khóa ngoại tổng hợp tham chiếu questions/topics.
```

Không áp dụng nguyên xi đoạn SQL trên nếu bảng hiện hữu chưa có đúng các cột và constraint tương ứng. Cần tạo migration, kiểm tra dữ liệu cũ trước khi thêm constraint.

### Tiêu chí nghiệm thu bổ sung

1. User A không thể xem, sửa hoặc xóa Exam/Topic/Question của User B.
2. User A không thể tạo Question dưới Exam của User B.
3. User A không thể gắn Question của mình vào Topic của User B hoặc Topic thuộc Exam khác.
4. User A không thể truy cập Study Session, Answer Log, Mock Attempt hoặc Result của User B.
5. User A không thể tải file đính kèm của User B bằng cách thay URL hoặc file ID.
6. Các trường hợp trên phải được kiểm thử trực tiếp ở API, không chỉ kiểm tra giao diện.

---

# 4. Bổ sung mô hình dữ liệu học liệu

## 4.1. ADD-04 – Hoàn thiện dữ liệu Flashcard

**Ưu tiên:** P0 – Bắt buộc trước khi phát triển loại câu hỏi FLASHCARD.

### Vấn đề

Schema v1.0 có `content`, `options`, `correct`, `explanation` nhưng chưa có trường thể hiện rõ mặt sau của Flashcard.

### Đề xuất

Bổ sung trường:

- `answer_content TEXT`: nội dung mặt sau của Flashcard.

Quy tắc theo loại câu hỏi:

| Loại | `content` | `options` | `correct` | `answer_content` |
|---|---|---|---|---|
| SINGLE | Nội dung câu hỏi | Danh sách đáp án | Một đáp án đúng | Không bắt buộc; có thể dùng giải thích |
| MULTI | Nội dung câu hỏi | Danh sách đáp án | Nhiều đáp án đúng | Không bắt buộc; có thể dùng giải thích |
| FLASHCARD | Mặt trước | NULL | NULL | Mặt sau, bắt buộc |

### Validation

1. `SINGLE` phải có ít nhất hai lựa chọn và đúng một đáp án hợp lệ.
2. `MULTI` phải có ít nhất hai lựa chọn và ít nhất một đáp án đúng hợp lệ.
3. `FLASHCARD` phải có `content` và `answer_content` không rỗng; không bắt buộc `options` và `correct`.
4. `correct` chỉ được chứa key có trong `options`.
5. Khi xóa/sửa lựa chọn, hệ thống phải kiểm tra và cập nhật đáp án đúng tương ứng.

### Tiêu chí nghiệm thu

- Có thể tạo, sửa, xem và ôn Flashcard theo hai mặt.
- Không hiển thị mặt sau trước khi User thực hiện thao tác lật thẻ.
- Import/Export giữ nguyên mặt trước và mặt sau.
- Dữ liệu SINGLE/MULTI không bị ảnh hưởng bởi trường mới.

---

## 4.2. ADD-05 – Hình ảnh và tệp đính kèm cho câu hỏi

**Ưu tiên:** P2 – Có thể triển khai sau MVP.

### Mục tiêu

Hỗ trợ các câu hỏi chứa sơ đồ, ảnh chụp màn hình, execution plan hoặc hình minh họa.

### Đề xuất nghiệp vụ

- Lưu binary file tại object storage (định hướng Cloudflare R2), không lưu binary trực tiếp trong D1.
- D1 chỉ lưu metadata và quan hệ file với Question.
- Mỗi file phải có owner, loại MIME, kích thước, thời điểm tải lên và trạng thái.
- Kiểm tra định dạng và dung lượng ở server; không tin MIME type do client tự khai báo.
- Chỉ User sở hữu Question mới được xem, thay thế hoặc xóa file.
- Khi xóa Question, cần xác định chính sách xóa file liên quan; không xóa file dùng chung nếu sau này có cơ chế tham chiếu dùng chung.

### Bảng metadata tham khảo

```sql
CREATE TABLE question_assets (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  question_id  TEXT NOT NULL,
  object_key   TEXT NOT NULL UNIQUE,
  file_name    TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

Cần bổ sung kiểm tra quan hệ `user_id` và quyền sở hữu Question ở service/database trước khi triển khai production.

---

## 4.3. ADD-06 – Nguồn dữ liệu và lịch sử chỉnh sửa câu hỏi

**Ưu tiên:** P2.

### Đề xuất

Bổ sung khả năng ghi nhận:

- Nguồn tạo câu hỏi: MANUAL / WORD / PDF / CSV / AI / OTHER.
- Nguồn tham khảo hoặc ghi chú nguồn do User nhập.
- Lịch sử thay đổi nội dung câu hỏi khi cần khôi phục hoặc đối chiếu.

Không bắt buộc lưu toàn bộ lịch sử phiên bản trong MVP. Tuy nhiên, cần bảo đảm snapshot của Mock Exam không bị thay đổi khi Question gốc được sửa/xóa.

---

# 5. Bổ sung nghiệp vụ phân loại chủ đề

## 5.1. Quy tắc phân loại và thống kê

**Ưu tiên:** P1.

Một Question có thể thuộc nhiều Topic. Do đó, khi thống kê theo Topic, một Question có thể xuất hiện trong nhiều nhóm. Tuy nhiên, thống kê tổng theo Exam không được cộng trùng Question.

### Quy tắc bổ sung

| Mã | Quy tắc |
|---|---|
| BR-32 | Số lượng Question tổng của Exam phải đếm mỗi Question một lần, không phụ thuộc số Topic được gắn. |
| BR-33 | Thống kê riêng từng Topic được phép tính Question thuộc Topic đó; tổng các Topic có thể lớn hơn tổng Question của Exam nếu có Question thuộc nhiều Topic. |
| BR-34 | Question chưa được gán Topic phải nằm trong nhóm `Chưa phân loại` hoặc trạng thái tương đương. |
| BR-35 | Tác vụ regroup không được xóa hoặc ghi đè Topic do User gán thủ công nếu chưa có xác nhận rõ ràng. |
| BR-36 | Khi xóa Topic, hệ thống phải thông báo số Question bị ảnh hưởng và hỏi cách xử lý trước khi xác nhận. |

### Hành vi khi xóa Topic

Đề xuất mặc định:

1. Không xóa Question.
2. Xóa các liên kết trong `question_topics` tương ứng.
3. Question không còn Topic nào được đưa vào `Chưa phân loại` hoặc giữ trạng thái chưa phân loại.
4. Không tự động gán Question sang Topic khác.

### Gợi ý kỹ thuật cho phân loại

Có thể bổ sung metadata cho quan hệ Question–Topic:

- `is_manual`: User tự gán hay hệ thống gán.
- `classification_method`: KEYWORD / MANUAL / AI.
- `confidence`: điểm tin cậy (chỉ dùng nếu thuật toán có tính toán được).

Không bắt buộc thêm cả ba trường ở MVP. `is_manual` hiện tại cần được giữ lại.

---

# 6. Bổ sung nghiệp vụ ôn tập và tiến độ

## 6.1. ADD-07 – Phân biệt kết quả đúng/sai và mức độ ghi nhớ

**Ưu tiên:** P1.

### Vấn đề

Kết quả đúng/sai không phản ánh đầy đủ mức độ User ghi nhớ. User có thể trả lời đúng do đoán nhưng vẫn đánh giá bản thân chưa nhớ tốt.

### Đề xuất

Tách hai dữ liệu:

1. `is_correct`: kết quả đánh giá đúng/sai của hệ thống.
2. `rating`: mức độ ghi nhớ do User tự đánh giá: AGAIN / HARD / GOOD / EASY.

Mức rating dùng cho thuật toán lặp ngắt quãng; kết quả đúng/sai dùng cho thống kê kiến thức.

### Dữ liệu nên lưu ở mỗi lần ôn

| Trường | Ý nghĩa |
|---|---|
| `is_correct` | Câu trả lời đúng hay sai, nếu chế độ có chấm đúng/sai |
| `rating` | AGAIN / HARD / GOOD / EASY |
| `elapsed_ms` | Thời gian từ lúc hiển thị đến lúc User phản hồi |
| `answered_at` | Thời điểm trả lời |
| `review_mode` | ALL / TOPIC / WRONG / DUE / FLASHCARD... |

`review_mode` có thể được lưu tại Study Session thay vì lặp lại ở từng Answer Log.

### Quy tắc

- Rating không được tự suy ra từ `is_correct`.
- Nếu User bỏ qua rating, cần quy định giá trị mặc định hoặc yêu cầu User chọn trước khi chuyển câu.
- Chỉ cập nhật lịch ôn khi đã nhận được rating hợp lệ.
- Phiên bản thuật toán phải được ghi nhận để có thể thay đổi thuật toán trong tương lai.

### Lưu ý về SM-2

Tài liệu v1.0 đã chọn SM-2. Trước khi code cần có bảng quy đổi cụ thể từ AGAIN/HARD/GOOD/EASY sang đầu vào thuật toán và quy tắc cập nhật `ease`, `interval_days`, `reps`, `lapses`, `due_at`.

Không nên để mỗi Developer tự quyết định quy đổi này.

---

## 6.2. ADD-08 – Vòng đời Study Session khi Question thay đổi

**Ưu tiên:** P1.

### Vấn đề cần chốt

V1.0 lưu `question_order` nhưng chưa quy định đầy đủ nội dung câu hỏi sẽ được xử lý ra sao khi Question gốc bị sửa hoặc xóa trong lúc một Study Session đang diễn ra.

### Đề xuất nghiệp vụ

- Danh sách câu hỏi và thứ tự trong phiên ôn được cố định khi bắt đầu phiên.
- Nếu cần trải nghiệm nhất quán, nội dung hiển thị trong phiên đang diễn ra phải dựa trên snapshot hoặc phiên bản câu hỏi tại thời điểm bắt đầu.
- Sửa Question gốc chỉ ảnh hưởng đến phiên mới.
- Xóa Question gốc không được làm hỏng phiên đang diễn ra hoặc lịch sử đã hoàn tất.
- Khi kết thúc phiên, kết quả lịch sử phải tham chiếu được Question gốc hoặc snapshot tương ứng.

### Phương án dữ liệu

**Phương án A – Snapshot đầy đủ:** lưu nội dung, lựa chọn, đáp án và giải thích tại từng item của Study Session. Dễ bảo toàn dữ liệu nhưng tăng dung lượng.

**Phương án B – Versioning:** Question có phiên bản; Study Session tham chiếu phiên bản được dùng. Tiết kiệm snapshot lặp lại nhưng phức tạp hơn.

Đề xuất MVP: chọn một phương án và ghi rõ trong thiết kế kỹ thuật. Không để hành vi phụ thuộc ngẫu nhiên vào việc API đọc dữ liệu mới nhất.

---

## 6.3. ADD-09 – Định nghĩa trạng thái học tập

**Ưu tiên:** P1.

Nếu bổ sung trạng thái Chưa thuộc / Đang học / Đã thuộc, cần định nghĩa rõ trạng thái này khác với lịch ôn SM-2 như thế nào.

Đề xuất:

| Trạng thái hiển thị | Ý nghĩa |
|---|---|
| Chưa học | Chưa có lịch sử ôn |
| Đang học | Đã ôn nhưng chưa đạt tiêu chí thành thạo |
| Đã thuộc | Đạt điều kiện do thuật toán hoặc User xác nhận |

Không nên cho phép hai cơ chế trạng thái và SM-2 cập nhật mâu thuẫn. Cần xác định trạng thái này là giá trị suy ra từ lịch sử ôn hay là trạng thái User tự đặt.

---

# 7. Bổ sung nghiệp vụ thi thử

## 7.1. ADD-10 – Bảo đảm chỉ có một Mock Exam đang làm dở

**Ưu tiên:** P0.

BR-11 trong v1.0 quy định mỗi User tối đa một bài thi thử `IN_PROGRESS` nhưng schema hiện tại chưa có ràng buộc bảo đảm điều đó.

### Đề xuất

- Phạm vi áp dụng: tối đa một Mock Exam `IN_PROGRESS` trên toàn tài khoản User, không phải một bài cho mỗi Exam.
- Kiểm tra trước khi tạo bài thi mới.
- Database cần có ràng buộc chống tạo đồng thời hai bản ghi `IN_PROGRESS` cho cùng User.
- Khi có xung đột tạo đồng thời, một request thành công; request còn lại nhận thông báo bài thi đang làm dở.

### SQL tham khảo

SQLite hỗ trợ partial index. Có thể cân nhắc:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS uq_mock_one_in_progress_per_user
ON mock_attempts(user_id)
WHERE status = 'IN_PROGRESS';
```

Cần kiểm tra dữ liệu hiện hữu trước khi tạo index. Nếu đã có User có nhiều bài `IN_PROGRESS`, phải xử lý dữ liệu trước migration.

### Tiêu chí nghiệm thu

1. Một User bắt đầu Mock Exam ở Exam A rồi không thể tạo bài thứ hai ở Exam B khi bài A còn `IN_PROGRESS`.
2. User được phép tiếp tục hoặc nộp bài cũ trước khi bắt đầu bài mới.
3. Hai request tạo bài thi đồng thời không thể cùng tạo thành công hai bản ghi đang làm dở.

---

## 7.2. ADD-11 – Xử lý xung đột khi thi trên nhiều thiết bị

**Ưu tiên:** P0.

### Vấn đề

Quy tắc `last write wins` có thể làm đáp án vừa chọn ở thiết bị này bị ghi đè bởi dữ liệu cũ từ thiết bị khác.

### Đề xuất

Dùng optimistic concurrency control:

- Mỗi Attempt hoặc Attempt Item có trường `version` tăng dần khi cập nhật.
- Client gửi `expected_version` khi autosave.
- Server chỉ cập nhật nếu version hiện tại khớp với `expected_version`.
- Nếu version không khớp, server trả lỗi xung đột kèm trạng thái mới nhất để client đồng bộ và thông báo cho User.
- Không âm thầm ghi đè dữ liệu mới bằng dữ liệu cũ.

### Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-37 | Server là nguồn dữ liệu cuối cùng về đáp án đã lưu và thời gian thi. |
| BR-38 | Request autosave có version cũ không được ghi đè phiên bản mới hơn. |
| BR-39 | Khi phát hiện xung đột, client phải tải trạng thái mới nhất trước khi tiếp tục cập nhật. |
| BR-40 | Không chấp nhận thời gian hoặc deadline do client tự gửi làm căn cứ gia hạn bài thi. |

### Tiêu chí nghiệm thu

1. Hai thiết bị cùng mở một bài thi.
2. Thiết bị A lưu đáp án, version tăng.
3. Thiết bị B gửi dữ liệu dựa trên version cũ.
4. Server từ chối cập nhật cũ và trả thông tin xung đột.
5. Sau đồng bộ, cả hai thiết bị hiển thị dữ liệu mới nhất.

---

## 7.3. ADD-12 – Chuẩn hóa xử lý deadline và grace period

**Ưu tiên:** P0.

Quy tắc BR-15 trong v1.0 cần được làm rõ để tránh phụ thuộc thời gian trên máy người dùng.

### Đề xuất

- `deadline_at` do server tính và là mốc thời gian chuẩn.
- Mọi request autosave phải được server ghi nhận thời điểm nhận (`received_at`).
- Nếu có grace period, chỉ dùng thời điểm server nhận request để xét; không tin timestamp do client cung cấp.
- Chốt rõ grace period áp dụng cho request đã gửi trước deadline nhưng mạng đến trễ, hay cho mọi request đến trong khoảng gia hạn.
- Khi hệ thống chốt bài thi, các request đến sau thời điểm chốt không được làm thay đổi kết quả.
- Việc tự nộp phải idempotent: gọi submit nhiều lần chỉ tạo một kết quả cuối cùng.

### Quyết định cần chốt

- Có sử dụng grace period hay không?
- Nếu có, số giây là bao nhiêu?
- Request đến trong grace period có được cập nhật đáp án hay chỉ chấp nhận các đáp án đã lưu trước deadline?

---

# 8. Bổ sung Import/Export

## 8.1. ADD-13 – Chuẩn hóa dữ liệu trung gian

**Ưu tiên:** P1.

### Mục tiêu

Tất cả định dạng nhập liệu được chuyển về một cấu trúc dữ liệu trung gian thống nhất trước khi validate và lưu database.

```text
DOCX ──┐
PDF ───┤
CSV ───┼──> Internal Question JSON
XLSX ──┤              |
Anki ──┘              v
                  Validation
                      |
                      v
                    Preview
                      |
                      v
                User xác nhận
                      |
                      v
                   Database
```

### Cấu trúc JSON tham khảo

```json
{
  "type": "MULTI",
  "content": "Which statements are correct?",
  "options": [
    { "key": "A", "text": "Option A" },
    { "key": "B", "text": "Option B" }
  ],
  "correct": ["A", "B"],
  "answer_content": null,
  "explanation": "Explanation text",
  "topics": ["Backup & Recovery"],
  "difficulty": 2,
  "source": "WORD"
}
```

Đây là cấu trúc tham khảo; cần thống nhất schema cuối cùng với Developer và validation của từng `type`.

### Quy trình Import bổ sung

1. Parse file thành Internal Question JSON.
2. Validate từng câu độc lập.
3. Tạo preview gồm câu hợp lệ, câu lỗi và cảnh báo trùng.
4. User chọn cách xử lý câu trùng.
5. User xác nhận import.
6. Server xác thực lại dữ liệu và quyền sở hữu Exam.
7. Import theo lô; ghi nhận kết quả thành công/thất bại.
8. Trả báo cáo có thể tải xuống.

### Chính sách xử lý câu trùng

| Lựa chọn | Hành vi |
|---|---|
| Skip | Không nhập câu trùng |
| Keep both | Vẫn nhập thành câu mới |
| Update existing | Cập nhật câu hiện có sau khi User xác nhận rõ câu đích |

Mặc định đề xuất: `Skip` để tránh ghi đè nhầm dữ liệu.

### Quy tắc bổ sung

| Mã | Quy tắc |
|---|---|
| BR-41 | Preview không được ghi dữ liệu chính thức vào bảng Question. |
| BR-42 | Server phải validate lại dữ liệu khi commit, không tin kết quả validation từ client. |
| BR-43 | Một câu lỗi không được làm mất toàn bộ báo cáo import; hệ thống phải chỉ rõ câu nào lỗi và lý do. |
| BR-44 | Cơ chế chống trùng phải chuẩn hóa nội dung trước khi tạo hash và không được coi hash là bằng chứng tuyệt đối rằng hai câu giống nhau. |
| BR-45 | Update existing chỉ thực hiện khi User xác nhận rõ đối tượng bị cập nhật. |

---

## 8.2. ADD-14 – Mở rộng định dạng

**Ưu tiên:** P2/P3.

| Định dạng | Mục đích | Ưu tiên đề xuất |
|---|---|---|
| DOCX | Nhập câu hỏi theo mẫu | MVP |
| PDF có text | Nhập đề thi/tài liệu | P1 |
| CSV | Nhập/xuất hàng loạt | P2 |
| XLSX | Quản lý dữ liệu bằng bảng tính | P2 |
| Anki package | Trao đổi với hệ sinh thái Anki | P3 |
| PDF scan/OCR | Nhập tài liệu dạng ảnh | P3 |

Không cần triển khai đồng thời tất cả định dạng. Dữ liệu trung gian thống nhất sẽ giúp bổ sung định dạng mới mà không phải viết lại quy trình lưu Question.

---

# 9. Bổ sung Dashboard và Learning Analytics

## 9.1. ADD-15 – Định nghĩa chỉ số Dashboard

**Ưu tiên:** P1.

Dashboard cần hiển thị được:

- Tổng số Exam và Question.
- Số câu đã từng ôn.
- Số câu đến hạn hôm nay.
- Số câu sai gần đây.
- Độ chính xác trả lời.
- Tiến độ và kết quả thi thử.
- Các Topic cần cải thiện.
- Hoạt động học gần đây.

### Định nghĩa nghiệp vụ đề xuất

| Chỉ số | Định nghĩa đề xuất | Lưu ý |
|---|---|---|
| Tổng số câu hỏi | Số Question chưa bị xóa mềm thuộc User/Exam | Đếm mỗi Question một lần |
| Câu đã ôn | Số Question có ít nhất một lần review được ghi nhận | Không đếm số lượt ôn |
| Câu đến hạn | Số Question có `due_at <= current_time` | Theo timezone hiển thị đã cấu hình |
| Độ chính xác | Số câu đúng / tổng số câu có chấm đúng-sai trong khoảng thời gian chọn | Không gộp Flashcard tự đánh giá vào mẫu số nếu không có đáp án đúng/sai |
| Câu sai gần đây | Số Question có lần trả lời gần nhất sai trong khoảng thời gian xác định | Cần chốt cửa sổ thời gian |
| Đã thuộc | Theo tiêu chí SM-2 hoặc trạng thái User được chốt | Không tự định nghĩa khác nhau giữa các màn hình |

### Yêu cầu bộ lọc

- Theo Exam.
- Theo khoảng thời gian.
- Theo Topic.
- Theo chế độ ôn.

### Tiêu chí nghiệm thu

1. Tổng số Question không bị đếm trùng khi một Question có nhiều Topic.
2. Các chỉ số Dashboard khớp với dữ liệu chi tiết khi lọc cùng điều kiện.
3. Chỉ hiển thị dữ liệu của User hiện tại.
4. Người dùng hiểu rõ kỳ thời gian đang được dùng để tính các chỉ số.

---

# 10. Bổ sung quyền dữ liệu, xuất dữ liệu và xóa tài khoản

## 10.1. ADD-16 – Người dùng kiểm soát dữ liệu cá nhân

**Ưu tiên:** P1.

### Đề xuất chức năng

- Cho phép User xuất dữ liệu học liệu của mình ở định dạng máy có thể đọc (JSON hoặc ZIP chứa JSON và tài nguyên liên quan).
- Cho phép User yêu cầu xóa tài khoản.
- Trước khi xóa, hiển thị dữ liệu và hệ quả bị xóa.
- Có khoảng thời gian chờ/hủy yêu cầu xóa nếu chủ dự án muốn hỗ trợ khôi phục.
- Khi xóa chính thức, xóa hoặc ẩn danh dữ liệu theo chính sách đã chốt.
- Xóa tài nguyên ở R2 tương ứng, tránh file mồ côi.
- Xác định riêng thời hạn lưu audit log và dữ liệu phục vụ bảo mật/vận hành.

### Quyết định cần chốt

- User có được tự xóa tài khoản hay phải gửi yêu cầu Admin?
- Thời gian chờ trước khi xóa vĩnh viễn là bao lâu?
- Có giữ thống kê đã ẩn danh hay xóa toàn bộ?
- File export có bao gồm ảnh và file đính kèm không?

---

# 11. Bổ sung yêu cầu phi chức năng

| ID | Nhóm | Yêu cầu bổ sung | Ưu tiên |
|---|---|---|---|
| NFR-01 | Bảo mật | Kiểm tra quyền sở hữu ở mọi API đọc/ghi dữ liệu | P0 |
| NFR-02 | Bảo mật | Chống CSRF cho các thao tác thay đổi trạng thái khi dùng cookie session | P0 |
| NFR-03 | Bảo mật | OTP có mục đích sử dụng, hạn dùng, giới hạn thử và gửi lại; không lưu OTP dạng rõ | P0 |
| NFR-04 | Bảo mật | Session có thể thu hồi; token không ghi vào log | P0 |
| NFR-05 | Toàn vẹn dữ liệu | Các thao tác tạo Mock Exam, autosave và submit cần xử lý retry/idempotency phù hợp | P0 |
| NFR-06 | Toàn vẹn dữ liệu | Không âm thầm ghi đè khi có cập nhật đồng thời | P0 |
| NFR-07 | Hiệu năng | Danh sách Question phải hỗ trợ phân trang và lọc phía server khi dữ liệu lớn | P1 |
| NFR-08 | Hiệu năng | Import theo lô và có giới hạn số câu mỗi lần | P1 |
| NFR-09 | Khả dụng | Màn hình ôn tập và thi thử sử dụng được trên thiết bị di động | P1 |
| NFR-10 | Khả dụng | Có trạng thái rõ ràng khi đang lưu, lưu thành công, mất mạng hoặc xung đột dữ liệu | P1 |
| NFR-11 | Sao lưu | Có quy trình backup/restore được kiểm thử định kỳ | P0 |
| NFR-12 | Riêng tư | Admin không xem được nội dung học liệu qua giao diện/API quản trị | P0 |
| NFR-13 | File | Kiểm tra MIME type, dung lượng, quyền truy cập và vòng đời file | P2 |
| NFR-14 | Quan sát hệ thống | Có log lỗi kỹ thuật nhưng không ghi OTP, session token hoặc nội dung nhạy cảm | P1 |

---

# 12. Bổ sung API Contract

Các endpoint dưới đây là phần bổ sung/điều chỉnh định hướng. Developer cần thống nhất request/response schema, mã lỗi và quy ước phân trang trước khi triển khai.

| Nhóm | Method + Endpoint đề xuất | Mô tả |
|---|---|---|
| Auth | `POST /api/auth/email-verification/request` | Gửi OTP xác minh Gmail đăng ký |
| Auth | `POST /api/auth/email-verification/verify` | Xác minh Gmail |
| Auth | `POST /api/auth/otp/request` | Bổ sung `purpose` hoặc tách rõ OTP login khỏi OTP verify |
| Admin | `POST /api/admin/users/:id/grant-admin` | Cấp quyền Admin theo chính sách được phê duyệt; có thể để ngoài MVP |
| Admin | `POST /api/admin/sessions/revoke-all` | Thu hồi session quản trị theo quy trình khẩn cấp |
| Questions | `POST /api/questions/:id/assets` | Tải/gắn file vào Question – Phase sau |
| Questions | `DELETE /api/questions/:id/assets/:assetId` | Xóa file liên quan – Phase sau |
| Study | `PUT /api/study/sessions/:id/items/:position` | Lưu kết quả/đánh giá của item trong phiên ôn nếu chọn mô hình item |
| Import | `POST /api/exams/:id/import/preview` | Chuẩn hóa dữ liệu, trả preview và cảnh báo trùng |
| Import | `POST /api/exams/:id/import/commit` | Commit sau khi server validate lại |
| User Data | `GET /api/me/export` | Yêu cầu hoặc tải dữ liệu cá nhân đã export |
| User Data | `POST /api/me/delete-request` | Gửi yêu cầu xóa tài khoản – nếu được duyệt trong chính sách |

### Quy tắc chung cho API

1. Không nhận `user_id` từ client làm căn cứ phân quyền.
2. Response lỗi không tiết lộ dữ liệu của User khác.
3. Các API thay đổi dữ liệu cần validation phía server.
4. API autosave/submit cần có cơ chế chống retry gây cập nhật lặp.
5. API thi thử đang diễn ra không được trả đáp án đúng hoặc giải thích.
6. API quản trị chỉ cho role ADMIN và phải ghi audit log với thao tác quan trọng.

### Mã lỗi nghiệp vụ đề xuất

| Mã | Ý nghĩa |
|---|---|
| `AUTH_REQUIRED` | Chưa đăng nhập hoặc session không hợp lệ |
| `FORBIDDEN` | Không đủ quyền |
| `RESOURCE_NOT_FOUND` | Không tồn tại hoặc không thuộc quyền truy cập |
| `VALIDATION_ERROR` | Dữ liệu đầu vào không hợp lệ |
| `OTP_INVALID` | OTP không đúng/không hợp lệ |
| `OTP_EXPIRED` | OTP hết hạn |
| `CONCURRENT_UPDATE` | Dữ liệu đã được cập nhật ở nơi khác |
| `MOCK_EXAM_IN_PROGRESS` | User đang có bài thi thử chưa hoàn tất |
| `DEADLINE_REACHED` | Bài thi đã hết hạn hoặc đã được chốt |
| `IMPORT_VALIDATION_FAILED` | Dữ liệu import không đạt validation |

Không nhất thiết phải dùng chính xác các chuỗi trên, nhưng cần một danh mục lỗi thống nhất giữa FE và BE.

---

# 13. Bổ sung Functional Requirements

Các mã dưới đây nối tiếp danh sách FR trong v1.0, tránh thay đổi mã cũ.

| Mã | Chức năng | Ưu tiên đề xuất |
|---|---|---|
| FR-25 | Xác minh Gmail trước khi admin duyệt | Must nếu chủ dự án chọn luồng xác minh |
| FR-26 | Phân biệt OTP xác minh email và OTP đăng nhập | Must |
| FR-27 | Kiểm tra quyền sở hữu Exam/Topic/Question/Session/Attempt ở mọi API | Must |
| FR-28 | Bảo đảm quan hệ Question–Topic thuộc cùng User và Exam | Must |
| FR-29 | Hỗ trợ mặt trước/mặt sau cho loại FLASHCARD | Must |
| FR-30 | Lưu mức tự đánh giá Again/Hard/Good/Easy | Should |
| FR-31 | Lưu thời gian trả lời và lịch sử ôn | Should |
| FR-32 | Quy định hành vi phiên ôn khi Question gốc bị sửa/xóa | Must |
| FR-33 | Chặn nhiều Mock Exam IN_PROGRESS trên một User | Must |
| FR-34 | Phát hiện và xử lý xung đột cập nhật thi thử trên nhiều thiết bị | Must |
| FR-35 | Import qua cấu trúc dữ liệu trung gian thống nhất | Should |
| FR-36 | Cho phép chọn cách xử lý câu hỏi trùng khi Import | Should |
| FR-37 | Dashboard có định nghĩa chỉ số và bộ lọc rõ ràng | Should |
| FR-38 | User có thể xuất dữ liệu học liệu của mình | Should |
| FR-39 | Quy trình yêu cầu xóa tài khoản và dữ liệu | Could |
| FR-40 | Đính kèm hình ảnh/tệp vào Question | Could |
| FR-41 | CSV/XLSX Import/Export | Could |
| FR-42 | Phân loại câu hỏi bằng AI có cơ chế User xác nhận | Could |

---

# 14. Bổ sung tiêu chí UAT

Các tiêu chí dưới đây bổ sung cho danh sách UAT trong v1.0.

| ID | Kịch bản nghiệm thu | Kết quả mong đợi |
|---|---|---|
| UAT-22 | Đăng ký bằng Gmail chưa xác minh | Không được admin duyệt |
| UAT-23 | Dùng OTP xác minh email để đăng nhập | Bị từ chối |
| UAT-24 | User A gọi API đọc Question của User B | Bị từ chối, không lộ nội dung |
| UAT-25 | User A gắn Question của mình vào Topic của User B | Bị từ chối |
| UAT-26 | User A đọc kết quả Mock Attempt của User B | Bị từ chối |
| UAT-27 | Tạo Flashcard không có mặt sau | Validation thất bại |
| UAT-28 | Import/Export Flashcard | Mặt trước và mặt sau được giữ nguyên |
| UAT-29 | Question thuộc hai Topic | Tổng số Question của Exam chỉ đếm một lần |
| UAT-30 | Xóa Topic đang được sử dụng | Hiển thị số Question bị ảnh hưởng và yêu cầu xác nhận |
| UAT-31 | Mở một Mock Exam đang làm dở rồi tạo bài thi thứ hai ở Exam khác | Bị chặn theo chính sách một bài đang làm trên User |
| UAT-32 | Hai thiết bị cập nhật cùng một Attempt Item | Phát hiện xung đột, không âm thầm ghi đè dữ liệu mới |
| UAT-33 | Gửi autosave sau khi bài thi đã được chốt | Không làm thay đổi kết quả cuối cùng |
| UAT-34 | Gọi submit nhiều lần | Kết quả chỉ được chốt một lần, không tạo bản ghi kết quả trùng |
| UAT-35 | Import có câu hợp lệ và câu lỗi | Câu lỗi được báo riêng; không mất báo cáo import |
| UAT-36 | Import câu trùng và chọn Skip | Câu trùng không được tạo mới |
| UAT-37 | Import câu trùng và chọn Update existing | Chỉ câu được User xác nhận mới bị cập nhật |
| UAT-38 | Xem Dashboard với Question có nhiều Topic | Tổng Question không bị đếm trùng |
| UAT-39 | User xuất dữ liệu cá nhân | Chỉ dữ liệu của User hiện tại được export |
| UAT-40 | Admin truy cập nội dung Question qua API quản trị | Bị từ chối theo chính sách riêng tư |

---

# 15. Roadmap điều chỉnh đề xuất

Roadmap trong v1.0 có thể được tổ chức lại để giảm rủi ro phụ thuộc và giúp nghiệm thu theo từng nhóm nghiệp vụ.

| Phase | Phạm vi | Đầu ra chính | Ưu tiên |
|---|---|---|---|
| Phase 0 | Phân tích và chuẩn hóa | BRD, Use Case, ERD, API Contract, wireframe, mẫu import, quyết định nghiệp vụ | Bắt buộc |
| Phase 1 | Tài khoản và nền tảng | Đăng ký, xác minh Gmail (nếu chọn), duyệt, OTP, session, Admin, cách ly dữ liệu | P0 |
| Phase 2 | Quản lý học liệu | Exam, Question, Topic, Flashcard đầy đủ, tìm kiếm, lọc, CRUD | P0 |
| Phase 3 | Ôn tập cơ bản | Ôn toàn bài, theo Topic, Shuffle, lịch sử, đánh giá mức nhớ | P1 |
| Phase 4 | Thi thử | Snapshot, deadline server, autosave, chống xung đột, submit, kết quả | P0/P1 |
| Phase 5 | Import/Export | DOCX, PDF có text, preview, duplicate handling, export | P1 |
| Phase 6 | Dashboard và học thông minh | SM-2 hoàn chỉnh, chỉ số học tập, lịch sử điểm, gợi ý ôn | P1/P2 |
| Phase 7 | Mở rộng | Ảnh/tệp đính kèm, CSV/XLSX, Anki, AI, chia sẻ bộ câu hỏi | P2/P3 |

### Cổng nghiệm thu giữa các Phase

- Không chuyển Phase 2 sang Phase 3 nếu kiểm thử cách ly dữ liệu chưa đạt.
- Không đưa Thi thử production nếu chưa đạt kiểm thử deadline, autosave, xung đột và idempotency.
- Không mở Import hàng loạt nếu chưa có preview, validation và báo cáo lỗi.
- Không triển khai AI tự động ghi dữ liệu nếu chưa có bước User xác nhận và khả năng hoàn tác.

---

# 16. Các quyết định cần chủ dự án xác nhận

Những mục sau chưa thể tự quyết định chỉ từ tài liệu hiện tại. Đề xuất mặc định được đưa ra để chủ dự án dễ chốt.

| STT | Câu hỏi cần chốt | Đề xuất mặc định |
|---|---|---|
| 1 | Có xác minh Gmail trước khi admin duyệt không? | Có |
| 2 | MVP chỉ có một Admin hay nhiều Admin? | Có thể bắt đầu một Admin nhưng phải có quy trình khôi phục/thay thế |
| 3 | Có cho phép User tự xóa tài khoản không? | Có yêu cầu xóa và xác nhận lại; chính sách xóa cụ thể cần chốt |
| 4 | Một Question có được thuộc nhiều Topic không? | Có, giữ thiết kế v1.0 |
| 5 | Khi xóa Topic, Question được xử lý thế nào? | Gỡ liên kết và chuyển sang Chưa phân loại nếu không còn Topic |
| 6 | Study Session có snapshot nội dung không? | Có snapshot hoặc versioning để không thay đổi giữa phiên |
| 7 | Thi thử trên hai thiết bị xử lý thế nào? | Optimistic concurrency, phát hiện xung đột, không last-write-wins âm thầm |
| 8 | Grace period khi hết giờ là bao nhiêu? | Chưa chốt; cần xác định theo trải nghiệm mong muốn |
| 9 | Flashcard có hỗ trợ hình ảnh ngay MVP không? | Chưa; thiết kế để bổ sung ở Phase sau |
| 10 | Câu hỏi trùng khi Import xử lý mặc định thế nào? | Skip, cho phép User chọn phương án khác |
| 11 | CSV/XLSX có cần trong phiên bản đầu không? | Chưa, đưa vào Phase sau |
| 12 | Có cần export toàn bộ dữ liệu cá nhân không? | Nên có, tối thiểu JSON |
| 13 | Trạng thái Đã thuộc được xác định tự động hay User tự đặt? | Ưu tiên suy ra từ thuật toán; cần chốt tiêu chí cụ thể |
| 14 | Dashboard tính độ chính xác theo khoảng thời gian nào? | Mặc định 7 ngày và 30 ngày, đồng thời cho phép tùy chọn |

---

# 17. Đề xuất cấu trúc tài liệu BA hoàn chỉnh

Để bàn giao rõ ràng cho Developer và Tester, nên tổ chức bộ tài liệu dự án thành:

| Tài liệu | Nội dung | Trạng thái |
|---|---|---|
| 1. Product Overview / Scope | Mục tiêu, đối tượng, phạm vi MVP, ngoài phạm vi | Có thể dùng v1.0 |
| 2. BRD | Quy trình nghiệp vụ, actor, trạng thái, business rules | v1.0 + phụ lục này, cần hợp nhất |
| 3. Use Case Specification | Tiền điều kiện, luồng chính, luồng ngoại lệ, hậu điều kiện | Cần xây dựng |
| 4. ERD / Data Dictionary | Quan hệ bảng, khóa, constraint, ý nghĩa trường | Có schema sơ bộ, cần cập nhật |
| 5. API Contract | Endpoint, request, response, validation, error code | Có danh sách endpoint, cần chi tiết |
| 6. Wireframe | Luồng màn hình và trạng thái UI | Cần xây dựng |
| 7. UAT / Test Scenarios | Tiêu chí nghiệm thu và tình huống ngoại lệ | Có v1.0 + phụ lục này |
| 8. Deployment / Operations | Môi trường, secret, backup/restore, monitoring, incident handling | Cần hoàn thiện |

### Definition of Ready (DoR) đề xuất

Một chức năng chỉ nên chuyển cho Developer khi có:

- Mô tả mục tiêu và phạm vi rõ ràng.
- Actor và quyền truy cập.
- Tiền điều kiện và hậu điều kiện.
- Luồng chính và luồng ngoại lệ.
- Business Rules liên quan.
- Trạng thái dữ liệu và validation.
- API/ERD ảnh hưởng (nếu có).
- Acceptance Criteria/UAT có thể kiểm thử.
- Wireframe hoặc mô tả giao diện đủ rõ.

### Definition of Done (DoD) đề xuất

Một chức năng chỉ được xem là hoàn thành khi:

- Đáp ứng Acceptance Criteria.
- Có kiểm thử chức năng và kiểm thử quyền truy cập.
- Có xử lý lỗi và trạng thái loading/empty/error phù hợp.
- Không làm hỏng chức năng hiện có.
- Có migration nếu thay đổi database.
- Có log vận hành phù hợp nhưng không lộ thông tin nhạy cảm.
- Tài liệu API và nghiệp vụ được cập nhật.

---

# 18. Kết luận

Phụ lục v1.1 tập trung làm rõ các khoảng trống quan trọng nhất của thiết kế v1.0:

1. Xác minh email và vòng đời tài khoản.
2. Bảo vệ quyền quản trị và khả năng khôi phục.
3. Cách ly dữ liệu User ở cả API và database.
4. Hoàn thiện mô hình Flashcard.
5. Phân biệt kết quả đúng/sai với mức độ ghi nhớ.
6. Xác định vòng đời và tính nhất quán của Study Session.
7. Bảo đảm tính đúng đắn khi thi thử trên nhiều thiết bị.
8. Chuẩn hóa Import/Export.
9. Định nghĩa chỉ số Dashboard.
10. Hoàn thiện chính sách dữ liệu cá nhân và vận hành.

**Khuyến nghị triển khai:** Ưu tiên chốt toàn bộ nội dung P0 trước khi phát triển các module liên quan. Các chức năng P2/P3 chỉ nên đưa vào backlog để tránh làm MVP quá lớn.

Tài liệu này là phụ lục phân tích và đề xuất. Các nội dung có nhãn **Đề xuất** hoặc nằm trong mục **Quyết định cần chủ dự án xác nhận** cần được xác nhận trước khi xem là yêu cầu chính thức.
