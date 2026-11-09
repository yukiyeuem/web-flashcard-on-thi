import React from 'react';
import { 
  Sparkles, 
  Layers, 
  BrainCircuit, 
  GraduationCap, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronDown, 
  LogOut, 
  Clock, 
  Download, 
  Settings,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Exam, MockAttempt, User } from '../types';

interface NavbarProps {
  currentUser: User;
  activeExam: Exam | null;
  exams: Exam[];
  onSelectExam: (exam: Exam) => void;
  activeTab: 'dashboard' | 'questions' | 'study' | 'mock' | 'admin';
  onChangeTab: (tab: 'dashboard' | 'questions' | 'study' | 'mock' | 'admin') => void;
  onOpenAuth: () => void;
  onOpenAccountSettings: () => void;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  activeMockAttempt: MockAttempt | null;
  onResumeMock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeExam,
  exams,
  onSelectExam,
  activeTab,
  onChangeTab,
  onOpenAuth,
  onOpenAccountSettings,
  onSwitchUser,
  allUsers,
  activeMockAttempt,
  onResumeMock
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [showExamDropdown, setShowExamDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Active Mock Attempt Banner (ADD-10) */}
      {activeMockAttempt && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-amber-400" />
            <span className="font-semibold">Đang có bài thi thử chưa nộp:</span>
            <span>{activeMockAttempt.total_questions} câu • Thời hạn đếm ngược theo máy chủ</span>
          </div>
          <button
            onClick={onResumeMock}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition shadow-sm"
          >
            Tiếp tục làm bài
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => onChangeTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    CertFlash
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    v1.1 BA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Flashcard & Mock Exam Chứng Chỉ
                </p>
              </div>
            </div>

            {/* Exam Selector Pill */}
            {exams.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowExamDropdown(!showExamDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeExam?.color || '#3b82f6' }} />
                  <span className="font-semibold text-slate-100 max-w-[140px] truncate sm:max-w-none">
                    {activeExam?.code || 'Chọn chứng chỉ'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showExamDropdown && (
                  <div className="absolute left-0 mt-2 w-72 bg-slate-850 rounded-xl border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Bộ đề thi & Chứng chỉ
                    </div>
                    {exams.map(e => (
                      <button
                        key={e.id}
                        onClick={() => {
                          onSelectExam(e);
                          setShowExamDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                          activeExam?.id === e.id
                            ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                          <div>
                            <div className="font-bold text-slate-200">{e.code}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[190px]">{e.title}</div>
                          </div>
                        </div>
                        {activeExam?.id === e.id && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Tổng quan
            </button>

            <button
              onClick={() => onChangeTab('questions')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'questions'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              Học liệu & Flashcard
            </button>

            <button
              onClick={() => onChangeTab('study')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'study'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              Ôn tập SM-2
            </button>

            <button
              onClick={() => onChangeTab('mock')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeTab === 'mock'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              Thi thử (Mock Exam)
            </button>

            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                  activeTab === 'admin'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Quản trị Admin
              </button>
            )}
          </nav>

          {/* User Menu & Role Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition"
              >
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {currentUser.role === 'ADMIN' ? '🛡️ Quản trị viên' : '📖 Học viên'}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                }`}>
                  {currentUser.name.charAt(0)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-850 rounded-2xl border border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-100">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {currentUser.role}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {currentUser.status}
                      </span>
                    </div>
                  </div>

                  {/* Switch Demo Accounts (For testing convenience) */}
                  <div className="py-2 border-b border-slate-800">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Chuyển tài khoản thử nghiệm
                    </div>
                    {allUsers.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                          currentUser.id === u.id ? 'bg-slate-800 text-blue-400 font-medium' : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{u.email} ({u.role})</span>
                        </div>
                        {currentUser.id === u.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Account Actions */}
                  <div className="pt-2 space-y-1">
                    <button
                      onClick={() => {
                        onOpenAccountSettings();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Cài đặt & Xuất dữ liệu (ADD-16)
                    </button>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-blue-400 hover:bg-blue-600/10 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-blue-400" />
                      Đăng ký / Đăng nhập OTP (ADD-01)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 px-2 py-2 bg-slate-900">
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded ${
            activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tổng quan
        </button>
        <button
          onClick={() => onChangeTab('questions')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded ${
            activeTab === 'questions' ? 'text-blue-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Học liệu
        </button>
        <button
          onClick={() => onChangeTab('study')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded ${
            activeTab === 'study' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Flame className="w-4 h-4" />
          Ôn tập
        </button>
        <button
          onClick={() => onChangeTab('mock')}
          className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded ${
            activeTab === 'mock' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Thi thử
        </button>
        {currentUser.role === 'ADMIN' && (
          <button
            onClick={() => onChangeTab('admin')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold py-1 px-2 rounded ${
              activeTab === 'admin' ? 'text-purple-400 font-bold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
