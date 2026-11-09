import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Lock, 
  Unlock, 
  History, 
  UserCheck, 
  AlertTriangle, 
  Users, 
  EyeOff, 
  FileText,
  Search,
  RefreshCw
} from 'lucide-react';
import { storage } from '../utils/storage';
import { AuditLog, User } from '../types';

interface AdminPanelProps {
  currentUser: User;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onRefreshData }) => {
  const [subTab, setSubTab] = useState<'pending' | 'all-users' | 'audit'>('pending');
  const [search, setSearch] = useState('');
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('Thông tin không đủ điều kiện xét duyệt.');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center bg-red-950/20 border border-red-500/30 rounded-3xl">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-red-200">Truy cập bị từ chối (403 Forbidden)</h3>
        <p className="text-sm text-slate-400 mt-1">Chỉ người dùng có quyền ADMIN mới được truy cập module này.</p>
      </div>
    );
  }

  const allUsers = storage.getAllUsersForAdmin(currentUser);
  const pendingUsers = storage.getPendingUsersForAdmin(currentUser);
  const auditLogs = storage.getAuditLogs(currentUser);

  const handleApprove = (user: User) => {
    try {
      storage.adminApproveUser(currentUser, user.id);
      setActionMessage({ text: `Đã duyệt thành công tài khoản: ${user.email}`, type: 'success' });
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectModalUser) return;
    try {
      storage.adminRejectUser(currentUser, rejectModalUser.id, rejectReason);
      setActionMessage({ text: `Đã từ chối tài khoản: ${rejectModalUser.email}`, type: 'success' });
      setRejectModalUser(null);
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    }
  };

  const handleToggleBlock = (user: User, isCurrentlyBlocked: boolean) => {
    try {
      storage.adminToggleBlockUser(currentUser, user.id, !isCurrentlyBlocked);
      setActionMessage({ 
        text: !isCurrentlyBlocked ? `Đã khóa tài khoản: ${user.email}` : `Đã mở khóa tài khoản: ${user.email}`, 
        type: 'success' 
      });
      onRefreshData();
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    }
  };

  const handleEmergencyRevokeSessions = () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn thu hồi toàn bộ session đăng nhập của các tài khoản khác ngay lập tức?')) {
      storage.addAuditLog(currentUser, 'REVOKE_SESSIONS', 'ALL', 'ALL', 'Kích hoạt thu hồi toàn bộ session khẩn cấp');
      setActionMessage({ text: 'Đã phát lệnh thu hồi khẩn cấp toàn bộ session.', type: 'success' });
      onRefreshData();
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white">Quản Trị Hệ Thống (Admin Control Center)</h1>
          </div>
          <p className="text-xs text-slate-400">
            Duyệt tài khoản (ADD-01 / BR-20), quản lý thành viên, kiểm toán Audit Log (ADD-02) và bảo đảm cô lập dữ liệu người dùng (NFR-12).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEmergencyRevokeSessions}
            className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Thu hồi session khẩn cấp</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Banner (NFR-12) */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <EyeOff className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <span className="font-bold">Chính sách bảo mật dữ liệu học tập (NFR-12 & ADD-03):</span>{' '}
            Quản trị viên chỉ quản lý danh tính tài khoản và phân quyền. Hệ thống cách ly hoàn toàn dữ liệu đề thi cá nhân, flashcard và kết quả học tập của từng học viên.
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
            : 'bg-red-500/15 border border-red-500/30 text-red-300'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            subTab === 'pending'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Chờ duyệt (BR-20)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-950 border border-purple-400/40 text-purple-200">
            {pendingUsers.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('all-users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            subTab === 'all-users'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tất cả người dùng ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            subTab === 'audit'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký kiểm toán (Audit Logs)</span>
        </button>
      </div>

      {/* SUB-TAB 1: PENDING USERS (BR-20) */}
      {subTab === 'pending' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Danh sách tài khoản chờ xét duyệt</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Quy tắc BR-20: Chỉ hiển thị tài khoản đã xác minh thành công quyền sở hữu Gmail (email_verified_at ≠ null).
            </p>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Hiện tại không có tài khoản nào đang chờ duyệt.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Email đăng ký</th>
                    <th className="py-3 px-4">Xác minh Gmail (BR-20)</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">{user.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          Đã xác minh OTP
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleApprove(user)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
                        >
                          Duyệt kích hoạt
                        </button>
                        <button
                          onClick={() => setRejectModalUser(user)}
                          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold rounded-lg transition"
                        >
                          Từ chối
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: ALL USERS */}
      {subTab === 'all-users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Quản lý toàn bộ thành viên</h2>
              <p className="text-xs text-slate-400">Phân quyền, kiểm tra trạng thái và bảo vệ Admin mặc định.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map(user => {
                  const isSelf = user.id === currentUser.id;
                  const isBlocked = user.status === 'BLOCKED';

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {user.name} {isSelf && <span className="text-[10px] text-purple-400 font-normal">(Bạn)</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : user.status === 'PENDING'
                            ? 'bg-amber-500/15 text-amber-300'
                            : user.status === 'BLOCKED'
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isSelf && user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleBlock(user, isBlocked)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 ml-auto ${
                              isBlocked
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                                : 'bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30'
                            }`}
                          >
                            {isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{isBlocked ? 'Mở khóa' : 'Khóa tài khoản'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AUDIT LOGS (ADD-02) */}
      {subTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Nhật ký hoạt động bảo mật & kiểm toán (Audit Trail)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ghi lại mọi thao tác duyệt, khóa, thay đổi vai trò hoặc thu hồi session theo chuẩn ADD-02.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Thời điểm</th>
                  <th className="py-3 px-4">Người thực hiện</th>
                  <th className="py-3 px-4">Hành động</th>
                  <th className="py-3 px-4">Đối tượng mục tiêu</th>
                  <th className="py-3 px-4">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-purple-300">{log.actor_email}</td>
                    <td className="py-3 px-4 font-bold text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-300">{log.target_email}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Từ chối tài khoản học viên</h3>
            <p className="text-xs text-slate-400 mb-4">
              Người dùng: <strong className="text-white">{rejectModalUser.name}</strong> ({rejectModalUser.email})
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lý do từ chối:</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
