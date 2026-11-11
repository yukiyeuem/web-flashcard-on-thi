import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, ArrowRight, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';
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
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset modal state every time it opens to prevent expired state ghosting after logout
  useEffect(() => {
    if (isOpen) {
      setMode('LOGIN');
      setOtpCode('');
      setError(null);
      setInfo(null);
      setIsEmailSent(false);
      setErrorDetail(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !name) {
      setError('Vui lòng nhập họ tên và địa chỉ Gmail.');
      return;
    }

    try {
      setLoading(true);
      storage.registerUser(name, email);
      const res = await storage.requestOtpWithResend(email, 'VERIFY_EMAIL');
      setMode('VERIFY_REGISTER_OTP');
      setOtpCode('');
      if (res.emailSent) {
        setIsEmailSent(true);
        setInfo(`✓ Mã xác minh 6 số đã được gửi đến ${email} qua Resend! Vui lòng kiểm tra Inbox hoặc Spam.`);
      } else {
        setIsEmailSent(false);
        setErrorDetail(res.errorDetail || res.message);
        setError('Chưa gửi được mail qua Resend. Vui lòng kiểm tra biến môi trường RESEND_API_KEY trên Cloudflare.');
      }
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
      storage.completeEmailVerification(email, otpCode);
      setInfo('✓ Xác minh Gmail thành công! Tài khoản của bạn hiện ở trạng thái CHỜ DUYỆT (PENDING). Quản trị viên sẽ phê duyệt trước khi bạn có thể đăng nhập.');
      setTimeout(() => {
        onClose();
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Mã xác minh không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRequestOtp = async (e: React.FormEvent) => {
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
      const res = await storage.requestOtpWithResend(normEmail, 'LOGIN');
      setOtpCode('');
      if (res.emailSent) {
        setIsEmailSent(true);
        setErrorDetail(null);
        setInfo(`✓ Mã OTP 6 số đã được gửi trực tiếp vào hộp thư Gmail: ${email}. Vui lòng mở Gmail để kiểm tra.`);
      } else {
        setIsEmailSent(false);
        setErrorDetail(res.errorDetail || res.message);
        setError('Chưa gửi được mail qua Resend. Vui lòng kiểm tra biến môi trường RESEND_API_KEY trên Cloudflare.');
      }
      setMode('VERIFY_LOGIN_OTP');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi mã đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendNewOtp = async () => {
    setError(null);
    setInfo(null);
    setOtpCode('');
    setLoading(true);
    const normEmail = email.trim().toLowerCase();

    try {
      const purpose = mode === 'VERIFY_REGISTER_OTP' ? 'VERIFY_EMAIL' : 'LOGIN';
      const res = await storage.requestOtpWithResend(normEmail, purpose);
      if (res.emailSent) {
        setIsEmailSent(true);
        setErrorDetail(null);
        setInfo(`✓ Đã cấp mã OTP mới và gửi thành công đến ${email}! Vui lòng kiểm tra Gmail (Inbox & Spam).`);
      } else {
        setIsEmailSent(false);
        setErrorDetail(res.errorDetail || res.message);
        setError('Chưa gửi được mã OTP qua Resend. Vui lòng kiểm tra biến môi trường RESEND_API_KEY trên Cloudflare.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi gửi lại mã OTP.');
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
      // Strictly verify code received via email
      storage.verifyOtp(email, otpCode, 'LOGIN');

      // Sync consume on backend if Worker/D1 is active
      fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: otpCode.trim(), purpose: 'LOGIN' })
      }).catch(() => {});

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
              Đăng nhập OTP (Bảo mật)
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
            {mode === 'VERIFY_REGISTER_OTP' && 'Xác minh quyền sở hữu Gmail'}
            {mode === 'VERIFY_LOGIN_OTP' && 'Nhập mã OTP từ Gmail'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' && 'Hệ thống gửi mã OTP bảo mật trực tiếp đến hòm thư Gmail của bạn, không dùng mật khẩu tĩnh.'}
            {mode === 'REGISTER' && 'Quy trình chuẩn BA v1.1: Xác minh Gmail trước khi gửi hồ sơ lên Admin duyệt.'}
            {mode === 'VERIFY_REGISTER_OTP' && 'Mã xác thực đã được gửi đến email. Vui lòng mở Gmail để lấy mã.'}
            {mode === 'VERIFY_LOGIN_OTP' && 'Mã OTP bảo mật 6 số có hiệu lực trong 10 phút. Bắt buộc nhận từ email để đăng nhập.'}
          </p>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div>{error}</div>
              {error.includes('nhập sai') && (
                <button
                  type="button"
                  onClick={handleResendNewOtp}
                  className="mt-2 text-xs font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Bấm vào đây để gửi mã OTP mới</span>
                </button>
              )}
            </div>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>{info}</div>
          </div>
        )}

        {/* Form: LOGIN STEP 1 - ONLY EMAIL */}
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
            >
              <span>Nhận mã OTP đăng nhập qua Gmail</span>
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
            >
              <span>Gửi mã xác minh Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Form: VERIFY REGISTER OTP */}
        {mode === 'VERIFY_REGISTER_OTP' && (
          <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-400">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Kiểm tra Gmail của bạn:</span>
              </div>
              <p className="text-xs text-slate-200">
                Mã xác thực 6 số đã được gửi đến: <strong className="text-white font-mono">{email}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vui lòng mở ứng dụng Gmail (kiểm tra cả Hộp thư đến và mục Spam) để lấy mã và nhập vào ô bên dưới.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Nhập mã xác minh 6 chữ số:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-xl font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <span>Xác nhận Gmail & Gửi hồ sơ lên Admin duyệt</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendNewOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gửi lại mã OTP mới</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Sửa email</span>
              </button>
            </div>
          </form>
        )}

        {/* Form: VERIFY LOGIN OTP (Strict Email Delivery - Zero Bypass) */}
        {mode === 'VERIFY_LOGIN_OTP' && (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
            {/* Delivery Status */}
            {isEmailSent ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Đã gửi mã OTP đến Gmail thành công!</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Mã OTP bảo mật 6 số đã được gửi đến: <strong className="text-white font-mono">{email}</strong>.
                </p>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  👉 Vui lòng mở ứng dụng Gmail (kiểm tra cả mục Hộp thư đến và mục Spam/Thư rác) và điền mã vào ô bên dưới.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Chưa gửi được mail qua Resend</span>
                </div>
                {errorDetail && (
                  <p className="text-[11px] text-amber-300/90 font-mono bg-slate-900/80 p-2 rounded-lg border border-amber-500/20 break-all">
                    Chi tiết: {errorDetail}
                  </p>
                )}
                <p className="text-[11px] text-slate-300">
                  Vui lòng đảm bảo biến <code className="text-amber-300 font-mono">RESEND_API_KEY</code> đã được cấu hình trên Cloudflare Pages.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Nhập mã OTP gồm 6 chữ số từ Gmail:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-xl font-mono tracking-widest text-center text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              <span>Xác thực & Vào ứng dụng ngay</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            {/* Recovery actions */}
            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleResendNewOtp}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gửi lại mã OTP mới</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setOtpCode('');
                  setError(null);
                }}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi email khác</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
