-- ==============================================================================
-- Schema Cloudflare D1 Database cho CertFlash (BA Specification v1.1)
-- ==============================================================================

-- Bật hỗ trợ Foreign Keys trong SQLite/D1
PRAGMA foreign_keys = ON;

-- 1. Bảng Người dùng (Users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN' | 'USER'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING_VERIFICATION' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED'
  email_verified_at INTEGER,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Chỉ mục tìm kiếm email nhanh
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Bảng Mã OTP (OtpCodes - BR-21: Phân tách VERIFY_EMAIL và LOGIN)
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'VERIFY_EMAIL' | 'LOGIN'
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_otp_lookup ON otp_codes(email, purpose, expires_at);

-- 3. Bảng Nhật ký kiểm toán (AuditLogs - ADD-02)
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_email TEXT NOT NULL,
  details TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

-- 4. Bảng Chứng chỉ / Đề thi (Exams)
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Cloud',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  passing_score INTEGER NOT NULL DEFAULT 72,
  default_time_minutes INTEGER NOT NULL DEFAULT 120,
  is_preset INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Ràng buộc cặp (id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_exams_id_user ON exams(id, user_id);

-- 5. Bảng Chủ đề kiến thức (Topics)
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 6. Bảng Câu hỏi & Flashcard (Questions - ADD-04)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'SINGLE' | 'MULTI' | 'FLASHCARD'
  content TEXT NOT NULL, -- Mặt trước Flashcard hoặc Câu hỏi
  options TEXT, -- JSON Array: [{"key": "A", "text": "..."}]
  correct TEXT, -- JSON Array: ["A"]
  answer_content TEXT, -- Mặt sau Flashcard (Bắt buộc với FLASHCARD theo ADD-04)
  explanation TEXT,
  topics TEXT NOT NULL DEFAULT '[]', -- JSON Array of topic IDs
  difficulty INTEGER NOT NULL DEFAULT 2, -- 1: Dễ, 2: Trung bình, 3: Khó
  source TEXT NOT NULL DEFAULT 'MANUAL',
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 7. Bảng Tiến độ Spaced Repetition SM-2 (QuestionProgress)
CREATE TABLE IF NOT EXISTS question_progress (
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  reps INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  lapses INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL,
  last_reviewed_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'LEARNING',
  history TEXT NOT NULL DEFAULT '[]', -- JSON Array of review entries
  PRIMARY KEY (user_id, question_id)
);

-- 8. Bảng Bài thi thử (MockAttempts - ADD-10, ADD-11, ADD-12)
CREATE TABLE IF NOT EXISTS mock_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  started_at INTEGER NOT NULL,
  deadline_at INTEGER NOT NULL,
  submitted_at INTEGER,
  duration_minutes INTEGER NOT NULL,
  passing_score INTEGER NOT NULL,
  score_percentage INTEGER,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER,
  is_passed INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  items TEXT NOT NULL DEFAULT '[]', -- JSON Array of items
  topic_breakdown TEXT -- JSON Array of topic breakdown
);

-- Ràng buộc ADD-10: Mỗi người dùng chỉ có tối đa 1 bài thi đang làm dở (IN_PROGRESS) trên toàn hệ thống
CREATE UNIQUE INDEX IF NOT EXISTS uq_mock_one_in_progress_per_user
ON mock_attempts(user_id)
WHERE status = 'IN_PROGRESS';

-- ==============================================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- Quản trị viên duy nhất: huyhoangpham387@gmail.com
-- ==============================================================================

INSERT OR REPLACE INTO users (id, email, name, role, status, email_verified_at, created_at, last_login_at)
VALUES (
  'user-admin-huyhoang',
  'huyhoangpham387@gmail.com',
  'Huy Hoàng (Lead Admin)',
  'ADMIN',
  'ACTIVE',
  1700000000000,
  1700000000000,
  1700000000000
);

-- Bộ đề AWS SAA-C03 mẫu
INSERT OR REPLACE INTO exams (id, user_id, code, title, description, icon, color, passing_score, default_time_minutes, is_preset, created_at, updated_at)
VALUES (
  'exam-aws-saa',
  'user-admin-huyhoang',
  'SAA-C03',
  'AWS Certified Solutions Architect – Associate',
  'Kiến trúc hệ thống điện toán đám mây AWS: Compute, Storage, High Availability, Security.',
  'Cloud',
  '#f59e0b',
  72,
  130,
  1,
  1700000000000,
  1700000000000
);

-- Bộ đề Azure AZ-104 mẫu
INSERT OR REPLACE INTO exams (id, user_id, code, title, description, icon, color, passing_score, default_time_minutes, is_preset, created_at, updated_at)
VALUES (
  'exam-az-104',
  'user-admin-huyhoang',
  'AZ-104',
  'Microsoft Certified: Azure Administrator Associate',
  'Quản trị hạ tầng Azure: Compute, VNet, Identity và Storage.',
  'Server',
  '#0284c7',
  70,
  120,
  1,
  1700010000000,
  1700010000000
);

-- Bộ đề PSM I mẫu
INSERT OR REPLACE INTO exams (id, user_id, code, title, description, icon, color, passing_score, default_time_minutes, is_preset, created_at, updated_at)
VALUES (
  'exam-psm-1',
  'user-admin-huyhoang',
  'PSM I',
  'Professional Scrum Master I',
  'Chứng chỉ Scrum Master quốc tế: Scrum Framework, Roles, Events, Artifacts.',
  'Award',
  '#10b981',
  85,
  60,
  1,
  1700020000000,
  1700020000000
);
