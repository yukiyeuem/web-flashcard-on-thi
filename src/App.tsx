/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { QuestionManager } from './components/QuestionManager';
import { StudySessionView } from './components/StudySessionView';
import { MockExamRunner } from './components/MockExamRunner';
import { MockExamResult } from './components/MockExamResult';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ImportModal } from './components/ImportModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { Exam, MockAttempt, Question, Topic, User } from './types';
import { storage } from './utils/storage';
import { KeyRound, Sparkles, ShieldCheck, BookOpen, Clock, BrainCircuit, Upload, FileText } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => storage.getUsers());
  const [exams, setExams] = useState<Exam[]>(() => currentUser ? storage.getExams(currentUser.id) : []);
  const [activeExam, setActiveExam] = useState<Exam | null>(() => exams[0] || null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'study' | 'mock' | 'admin'>('dashboard');
  const [activeMockAttempt, setActiveMockAttempt] = useState<MockAttempt | null>(null);
  const [viewingResultAttempt, setViewingResultAttempt] = useState<MockAttempt | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);

  // Reload data when active user or active exam changes
  const reloadData = () => {
    const updatedUser = storage.getCurrentUser();
    setCurrentUser(updatedUser);
    setAllUsers(storage.getUsers());

    if (updatedUser) {
      const userExams = storage.getExams(updatedUser.id);
      setExams(userExams);

      const currentSelectedExam = activeExam 
        ? (userExams.find(e => e.id === activeExam.id) || userExams[0] || null)
        : (userExams[0] || null);

      setActiveExam(currentSelectedExam);

      if (currentSelectedExam) {
        setTopics(storage.getTopics(currentSelectedExam.id, updatedUser.id));
        setQuestions(storage.getQuestionsByExam(currentSelectedExam.id, updatedUser.id));
      } else {
        setTopics([]);
        setQuestions([]);
      }

      // Check active mock attempt (ADD-10)
      const runningAttempt = storage.getActiveMockAttempt(updatedUser.id);
      setActiveMockAttempt(runningAttempt);
    } else {
      setExams([]);
      setActiveExam(null);
      setTopics([]);
      setQuestions([]);
      setActiveMockAttempt(null);
    }
  };

  useEffect(() => {
    reloadData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeExam && currentUser) {
      setTopics(storage.getTopics(activeExam.id, currentUser.id));
      setQuestions(storage.getQuestionsByExam(activeExam.id, currentUser.id));
    }
  }, [activeExam?.id]);

  // Switch demo user
  const handleSwitchUser = (newUser: User) => {
    storage.setCurrentUser(newUser);
    setCurrentUser(newUser);
  };

  // Logout handler (BR-21)
  const handleLogout = () => {
    storage.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setActiveMockAttempt(null);
    setViewingResultAttempt(null);
  };

  // Finish mock attempt handler
  const handleFinishMockAttempt = (attempt: MockAttempt) => {
    setActiveMockAttempt(null);
    setViewingResultAttempt(attempt);
    reloadData();
  };

  // Retake mock exam
  const handleRetakeMock = () => {
    setViewingResultAttempt(null);
    setActiveTab('mock');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Universal Navbar */}
      <Navbar
        currentUser={currentUser}
        activeExam={activeExam}
        exams={exams}
        onSelectExam={(exam) => {
          setActiveExam(exam);
          setViewingResultAttempt(null);
        }}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (!currentUser && tab !== 'dashboard') {
            setIsAuthModalOpen(true);
            return;
          }
          setActiveTab(tab);
          setViewingResultAttempt(null);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        allUsers={allUsers}
        activeMockAttempt={activeMockAttempt}
        onResumeMock={() => {
          setActiveTab('mock');
          setViewingResultAttempt(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!currentUser ? (
          /* GUEST / LANDING VIEW REQUIRING LOGIN */
          <div className="py-10 sm:py-16 text-center max-w-3xl mx-auto space-y-8 animate-in fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>CertFlash • Nền tảng Ôn Thi Flashcard & Thi Thử Chứng Chỉ</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Hệ Thống Ôn Thi Chứng Chỉ <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Khoa Học & Tự Động Hóa
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Vui lòng đăng nhập bằng địa chỉ Gmail của bạn để nhận mã OTP xác thực an toàn. Bạn có thể tự nạp đề thi dạng <strong>Word (.docx)</strong> hoặc <strong>PDF (.pdf)</strong>, ôn luyện thuật toán SM-2 và thi thử bấm giờ.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition hover:scale-102 cursor-pointer"
              >
                <KeyRound className="w-5 h-5 text-blue-200" />
                <span>Đăng nhập ngay bằng Email OTP</span>
              </button>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                  📄
                </div>
                <div className="font-extrabold text-white text-sm">Upload Đề Word & PDF</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bóc tách tự động câu hỏi, các phương án A, B, C, D, E, F và đáp án kể cả các đề dump hàng trăm câu.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg">
                  🧠
                </div>
                <div className="font-extrabold text-white text-sm">Thuật Toán SM-2</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Lặp ngắt quãng khoa học ghi nhớ dài hạn, tự động ưu tiên các câu hỏi hay trả lời sai hoặc đến hạn ôn.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                  ⏱️
                </div>
                <div className="font-extrabold text-white text-sm">Thi Thử Bấm Giờ Tự Điền</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tùy ý nhập tổng số câu hỏi, điểm đạt và thời gian đếm ngược mô phỏng chuẩn phòng thi thực tế.
                </p>
              </div>
            </div>
          </div>
        ) : activeExam ? (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                activeExam={activeExam}
                topics={topics}
                questions={questions}
                onStartStudy={(mode) => {
                  setActiveTab('study');
                }}
                onStartMock={() => {
                  setViewingResultAttempt(null);
                  setActiveTab('mock');
                }}
                onGoToQuestions={() => setActiveTab('questions')}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionManager
                currentUser={currentUser}
                activeExam={activeExam}
                topics={topics}
                questions={questions}
                onRefreshData={reloadData}
                onOpenImport={() => setIsImportModalOpen(true)}
              />
            )}

            {activeTab === 'study' && (
              <StudySessionView
                currentUser={currentUser}
                activeExam={activeExam}
                topics={topics}
                questions={questions}
                onFinishSession={reloadData}
              />
            )}

            {activeTab === 'mock' && (
              viewingResultAttempt ? (
                <MockExamResult
                  attempt={viewingResultAttempt}
                  activeExam={activeExam}
                  onRetake={handleRetakeMock}
                  onBackToDashboard={() => setActiveTab('dashboard')}
                />
              ) : (
                <MockExamRunner
                  currentUser={currentUser}
                  activeExam={activeExam}
                  questions={questions}
                  onFinishAttempt={handleFinishMockAttempt}
                  onCancelAttempt={() => {
                    setActiveMockAttempt(null);
                    reloadData();
                  }}
                />
              )
            )}

            {activeTab === 'admin' && currentUser.role === 'ADMIN' && (
              <AdminPanel
                currentUser={currentUser}
                onRefreshData={reloadData}
              />
            )}
          </>
        ) : (
          <div className="text-center py-24 bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-white">Chưa có chứng chỉ nào trong hệ thống</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Bạn có thể tạo một chứng chỉ mới (ví dụ: Oracle 1Z0-083) hoặc nạp câu hỏi từ tệp Word (.docx) / PDF (.pdf).
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CertFlash</strong> • Nền tảng ôn thi chứng chỉ bằng Flashcard & SM-2 Spaced Repetition (BA v1.1)
          </div>
          <div className="text-[11px] text-slate-600">
            Hỗ trợ Oracle, AWS, Azure, Scrum, PMP • Bảo mật dữ liệu người dùng
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          reloadData();
        }}
      />

      {currentUser && (
        <AccountSettingsModal
          isOpen={isAccountSettingsOpen}
          onClose={() => setIsAccountSettingsOpen(false)}
          currentUser={currentUser}
          onUserDeleted={handleLogout}
        />
      )}

      {currentUser && activeExam && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          activeExam={activeExam}
          topics={topics}
          currentUser={currentUser}
          onSuccess={reloadData}
        />
      )}
    </div>
  );
}
