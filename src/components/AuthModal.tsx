import React, { useState } from 'react';
import { X, Mail, Shield, CheckCircle2, AlertCircle, ArrowRight, KeyRound, RefreshCw, Sparkles } from 'lucide-react';
import { storage } from '../utils/storage';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'VERIFY_REGISTER_OTP' | 'VERIFY_LOGIN_OTP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !name) {
      setError('Vui lòng nhập họ tên và địa chỉ Gmail.');
      return;
    }

    try {
      setLoading(true);
      const res = storage.registerUser(name, email);
      setSimulatedCode(res.otpCode);
      setMode('VERIFY_REGISTER_OTP');
      setInfo(`Hệ thống đã gửi mã OTP xác minh email đến ${email}. (Mã mô phỏng: ${res.otpCode})`);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegisterOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    try {
      setLoading(true);
      const user = storage.completeEmailVerification(email, otpCode);
      setInfo('Xác minh Gmail thành công! Tài khoản của bạn hiện ở trạng thái CHỜ DUYỆT (PENDING). Quản trị viên sẽ phê duyệt trước khi bạn có thể đăng nhập.');
      // Keep on screen for 3 seconds or allow close
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Mã xác minh không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const normEmail = email.trim().toLowerCase();
    const users = storage.getUsers();
    const user = users.find(u => u.email.toLowerCase() === normEmail);

    if (!user) {
      setError('Email này chưa được đăng ký trong hệ thống. Vui lòng chuyển sang tab Đăng ký.');
      return;
    }

    if (user.status === 'PENDING_VERIFICATION') {
      setError('Tài khoản chưa hoàn tất xác minh email. Vui lòng đăng ký lại để nhận mã xác minh.');
      return;
    }

    if (user.status === 'PENDING') {
      setError('Tài khoản đã xác minh email nhưng đang CHỜ ADMIN DUYỆT. Vui lòng liên hệ quản trị viên.');
      return;
    }

    if (user.status === 'REJECTED') {
      setError('Yêu cầu tài khoản của bạn đã bị Quản trị viên từ chối.');
      return;
    }

    if (user.status === 'BLOCKED') {
      setError('Tài khoản của bạn đang bị khóa vì vi phạm chính sách bảo mật.');
      return;
    }

    try {
      setLoading(true);
      const { code } = storage.requestOtp(normEmail, 'LOGIN');
      setSimulatedCode(code);
      setMode('VERIFY_LOGIN_OTP');
      setInfo(`Mã OTP đăng nhập đã được gửi đến ${email}. (Mã mô phỏng: ${code})`);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi mã đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    try {
      setLoading(true);
      storage.verifyOtp(email, otpCode, 'LOGIN');
      const users = storage.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())!;
      user.last_login_at = Date.now();
      storage.setCurrentUser(user);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Mã OTP đăng nhập không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switchers if on initial step */}
        {(mode === 'LOGIN' || mode === 'REGISTER') && (
          <div className="flex border-b border-slate-800 pb-3 mb-6 gap-4">
            <button
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setInfo(null);
              }}
              className={`pb-2 text-sm font-bold transition border-b-2 ${
                mode === 'LOGIN'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng nhập OTP (ADD-01)
            </button>
            <button
              onClick={() => {
                setMode('REGISTER');
                setError(null);
                setInfo(null);
              }}
              className={`pb-2 text-sm font-bold transition border-b-2 ${
                mode === 'REGISTER'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>
        )}

        {/* Header Title */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'LOGIN' && 'Đăng nhập với Gmail OTP'}
            {mode === 'REGISTER' && 'Tạo tài khoản học viên mới'}
            {mode === 'VERIFY_REGISTER_OTP' && 'Xác minh quyền sở hữu Gmail (BR-20)'}
            {mode === 'VERIFY_LOGIN_OTP' && 'Nhập mã OTP đăng nhập'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' && 'Hệ thống gửi mã OTP bảo mật trực tiếp đến email, không dùng mật khẩu tĩnh.'}
            {mode === 'REGISTER' && 'Quy trình chuẩn BA v1.1: Xác minh Gmail trước khi gửi hồ sơ lên Admin duyệt.'}
            {mode === 'VERIFY_REGISTER_OTP' && 'Vui lòng nhập mã 6 số đã gửi đến hòm thư để chứng minh bạn sở hữu email.'}
            {mode === 'VERIFY_LOGIN_OTP' && 'Mã OTP chỉ có hiệu lực trong 10 phút và dùng 1 lần duy nhất.'}
          </p>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>{info}</div>
          </div>
        )}

        {/* Form: LOGIN STEP 1 */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa chỉ Gmail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="vidu@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Nhận mã OTP đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: REGISTER STEP 1 */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Địa chỉ Gmail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="vidu@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Gửi mã xác minh Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: VERIFY REGISTER OTP (ADD-01) */}
        {mode === 'VERIFY_REGISTER_OTP' && (
          <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mã xác minh Email (6 chữ số)
                </label>
                {simulatedCode && (
                  <button
                    type="button"
                    onClick={() => setOtpCode(simulatedCode)}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Tự điền mã: {simulatedCode}
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
            >
              <span>Xác nhận Gmail & Gửi chờ Admin duyệt</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: VERIFY LOGIN OTP (BR-21) */}
        {mode === 'VERIFY_LOGIN_OTP' && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mã OTP đăng nhập (6 chữ số)
                </label>
                {simulatedCode && (
                  <button
                    type="button"
                    onClick={() => setOtpCode(simulatedCode)}
                    className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Tự điền mã: {simulatedCode}
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-lg font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <span>Xác thực & Vào ứng dụng</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
