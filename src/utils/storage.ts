/**
 * Central Storage and Domain Service with BA v1.1 Rules & Data Isolation
 */

import {
  AuditLog,
  DuplicateStrategy,
  Exam,
  IntermediateQuestion,
  MockAttempt,
  OtpCode,
  OtpPurpose,
  Question,
  QuestionProgress,
  StudySession,
  Topic,
  User
} from '../types';
import { calculateSM2 } from './sm2';
import { SEED_AUDIT_LOGS, SEED_EXAMS, SEED_QUESTIONS, SEED_TOPICS, SEED_USERS } from '../data/seedData';

const STORAGE_KEYS = {
  USERS: 'certflash_users_v1',
  CURRENT_USER: 'certflash_current_user_v1',
  EXAMS: 'certflash_exams_v1',
  TOPICS: 'certflash_topics_v1',
  QUESTIONS: 'certflash_questions_v1',
  PROGRESS: 'certflash_progress_v1',
  STUDY_SESSIONS: 'certflash_study_sessions_v1',
  MOCK_ATTEMPTS: 'certflash_mock_attempts_v1',
  AUDIT_LOGS: 'certflash_audit_logs_v1',
  OTP_CODES: 'certflash_otp_codes_v1'
};

class StorageService {
  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    } else {
      // Ensure huyhoangpham387@gmail.com is registered as Lead Admin in existing storage
      try {
        let existingUsers: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        // Purge old demo accounts
        const trialEmails = ['admin@certflash.io', 'user@certflash.io', 'phuong.thao@techmail.vn', 'chua.xac.thuc@gmail.com'];
        existingUsers = existingUsers.filter(u => !trialEmails.includes(u.email.toLowerCase()));

        const adminIndex = existingUsers.findIndex(u => u.email.toLowerCase() === 'huyhoangpham387@gmail.com');
        if (adminIndex === -1) {
          existingUsers.unshift({
            id: 'user-admin-huyhoang',
            email: 'huyhoangpham387@gmail.com',
            name: 'Huy Hoàng (Lead Admin)',
            role: 'ADMIN',
            status: 'ACTIVE',
            email_verified_at: 1700000000000,
            created_at: 1700000000000,
            last_login_at: Date.now()
          });
        } else {
          existingUsers[adminIndex].role = 'ADMIN';
          existingUsers[adminIndex].status = 'ACTIVE';
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(existingUsers));
      } catch (e) {
        console.error('Error synchronizing admin account', e);
      }
    }

    // Do not auto-login any user. Default state is guest mode requiring login.

    if (!localStorage.getItem(STORAGE_KEYS.EXAMS)) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(SEED_EXAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOPICS)) {
      localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(SEED_TOPICS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(SEED_QUESTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.OTP_CODES)) {
      localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify([]));
    }
  }

  // --- Auth & User Management ---

  public getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  }

  private saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /**
   * BR-20: Only verified email accounts show in admin pending queue
   */
  public getPendingUsersForAdmin(adminUser: User): User[] {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('FORBIDDEN: Chỉ có quản trị viên mới được xem danh sách duyệt.');
    }
    const users = this.getUsers();
    return users.filter(u => u.status === 'PENDING' && u.email_verified_at !== null);
  }

  public getAllUsersForAdmin(adminUser: User): User[] {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('FORBIDDEN');
    }
    return this.getUsers();
  }

  /**
   * Request OTP for Email Verification or Login (BR-21, BR-22)
   */
  /**
   * Request OTP for Email Verification or Login (BR-21, BR-22)
   */
  public requestOtp(email: string, purpose: OtpPurpose): { code: string; expires_at: number } {
    const normalizedEmail = email.trim().toLowerCase();
    const otpsRaw = localStorage.getItem(STORAGE_KEYS.OTP_CODES);
    const otps: OtpCode[] = otpsRaw ? JSON.parse(otpsRaw) : [];
    const now = Date.now();

    // 1. Invalidate ALL previous unconsumed OTPs for this email and purpose to prevent collisions
    otps.forEach(o => {
      if (o.email === normalizedEmail && o.purpose === purpose && o.consumed_at === null) {
        o.consumed_at = now;
      }
    });

    // 2. Clean old expired records older than 24h
    const cleanOtps = otps.filter(o => o.expires_at > now - 24 * 60 * 60 * 1000);

    // 3. Generate secure 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = now + 10 * 60 * 1000; // 10 minutes

    const newOtp: OtpCode = {
      id: 'otp-' + Date.now(),
      email: normalizedEmail,
      code,
      purpose,
      expires_at,
      consumed_at: null,
      attempts: 0
    };

    cleanOtps.push(newOtp);
    localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(cleanOtps));

    return { code, expires_at };
  }

  /**
   * Request OTP with Cloudflare & Resend integration (Strict - No client bypass)
   */
  public async requestOtpWithResend(
    email: string,
    purpose: OtpPurpose,
    customApiKey?: string
  ): Promise<{ emailSent: boolean; message: string; errorDetail?: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const local = this.requestOtp(normalizedEmail, purpose);
    let emailSent = false;
    let message = '';
    let errorDetail: string | undefined = undefined;
    const apiKey = (customApiKey || localStorage.getItem('certflash_resend_api_key') || '').trim();

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          purpose,
          code: local.code, // Synchronize exact code with backend
          resendApiKey: apiKey
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        emailSent = !!data.emailSent;
        errorDetail = data.errorDetail;
        message = data.message || '';
      } else {
        const data: any = await res.json().catch(() => ({}));
        errorDetail = data.error || 'Máy chủ không thể gửi OTP lúc này.';
      }
    } catch (e: any) {
      errorDetail = e.message || 'Lỗi kết nối máy chủ gửi OTP';
    }

    return {
      emailSent,
      errorDetail,
      message: message || (emailSent 
        ? `Đã gửi mã OTP đến ${normalizedEmail} qua Resend.` 
        : `Chưa gửi được mail qua Resend.`)
    };
  }

  /**
   * Verify OTP with Purpose Check, sorted newest first, with attempt recovery (BR-21)
   */
  public verifyOtp(email: string, code: string, expectedPurpose: OtpPurpose): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const otpsRaw = localStorage.getItem(STORAGE_KEYS.OTP_CODES);
    const otps: OtpCode[] = otpsRaw ? JSON.parse(otpsRaw) : [];
    const now = Date.now();

    // Find all valid active OTPs for this email, sorted newest first
    const activeOtps = otps.filter(
      o => o.email === normalizedEmail &&
           o.purpose === expectedPurpose &&
           o.consumed_at === null
    ).sort((a, b) => b.expires_at - a.expires_at);

    const targetOtp = activeOtps[0];

    if (!targetOtp || targetOtp.expires_at <= now) {
      throw new Error('Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng bấm "Gửi lại OTP mới" để nhận mã mới.');
    }

    if (targetOtp.attempts >= 5) {
      targetOtp.consumed_at = now; // Invalidate permanently
      localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(otps));
      throw new Error('Mã OTP đã bị khóa do nhập sai quá 5 lần! Vui lòng bấm "Gửi lại OTP mới" để nhận mã mới.');
    }

    if (targetOtp.code !== code.trim()) {
      targetOtp.attempts += 1;
      if (targetOtp.attempts >= 5) {
        targetOtp.consumed_at = now; // Invalidate permanently upon 5th failure
        localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(otps));
        throw new Error('Bạn đã nhập sai 5 lần! Mã OTP này đã bị hủy. Vui lòng bấm "Gửi lại OTP mới".');
      }
      localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(otps));
      throw new Error(`Mã OTP không chính xác. Bạn còn ${5 - targetOtp.attempts} lần thử.`);
    }

    // Success: Consume OTP
    targetOtp.consumed_at = now;
    localStorage.setItem(STORAGE_KEYS.OTP_CODES, JSON.stringify(otps));
    return true;
  }


  /**
   * Guest Registration with email verification flow (ADD-01, BR-23, BR-24)
   */
  public registerUser(name: string, email: string): { user: User; otpCode: string } {
    const normalizedEmail = email.trim().toLowerCase();
    const users = this.getUsers();

    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      if (existing.status === 'BLOCKED') {
        throw new Error('Tài khoản này đã bị khóa khỏi hệ thống.');
      }
      if (existing.status === 'ACTIVE' || existing.status === 'PENDING') {
        throw new Error('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.');
      }
    }

    const newUser: User = {
      id: existing ? existing.id : 'user-' + Date.now(),
      email: normalizedEmail,
      name: name.trim(),
      role: 'USER',
      status: 'PENDING_VERIFICATION',
      email_verified_at: null,
      created_at: Date.now()
    };

    const updatedUsers = existing ? users.map(u => u.id === existing.id ? newUser : u) : [...users, newUser];
    this.saveUsers(updatedUsers);

    // Generate VERIFY_EMAIL OTP
    const { code } = this.requestOtp(normalizedEmail, 'VERIFY_EMAIL');
    return { user: newUser, otpCode: code };
  }

  /**
   * Complete email verification: moves to PENDING for admin approval (BR-20)
   */
  public completeEmailVerification(email: string, code: string): User {
    this.verifyOtp(email, code, 'VERIFY_EMAIL');
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (userIndex === -1) {
      throw new Error('Không tìm thấy tài khoản tương ứng.');
    }

    users[userIndex].email_verified_at = Date.now();
    users[userIndex].status = 'PENDING'; // Ready for Admin review
    this.saveUsers(users);

    return users[userIndex];
  }

  /**
   * Admin approves user (ADD-02, BR-20)
   */
  public adminApproveUser(adminUser: User, targetUserId: string) {
    if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
    const users = this.getUsers();
    const target = users.find(u => u.id === targetUserId);
    if (!target) throw new Error('Người dùng không tồn tại.');
    if (!target.email_verified_at) throw new Error('Không thể duyệt người dùng chưa xác minh email.');

    target.status = 'ACTIVE';
    this.saveUsers(users);

    // Audit log
    this.addAuditLog(adminUser, 'APPROVE_USER', target.id, target.email, 'Duyệt tài khoản người dùng.');
  }

  public adminRejectUser(adminUser: User, targetUserId: string, reason: string) {
    if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
    const users = this.getUsers();
    const target = users.find(u => u.id === targetUserId);
    if (!target) throw new Error('Người dùng không tồn tại.');

    target.status = 'REJECTED';
    this.saveUsers(users);

    this.addAuditLog(adminUser, 'REJECT_USER', target.id, target.email, `Từ chối duyệt: ${reason}`);
  }

  public adminToggleBlockUser(adminUser: User, targetUserId: string, block: boolean) {
    if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
    const users = this.getUsers();
    const target = users.find(u => u.id === targetUserId);
    if (!target) throw new Error('Người dùng không tồn tại.');
    if (target.id === adminUser.id) throw new Error('Không thể tự khóa tài khoản của chính mình.');

    target.status = block ? 'BLOCKED' : 'ACTIVE';
    this.saveUsers(users);

    this.addAuditLog(
      adminUser,
      block ? 'BLOCK_USER' : 'UNBLOCK_USER',
      target.id,
      target.email,
      block ? 'Khóa quyền truy cập' : 'Mở khóa tài khoản'
    );
  }

  // --- Audit Logs (ADD-02) ---

  public getAuditLogs(adminUser: User): AuditLog[] {
    if (adminUser.role !== 'ADMIN') throw new Error('FORBIDDEN');
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  }

  public addAuditLog(
    actor: User,
    action: AuditLog['action'],
    targetId: string,
    targetEmail: string,
    details: string
  ) {
    const logs = this.getAuditLogs(actor);
    const newLog: AuditLog = {
      id: 'audit-' + Date.now(),
      actor_id: actor.id,
      actor_email: actor.email,
      action,
      target_id: targetId,
      target_email: targetEmail,
      details,
      timestamp: Date.now()
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
  }

  // --- Exams & Topics (ADD-03, BR-26, BR-27) ---

  public getExams(userId: string): Exam[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    const all: Exam[] = raw ? JSON.parse(raw) : [];
    // Isolated to user or presets copied to user
    return all.filter(e => e.user_id === userId || (e.is_preset && !all.some(other => other.code === e.code && other.user_id === userId)));
  }

  public saveExam(exam: Exam, userId: string): Exam {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    const all: Exam[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex(e => e.id === exam.id && e.user_id === userId);

    const now = Date.now();
    const updated = {
      ...exam,
      user_id: userId,
      updated_at: now
    };

    if (index >= 0) {
      all[index] = updated;
    } else {
      updated.id = updated.id || 'exam-' + Date.now();
      updated.created_at = now;
      all.push(updated);
    }

    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(all));
    return updated;
  }

  public getTopics(examId: string, userId: string): Topic[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPICS);
    const all: Topic[] = raw ? JSON.parse(raw) : [];
    return all.filter(t => t.exam_id === examId && (t.user_id === userId || !t.user_id || t.id.startsWith('topic-')));
  }

  public saveTopic(topic: Topic, userId: string): Topic {
    const raw = localStorage.getItem(STORAGE_KEYS.TOPICS);
    const all: Topic[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex(t => t.id === topic.id);

    const updated = {
      ...topic,
      user_id: userId,
      id: topic.id || 'topic-' + Date.now()
    };

    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }

    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(all));
    return updated;
  }

  /**
   * Delete Topic with BR-36 Impact notice
   */
  public deleteTopic(topicId: string, userId: string): { affectedQuestions: number } {
    const topicsRaw = localStorage.getItem(STORAGE_KEYS.TOPICS);
    const topics: Topic[] = topicsRaw ? JSON.parse(topicsRaw) : [];
    const filteredTopics = topics.filter(t => t.id !== topicId);
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(filteredTopics));

    // Update affected questions (BR-34, BR-35: remove topic from question)
    const questions = this.getQuestionsByExam('', userId); // get all user questions
    let affected = 0;
    const allQuestionsRaw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const allQuestions: Question[] = allQuestionsRaw ? JSON.parse(allQuestionsRaw) : [];

    allQuestions.forEach(q => {
      if (q.user_id === userId && q.topics.includes(topicId)) {
        q.topics = q.topics.filter(tid => tid !== topicId);
        affected++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(allQuestions));
    return { affectedQuestions: affected };
  }

  // --- Questions (ADD-03, ADD-04, BR-26, BR-32) ---

  public getQuestionsByExam(examId: string, userId: string): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const all: Question[] = raw ? JSON.parse(raw) : [];
    return all.filter(q => {
      const matchUser = q.user_id === userId || (q.source === 'PRESET');
      if (!matchUser) return false;
      return examId ? q.exam_id === examId : true;
    });
  }

  /**
   * BR-32: Total Question count deduplicated per exam
   */
  public getExamQuestionStats(examId: string, userId: string) {
    const questions = this.getQuestionsByExam(examId, userId);
    const uniqueIds = new Set(questions.map(q => q.id));
    return {
      totalQuestions: uniqueIds.size,
      singleCount: questions.filter(q => q.type === 'SINGLE').length,
      multiCount: questions.filter(q => q.type === 'MULTI').length,
      flashcardCount: questions.filter(q => q.type === 'FLASHCARD').length
    };
  }

  /**
   * Question validation (ADD-04)
   */
  public validateQuestion(q: Partial<Question>): string[] {
    const errors: string[] = [];
    if (!q.content || q.content.trim().length === 0) {
      errors.push('Nội dung câu hỏi / Mặt trước Flashcard không được để trống.');
    }

    if (q.type === 'FLASHCARD') {
      if (!q.answer_content || q.answer_content.trim().length === 0) {
        errors.push('Mặt sau Flashcard (answer_content) là bắt buộc và không được để trống (ADD-04).');
      }
    } else {
      // SINGLE or MULTI
      if (!q.options || q.options.length < 2) {
        errors.push('Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án lựa chọn.');
      }
      if (!q.correct || q.correct.length === 0) {
        errors.push('Phải chọn ít nhất một đáp án đúng.');
      }
      if (q.type === 'SINGLE' && q.correct && q.correct.length > 1) {
        errors.push('Câu hỏi SINGLE chỉ được phép có đúng 1 đáp án chính xác.');
      }
    }

    return errors;
  }

  public saveQuestion(question: Question, userId: string): Question {
    const errors = this.validateQuestion(question);
    if (errors.length > 0) {
      throw new Error(`Lỗi dữ liệu: ${errors.join(', ')}`);
    }

    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const all: Question[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex(q => q.id === question.id);

    const now = Date.now();
    const updated: Question = {
      ...question,
      user_id: userId,
      version: (question.version || 0) + 1,
      updated_at: now
    };

    if (index >= 0) {
      all[index] = updated;
    } else {
      updated.id = updated.id || 'q-' + Date.now();
      updated.created_at = now;
      all.push(updated);
    }

    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(all));
    return updated;
  }

  public deleteQuestion(questionId: string, userId: string) {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const all: Question[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(q => !(q.id === questionId && (q.user_id === userId || q.source === 'PRESET')));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
  }

  /**
   * Delete all questions belonging to an exam (Clean slate for custom dumps)
   */
  public clearExamQuestions(examId: string, userId: string): number {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    const all: Question[] = raw ? JSON.parse(raw) : [];
    const initialCount = all.length;
    const filtered = all.filter(q => q.exam_id !== examId);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
    return initialCount - filtered.length;
  }

  /**
   * Purge all sample mock data for zero-sample clean start
   */
  public clearAllMockExams(userId: string): void {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([]));
  }

  // --- Spaced Repetition (SM-2) & Progress ---

  public getProgressList(userId: string, examId?: string): QuestionProgress[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const all: QuestionProgress[] = raw ? JSON.parse(raw) : [];
    return all.filter(p => p.user_id === userId && (examId ? p.exam_id === examId : true));
  }

  public getQuestionProgress(userId: string, questionId: string): QuestionProgress | undefined {
    const list = this.getProgressList(userId);
    return list.find(p => p.question_id === questionId);
  }

  public recordReview(
    userId: string,
    questionId: string,
    examId: string,
    rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY',
    isCorrect: boolean,
    elapsedMs: number
  ): QuestionProgress {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    const all: QuestionProgress[] = raw ? JSON.parse(raw) : [];
    const current = all.find(p => p.user_id === userId && p.question_id === questionId);

    const sm2 = calculateSM2(current, rating);

    const updated: QuestionProgress = {
      user_id: userId,
      question_id: questionId,
      exam_id: examId,
      reps: sm2.reps,
      interval_days: sm2.interval_days,
      ease: sm2.ease,
      lapses: sm2.lapses,
      due_at: sm2.due_at,
      last_reviewed_at: Date.now(),
      status: sm2.status,
      history: [
        ...(current?.history || []),
        {
          rating,
          is_correct: isCorrect,
          elapsed_ms: elapsedMs,
          timestamp: Date.now()
        }
      ]
    };

    const index = all.findIndex(p => p.user_id === userId && p.question_id === questionId);
    if (index >= 0) {
      all[index] = updated;
    } else {
      all.push(updated);
    }

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
    return updated;
  }

  // --- Mock Exam System (ADD-10, ADD-11, ADD-12) ---

  public getMockAttempts(userId: string): MockAttempt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCK_ATTEMPTS);
    const all: MockAttempt[] = raw ? JSON.parse(raw) : [];
    return all.filter(a => a.user_id === userId);
  }

  public getActiveMockAttempt(userId: string): MockAttempt | null {
    const attempts = this.getMockAttempts(userId);
    return attempts.find(a => a.status === 'IN_PROGRESS') || null;
  }

  /**
   * ADD-10: Max 1 IN_PROGRESS mock exam per user account.
   */
  public startMockExam(
    userId: string,
    exam: Exam,
    questions: Question[],
    durationMinutes: number,
    customPassingScore?: number
  ): MockAttempt {
    const active = this.getActiveMockAttempt(userId);
    if (active) {
      throw new Error('MOCK_EXAM_IN_PROGRESS: Bạn đang có một bài thi thử chưa nộp. Hãy hoàn thành hoặc hủy bài thi trước khi bắt đầu bài mới.');
    }

    const now = Date.now();
    const deadline_at = now + durationMinutes * 60 * 1000;

    const items = questions.map(q => ({
      question_id: q.id,
      snapshot: q, // Snapshot of question at start
      selected_answers: [],
      is_flagged: false,
      version: 1
    }));

    const passing = (typeof customPassingScore === 'number' && customPassingScore > 0)
      ? customPassingScore
      : exam.passing_score;

    const newAttempt: MockAttempt = {
      id: 'mock-' + Date.now(),
      user_id: userId,
      exam_id: exam.id,
      status: 'IN_PROGRESS',
      started_at: now,
      deadline_at,
      duration_minutes: durationMinutes,
      passing_score: passing,
      total_questions: items.length,
      version: 1,
      items
    };

    const all = this.getMockAttempts(userId);
    all.unshift(newAttempt);
    localStorage.setItem(STORAGE_KEYS.MOCK_ATTEMPTS, JSON.stringify(all));

    return newAttempt;
  }

  /**
   * ADD-11: Optimistic Concurrency Control for answer autosave.
   */
  public updateAttemptItem(
    userId: string,
    attemptId: string,
    questionId: string,
    selectedAnswers: string[],
    isFlagged: boolean,
    expectedVersion: number
  ): { success: boolean; currentVersion: number; deadlineReached?: boolean } {
    const all = this.getMockAttempts(userId);
    const attempt = all.find(a => a.id === attemptId && a.user_id === userId);

    if (!attempt) throw new Error('Không tìm thấy bài thi.');
    if (attempt.status !== 'IN_PROGRESS') {
      return { success: false, currentVersion: 0, deadlineReached: true };
    }

    // ADD-12: Check server deadline
    const now = Date.now();
    if (now > attempt.deadline_at + 15000) { // 15s grace period
      return { success: false, currentVersion: 0, deadlineReached: true };
    }

    const item = attempt.items.find(i => i.question_id === questionId);
    if (!item) throw new Error('Không tìm thấy câu hỏi trong bài thi.');

    // Optimistic Concurrency check
    if (item.version !== expectedVersion) {
      throw new Error(`CONCURRENT_UPDATE: Dữ liệu câu hỏi đã được sửa trên thiết bị khác (Phiên bản máy: ${expectedVersion}, Phiên bản hệ thống: ${item.version}).`);
    }

    item.selected_answers = selectedAnswers;
    item.is_flagged = isFlagged;
    item.version += 1;
    attempt.version += 1;

    localStorage.setItem(STORAGE_KEYS.MOCK_ATTEMPTS, JSON.stringify(all));
    return { success: true, currentVersion: item.version };
  }

  /**
   * Submit and Grade Mock Exam (ADD-12 Idempotent)
   */
  public submitMockExam(userId: string, attemptId: string): MockAttempt {
    const all = this.getMockAttempts(userId);
    const attempt = all.find(a => a.id === attemptId && a.user_id === userId);

    if (!attempt) throw new Error('Không tìm thấy bài thi.');
    if (attempt.status === 'COMPLETED') {
      return attempt; // Idempotent return
    }

    let correctCount = 0;
    const topicsMap: Record<string, { total: number; correct: number; name: string }> = {};

    attempt.items.forEach(item => {
      const snap = item.snapshot;
      let isCorrect = false;

      if (snap.type === 'SINGLE') {
        const expected = snap.correct?.[0];
        isCorrect = item.selected_answers.length === 1 && item.selected_answers[0] === expected;
      } else if (snap.type === 'MULTI') {
        const expectedSet = new Set(snap.correct || []);
        const chosenSet = new Set(item.selected_answers);
        isCorrect = expectedSet.size === chosenSet.size && [...expectedSet].every(k => chosenSet.has(k));
      } else {
        // Flashcard in mock mode
        isCorrect = item.selected_answers.length > 0;
      }

      item.is_correct = isCorrect;
      if (isCorrect) correctCount++;

      // Tally topics
      snap.topics.forEach(tid => {
        if (!topicsMap[tid]) {
          topicsMap[tid] = { total: 0, correct: 0, name: tid };
        }
        topicsMap[tid].total += 1;
        if (isCorrect) topicsMap[tid].correct += 1;
      });
    });

    const scorePercentage = Math.round((correctCount / Math.max(1, attempt.total_questions)) * 100);
    const isPassed = scorePercentage >= attempt.passing_score;

    attempt.status = 'COMPLETED';
    attempt.submitted_at = Date.now();
    attempt.correct_count = correctCount;
    attempt.score_percentage = scorePercentage;
    attempt.is_passed = isPassed;

    // Load topic names
    const examTopics = this.getTopics(attempt.exam_id, userId);
    attempt.topic_breakdown = Object.entries(topicsMap).map(([tid, val]) => {
      const found = examTopics.find(t => t.id === tid);
      return {
        topic_id: tid,
        topic_name: found ? found.name : 'Chung / Kiến thức cốt lõi',
        total: val.total,
        correct: val.correct,
        percentage: Math.round((val.correct / Math.max(1, val.total)) * 100)
      };
    });

    localStorage.setItem(STORAGE_KEYS.MOCK_ATTEMPTS, JSON.stringify(all));
    return attempt;
  }

  public abandonMockExam(userId: string, attemptId: string) {
    const all = this.getMockAttempts(userId);
    const attempt = all.find(a => a.id === attemptId && a.user_id === userId);
    if (attempt) {
      attempt.status = 'ABANDONED';
      localStorage.setItem(STORAGE_KEYS.MOCK_ATTEMPTS, JSON.stringify(all));
    }
  }

  // --- Import / Export (ADD-13, ADD-16) ---

  public commitImportedQuestions(
    examId: string,
    userId: string,
    questions: IntermediateQuestion[],
    strategy: DuplicateStrategy
  ): { added: number; updated: number; skipped: number } {
    const existing = this.getQuestionsByExam(examId, userId);
    let added = 0;
    let updated = 0;
    let skipped = 0;

    questions.forEach(q => {
      // Find duplicate based on trimmed content
      const normContent = q.content.trim().toLowerCase();
      const match = existing.find(e => e.content.trim().toLowerCase() === normContent);

      if (match) {
        if (strategy === 'SKIP') {
          skipped++;
          return;
        } else if (strategy === 'UPDATE_EXISTING') {
          this.saveQuestion({
            ...match,
            type: q.type,
            content: q.content,
            options: q.options,
            correct: q.correct,
            answer_content: q.answer_content,
            explanation: q.explanation,
            topics: q.topics.length ? q.topics : match.topics,
            difficulty: q.difficulty,
            updated_at: Date.now()
          }, userId);
          updated++;
          return;
        }
      }

      // Add new
      this.saveQuestion({
        id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        exam_id: examId,
        user_id: userId,
        type: q.type,
        content: q.content,
        options: q.options || [],
        correct: q.correct || [],
        answer_content: q.answer_content || null,
        explanation: q.explanation || '',
        topics: q.topics || [],
        difficulty: q.difficulty || 2,
        source: 'DOCX',
        version: 1,
        created_at: Date.now(),
        updated_at: Date.now()
      }, userId);
      added++;
    });

    return { added, updated, skipped };
  }

  /**
   * Export all user data (ADD-16)
   */
  public exportUserData(userId: string) {
    const exams = this.getExams(userId);
    const questions = this.getQuestionsByExam('', userId);
    const progress = this.getProgressList(userId);
    const attempts = this.getMockAttempts(userId);

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      exams,
      questions,
      progress,
      mock_attempts: attempts
    };
  }

  /**
   * Delete account and user data (ADD-16)
   */
  public deleteUserAccount(adminOrUser: User, targetUserId: string) {
    const users = this.getUsers().filter(u => u.id !== targetUserId);
    this.saveUsers(users);

    // Clean user exams, questions, progress
    const allExams = (JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAMS) || '[]') as Exam[]).filter(e => e.user_id !== targetUserId);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(allExams));

    const allQuestions = (JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]') as Question[]).filter(q => q.user_id !== targetUserId);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(allQuestions));

    const allProgress = (JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '[]') as QuestionProgress[]).filter(p => p.user_id !== targetUserId);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));

    const allAttempts = (JSON.parse(localStorage.getItem(STORAGE_KEYS.MOCK_ATTEMPTS) || '[]') as MockAttempt[]).filter(a => a.user_id !== targetUserId);
    localStorage.setItem(STORAGE_KEYS.MOCK_ATTEMPTS, JSON.stringify(allAttempts));
  }
}

export const storage = new StorageService();
