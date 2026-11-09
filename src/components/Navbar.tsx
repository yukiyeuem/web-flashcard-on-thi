import React from 'react';
import { 
  Sparkles, 
  Layers, 
  BrainCircuit, 
  GraduationCap, 
  ShieldCheck, 
  User as UserIcon, 
  ChevronDown, 
  Clock, 
  Settings,
  Flame,
  CheckCircle2,
  Crown,
  BookOpen
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

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown-container') && !target.closest('.exam-dropdown-container')) {
        setShowUserDropdown(false);
        setShowExamDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0b1329] border-b border-slate-700/80 shadow-2xl shadow-black/50">
      {/* Top Colorful Accent Line */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 w-full" />

      {/* Active Mock Attempt High-Contrast Banner (ADD-10) */}
      {activeMockAttempt && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-4 py-2 font-bold text-xs sm:text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 animate-spin text-slate-950" />
            <span>
              <strong>Đang có bài thi dở dang:</strong> {activeMockAttempt.total_questions} câu hỏi • Thời hạn tính giờ theo máy chủ
            </span>
          </div>
          <button
            onClick={onResumeMock}
            className="px-3.5 py-1 bg-slate-950 hover:bg-slate-900 text-white font-extrabold rounded-lg text-xs transition shadow-sm"
          >
            Tiếp tục làm bài ngay →
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          
          {/* LEFT: Logo & Exam Switcher */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            {/* Brand Logo */}
            <div 
              onClick={() => onChangeTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform border border-blue-400/40">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">
                    CertFlash
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider bg-blue-500 text-white uppercase shadow-sm">
                    v1.1 BA
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-300 hidden sm:block">
                  Web Flashcard & Thi Thử Chứng Chỉ
                </p>
              </div>
            </div>

            {/* High-Visibility Exam Selector */}
            {exams.length > 0 && (
              <div className="relative exam-dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExamDropdown(!showExamDropdown);
                    setShowUserDropdown(false);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border-2 border-slate-600 hover:border-blue-400 text-xs sm:text-sm font-bold text-white transition shadow-sm"
                >
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/30" 
                    style={{ backgroundColor: activeExam?.color || '#3b82f6' }} 
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                      Chứng chỉ đang chọn
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[130px] sm:max-w-[200px]">
                      {activeExam?.code || 'Chọn chứng chỉ'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-300 shrink-0 ml-1" />
                </button>

                {showExamDropdown && (
                  <div className="absolute left-0 mt-2 w-80 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800">
                      Chọn Bộ Đề Ôn Thi
                    </div>
                    <div className="space-y-1 mt-1.5">
                      {exams.map(e => (
                        <button
                          key={e.id}
                          onClick={() => {
                            onSelectExam(e);
                            setShowExamDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                            activeExam?.id === e.id
                              ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                            <div>
                              <div className="font-extrabold text-sm text-white">{e.code}</div>
                              <div className="text-[11px] opacity-80 truncate max-w-[190px]">{e.title}</div>
                            </div>
                          </div>
                          {activeExam?.id === e.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTER: High-Contrast Elevated Navigation Segment Dock */}
          <nav className="hidden lg:flex items-center bg-slate-900/95 p-1.5 rounded-2xl border-2 border-slate-700/80 shadow-inner gap-1">
            {/* Tab: Dashboard */}
            <button
              onClick={() => onChangeTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-blue-400 group-hover:text-white" />
              <span>Tổng quan</span>
            </button>

            {/* Tab: Học liệu */}
            <button
              onClick={() => onChangeTab('questions')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-cyan-400 group-hover:text-white" />
              <span>Học liệu & Thẻ</span>
            </button>

            {/* Tab: Ôn tập SM-2 */}
            <button
              onClick={() => onChangeTab('study')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'study'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-300/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className={`w-4 h-4 ${activeTab === 'study' ? 'text-slate-950 fill-slate-950' : 'text-amber-400'}`} />
              <span>Ôn tập SM-2</span>
            </button>

            {/* Tab: Thi thử */}
            <button
              onClick={() => onChangeTab('mock')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeTab === 'mock'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 border border-emerald-300/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeTab === 'mock' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Thi thử Mock</span>
            </button>

            {/* Tab: Admin (Only visible for Admin) */}
            {currentUser.role === 'ADMIN' && (
              <button
                onClick={() => onChangeTab('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/40 border border-purple-500/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:text-white" />
                <span>Quản trị Admin</span>
              </button>
            )}
          </nav>

          {/* RIGHT: User Profile Capsule */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative user-dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserDropdown(!showUserDropdown);
                  setShowExamDropdown(false);
                }}
                className={`flex items-center gap-3 p-1.5 pl-3 rounded-2xl border-2 transition shadow-md ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/60 text-white'
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-600 text-white'
                }`}
              >
                <div className="flex flex-col text-right hidden md:block">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                      {currentUser.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 max-w-[180px] truncate block">
                    {currentUser.email}
                  </span>
                </div>

                {/* Avatar with Role Crown / Shield */}
                <div className="relative">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                    currentUser.role === 'ADMIN'
                      ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-400'
                      : 'bg-gradient-to-tr from-blue-600 to-cyan-500 ring-2 ring-blue-400'
                  }`}>
                    {currentUser.name.charAt(0)}
                  </div>
                  {currentUser.role === 'ADMIN' && (
                    <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow">
                      <Crown className="w-3 h-3 fill-slate-950" />
                    </div>
                  )}
                </div>

                <ChevronDown className="w-4 h-4 text-slate-300 mr-1" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-84 bg-slate-900 rounded-3xl border-2 border-slate-700 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="pb-3 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-extrabold text-white">{currentUser.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-purple-500 text-white shadow-sm'
                          : 'bg-blue-600 text-white shadow-sm'
                      }`}>
                        {currentUser.role === 'ADMIN' ? '🛡️ LEAD ADMIN' : 'HỌC VIÊN'}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-300 mt-1 break-all bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                      {currentUser.email}
                    </p>
                  </div>

                  {/* Switch Demo Accounts */}
                  <div className="py-3 border-b border-slate-800">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Chuyển đổi tài khoản (Testing Switcher)
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {allUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                            currentUser.id === u.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold">{u.name}</div>
                            <div className="text-[10px] opacity-80 truncate">{u.email} ({u.role})</div>
                          </div>
                          {currentUser.id === u.id && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="pt-3 space-y-1.5">
                    <button
                      onClick={() => {
                        onOpenAccountSettings();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                    >
                      <Settings className="w-4 h-4 text-blue-400" />
                      <span>Cài đặt & Xuất dữ liệu cá nhân (ADD-16)</span>
                    </button>
                    <button
                      onClick={() => {
                        onOpenAuth();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-950/30 flex items-center gap-2.5 transition"
                    >
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      <span>Đăng nhập OTP / Tạo tài khoản mới</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile High-Visibility Navigation Bar */}
      <div className="lg:hidden grid grid-cols-5 border-t-2 border-slate-700 bg-slate-900 px-2 py-2.5">
        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition ${
            activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => onChangeTab('questions')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition ${
            activeTab === 'questions' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          <BrainCircuit className="w-5 h-5" />
          <span>Học liệu</span>
        </button>

        <button
          onClick={() => onChangeTab('study')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition ${
            activeTab === 'study' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span>Ôn tập</span>
        </button>

        <button
          onClick={() => onChangeTab('mock')}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition ${
            activeTab === 'mock' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span>Thi thử</span>
        </button>

        {currentUser.role === 'ADMIN' ? (
          <button
            onClick={() => onChangeTab('admin')}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold transition ${
              activeTab === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'text-purple-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin</span>
          </button>
        ) : (
          <button
            onClick={() => onOpenAccountSettings()}
            className="flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[11px] font-extrabold text-slate-300 hover:text-white"
          >
            <Settings className="w-5 h-5" />
            <span>Cài đặt</span>
          </button>
        )}
      </div>
    </header>
  );
};
