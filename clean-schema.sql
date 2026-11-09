-- ==============================================================================
-- CERTFLASH - CLOUDFLARE D1 CLEAN DATABASE SCHEMA (NO MOCK DATA)
-- Khởi tạo Database sạch 100% trên Cloudflare D1 Console (dash.cloudflare.com)
-- Tài khoản Quản trị viên duy nhất: huyhoangpham387@gmail.com
-- ==============================================================================

-- 1. BẢNG NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN' hoặc 'USER'
  is_active INTEGER NOT NULL DEFAULT 1, -- 1: hoạt động, 0: bị khóa
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 2. BẢNG CHỨNG CHỈ / ĐỀ THI (EXAMS)
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL, -- Ví dụ: '1Z0-083', 'AWS-SAA-C03'
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  passing_score INTEGER NOT NULL DEFAULT 72,
  total_questions INTEGER NOT NULL DEFAULT 60,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. BẢNG CHỦ ĐỀ / DOMAINS (TOPICS)
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 4. BẢNG NGÂN HÀNG CÂU HỎI & FLASHCARD (QUESTIONS)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'SINGLE', 'MULTI', hoặc 'FLASHCARD'
  content TEXT NOT NULL, -- Nội dung câu hỏi hoặc Mặt trước thẻ Flashcard
  options_json TEXT, -- JSON array các phương án [{ key: 'A', text: '...' }]
  correct_json TEXT, -- JSON array các đáp án đúng ["A"] hoặc ["A", "C"]
  answer_content TEXT, -- Mặt sau của Flashcard (bắt buộc với FLASHCARD)
  explanation TEXT, -- Lời giải chi tiết
  topics_json TEXT NOT NULL DEFAULT '[]', -- JSON array các topic IDs
  difficulty INTEGER NOT NULL DEFAULT 2, -- 1: Dễ, 2: Vừa, 3: Khó
  source TEXT NOT NULL DEFAULT 'MANUAL', -- 'DOCX', 'PDF', 'MANUAL'
  version INTEGER NOT NULL DEFAULT 1, -- Optimistic concurrency control (OCC)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. BẢNG TIẾN TRÌNH ÔN TẬP THUẬT TOÁN SM-2 (QUESTION_REVIEWS)
CREATE TABLE IF NOT EXISTS question_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  interval_days REAL NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  lapses INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL,
  last_reviewed_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'LEARNING', 'MASTERED'
  history_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 6. BẢNG KẾT QUẢ THI THỬ (MOCK_ATTEMPTS)
CREATE TABLE IF NOT EXISTS mock_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'
  started_at INTEGER NOT NULL,
  deadline_at INTEGER NOT NULL,
  submitted_at INTEGER,
  duration_minutes INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  score_percentage REAL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER,
  is_passed INTEGER, -- 1: Đỗ, 0: Trượt
  version INTEGER NOT NULL DEFAULT 1,
  answers_json TEXT NOT NULL DEFAULT '[]', -- Lưu bài làm và snapshot câu hỏi
  topic_breakdown_json TEXT, -- Thống kê điểm theo từng topic
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 7. BẢNG MÃ XÁC THỰC OTP RESEND (OTP_CODES)
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'LOGIN', 'REGISTER', 'RESET_PASSWORD'
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- ------------------------------------------------------------------------------
-- CÁC CHỈ MỤC TĂNG TỐC TRUY VẤN (INDEXES)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_exam ON topics(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_exam ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_due ON question_reviews(user_id, due_at);
CREATE INDEX IF NOT EXISTS idx_mock_user_exam ON mock_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_otp_email_purpose ON otp_codes(email, purpose);

-- ------------------------------------------------------------------------------
-- KHỞI TẠO TÀI KHOẢN QUẢN TRỊ VIÊN DUY NHẤT (KHÔNG CÓ DỮ LIỆU ĐỀ MẪU)
-- ------------------------------------------------------------------------------
INSERT OR REPLACE INTO users (id, email, name, role, is_active, email_verified_at, created_at, updated_at)
VALUES (
  'admin-huyhoang',
  'huyhoangpham387@gmail.com',
  'Huy Hoàng (Quản trị viên)',
  'ADMIN',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000,
  unixepoch() * 1000
);
