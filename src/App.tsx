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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => storage.getUsers());
  const [exams, setExams] = useState<Exam[]>(() => storage.getExams(currentUser.id));
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
  };

  useEffect(() => {
    reloadData();
  }, [currentUser.id]);

  useEffect(() => {
    if (activeExam) {
      setTopics(storage.getTopics(activeExam.id, currentUser.id));
      setQuestions(storage.getQuestionsByExam(activeExam.id, currentUser.id));
    }
  }, [activeExam?.id]);

  // Switch demo user
  const handleSwitchUser = (newUser: User) => {
    storage.setCurrentUser(newUser);
    setCurrentUser(newUser);
    setViewingResultAttempt(null);
    reloadData();
  };

  // Mock exam completion
  const handleFinishMockAttempt = (attempt: MockAttempt) => {
    setActiveMockAttempt(null);
    setViewingResultAttempt(attempt);
    setActiveTab('mock');
    reloadData();
  };

  const handleRetakeMock = () => {
    setViewingResultAttempt(null);
    setActiveTab('mock');
    reloadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentUser={currentUser}
        activeExam={activeExam}
        exams={exams}
        onSelectExam={(e) => {
          setActiveExam(e);
          setViewingResultAttempt(null);
        }}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'mock') {
            setViewingResultAttempt(null);
          }
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        activeMockAttempt={activeMockAttempt}
        onResumeMock={() => {
          setActiveTab('mock');
          setViewingResultAttempt(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeExam ? (
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

            {activeTab === 'admin' && (
              <AdminPanel
                currentUser={currentUser}
                onRefreshData={reloadData}
              />
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <h2 className="text-lg font-bold">Chưa có chứng chỉ nào được chọn</h2>
            <p className="text-xs text-slate-400 mt-1">Vui lòng chọn hoặc thêm chứng chỉ ở thanh điều hướng.</p>
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
            Hỗ trợ AWS, Azure, Scrum, PMP, CPA • Bảo mật dữ liệu người dùng
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          handleSwitchUser(user);
        }}
      />

      {activeExam && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          activeExam={activeExam}
          topics={topics}
          currentUser={currentUser}
          onSuccess={reloadData}
        />
      )}

      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        currentUser={currentUser}
        onUserDeleted={() => {
          const firstUser = storage.getUsers()[0] || null;
          if (firstUser) {
            handleSwitchUser(firstUser);
          }
          setIsAccountSettingsOpen(false);
        }}
      />
    </div>
  );
}
