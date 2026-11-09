/**
 * Domain Models and Types for CertFlash (BA Specification v1.1)
 */

export type UserRole = 'ADMIN' | 'USER';

export type UserStatus = 'PENDING_VERIFICATION' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  email_verified_at: number | null;
  created_at: number;
  last_login_at?: number;
}

export type OtpPurpose = 'VERIFY_EMAIL' | 'LOGIN';

export interface OtpCode {
  id: string;
  email: string;
  code: string;
  purpose: OtpPurpose;
  expires_at: number;
  consumed_at: number | null;
  attempts: number;
}

export type AuditAction = 
  | 'APPROVE_USER'
  | 'REJECT_USER'
  | 'BLOCK_USER'
  | 'UNBLOCK_USER'
  | 'GRANT_ADMIN'
  | 'REVOKE_SESSIONS'
  | 'DELETE_ACCOUNT';

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  action: AuditAction;
  target_id: string;
  target_email: string;
  details: string;
  timestamp: number;
}

export interface Exam {
  id: string;
  user_id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  passing_score: number; // e.g. 72%
  default_time_minutes: number; // e.g. 130 mins
  is_preset?: boolean;
  created_at: number;
  updated_at: number;
}

export interface Topic {
  id: string;
  exam_id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
}

export type QuestionType = 'SINGLE' | 'MULTI' | 'FLASHCARD';

export interface QuestionOption {
  key: string; // e.g. "A", "B", "C", "D"
  text: string;
}

export interface Question {
  id: string;
  exam_id: string;
  user_id: string;
  type: QuestionType;
  content: string; // Front of flashcard or Question stem
  options?: QuestionOption[]; // SINGLE / MULTI
  correct?: string[]; // array of keys like ["A"] or ["A", "C"]
  answer_content?: string | null; // Back of Flashcard (ADD-04 mandatory)
  explanation: string;
  topics: string[]; // topic IDs
  difficulty: 1 | 2 | 3; // 1: Dễ, 2: Trung bình, 3: Khó
  source: 'MANUAL' | 'DOCX' | 'PDF' | 'CSV' | 'PRESET' | 'AI';
  version: number; // for optimistic concurrency
  created_at: number;
  updated_at: number;
}

export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type ReviewMode = 'ALL' | 'TOPIC' | 'WRONG' | 'DUE' | 'FLASHCARD';

export interface QuestionProgress {
  user_id: string;
  question_id: string;
  exam_id: string;
  reps: number;
  interval_days: number;
  ease: number; // e.g. 2.5
  lapses: number;
  due_at: number;
  last_reviewed_at: number;
  status: 'NEW' | 'LEARNING' | 'MASTERED';
  history: {
    rating: ReviewRating;
    is_correct?: boolean;
    elapsed_ms: number;
    timestamp: number;
  }[];
}

export interface StudySessionItem {
  question_id: string;
  // Snapshot of question content at session start (ADD-08)
  snapshot: Question;
  rating?: ReviewRating;
  is_correct?: boolean;
  elapsed_ms?: number;
  answered_at?: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  exam_id: string;
  mode: ReviewMode;
  topic_ids?: string[];
  items: StudySessionItem[];
  started_at: number;
  completed_at?: number;
}

export type MockAttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface MockAttemptItem {
  question_id: string;
  snapshot: Question;
  selected_answers: string[]; // e.g. ["A", "C"]
  is_flagged: boolean;
  version: number; // optimistic concurrency counter (ADD-11)
  is_correct?: boolean;
}

export interface MockAttempt {
  id: string;
  user_id: string;
  exam_id: string;
  status: MockAttemptStatus;
  started_at: number;
  deadline_at: number; // calculated on server / authority (ADD-12)
  submitted_at?: number;
  duration_minutes: number;
  passing_score: number;
  score_percentage?: number;
  total_questions: number;
  correct_count?: number;
  is_passed?: boolean;
  version: number; // attempt level version
  items: MockAttemptItem[];
  topic_breakdown?: {
    topic_id: string;
    topic_name: string;
    total: number;
    correct: number;
    percentage: number;
  }[];
}

export type DuplicateStrategy = 'SKIP' | 'KEEP_BOTH' | 'UPDATE_EXISTING';

export interface IntermediateQuestion {
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correct?: string[];
  answer_content?: string | null;
  explanation: string;
  topics: string[];
  difficulty: 1 | 2 | 3;
  source: string;
}

export interface ImportPreviewItem {
  raw: IntermediateQuestion;
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  isDuplicate: boolean;
  duplicateQuestionId?: string;
}

export interface ImportReport {
  total: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  items: ImportPreviewItem[];
}
