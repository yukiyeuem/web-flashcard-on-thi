import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  Download, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  KeyRound,
  FileSpreadsheet
} from 'lucide-react';
import { User } from '../types';
import { storage } from '../utils/storage';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserDeleted: () => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserDeleted
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTypedEmail, setDeleteTypedEmail] = useState('');

  if (!isOpen) return null;

  // Export all personal data (ADD-16)
  const handleExportData = () => {
    const data = storage.exportUserData(currentUser.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certflash_personal_data_${currentUser.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete account (ADD-16)
  const handleDeleteAccount = () => {
    if (deleteTypedEmail.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      alert('Email xác nhận không khớp. Vui lòng nhập chính xác email của bạn.');
      return;
    }

    if (currentUser.role === 'ADMIN') {
      alert('Không thể xóa tài khoản Quản trị viên mặc định qua giao diện người dùng (ADD-02).');
      return;
    }

    storage.deleteUserAccount(currentUser, currentUser.id);
    alert('Tài khoản và toàn bộ dữ liệu cá nhân của bạn đã được xóa vĩnh viễn khỏi hệ thống.');
    onUserDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-3">
            <UserIcon className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Cài đặt tài khoản & Dữ liệu cá nhân (ADD-16)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Quyền kiểm soát dữ liệu: Xem thông tin, tải về toàn bộ học liệu và quyền được lãng quên (Right to be forgotten).
          </p>
        </div>

        {/* Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Họ và tên:</span>
            <span className="font-bold text-slate-200">{currentUser.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Địa chỉ Gmail:</span>
            <span className="font-mono text-slate-200">{currentUser.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Xác minh Gmail (ADD-01):</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentUser.email_verified_at ? 'Đã xác minh' : 'Chưa'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vai trò:</span>
            <span className="font-bold text-purple-400">{currentUser.role}</span>
          </div>
        </div>

        {/* Data Export (ADD-16) */}
        <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
            <Download className="w-4 h-4" />
            <span>Xuất toàn bộ dữ liệu học tập cá nhân</span>
          </div>
          <p className="text-xs text-slate-400">
            Tải về tệp tin JSON chứa toàn bộ đề thi, câu hỏi đã tạo, lịch sử ôn tập SM-2 và kết quả các bài thi thử.
          </p>
          <button
            onClick={handleExportData}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải tệp JSON dữ liệu học viên (ADD-16)</span>
          </button>
        </div>

        {/* Account Deletion (ADD-16) */}
        {currentUser.role !== 'ADMIN' && (
          <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-3">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Yêu cầu xóa tài khoản và dữ liệu (GDPR Compliance)</span>
            </div>
            <p className="text-xs text-slate-400">
              Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, các câu hỏi và mọi dữ liệu tiến độ. Không thể hoàn tác.
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs rounded-xl transition"
              >
                Xóa tài khoản của tôi
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-red-500/40 space-y-3 animate-in fade-in">
                <label className="block text-xs text-red-300 font-medium">
                  Vui lòng gõ lại email <strong className="text-white">{currentUser.email}</strong> để xác nhận:
                </label>
                <input
                  type="email"
                  placeholder={currentUser.email}
                  value={deleteTypedEmail}
                  onChange={e => setDeleteTypedEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg"
                  >
                    Xác nhận xóa vĩnh viễn
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
