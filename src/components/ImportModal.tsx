import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { DuplicateStrategy, Exam, ImportReport, Question, Topic, User } from '../types';
import { parseAndValidateImport } from '../utils/importers';
import { storage } from '../utils/storage';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeExam: Exam;
  topics: Topic[];
  currentUser: User;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  activeExam,
  topics,
  currentUser,
  onSuccess
}) => {
  const [step, setStep] = useState<'INPUT' | 'PREVIEW' | 'REPORT'>('INPUT');
  const [rawText, setRawText] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [strategy, setStrategy] = useState<DuplicateStrategy>('SKIP');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [commitResult, setCommitResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const existingQuestions = storage.getQuestionsByExam(activeExam.id, currentUser.id);

  // Step 1 -> Step 2: Parse and Preview
  const handleParse = () => {
    if (!rawText.trim()) {
      alert('Vui lòng dán nội dung hoặc tải tệp tài liệu câu hỏi.');
      return;
    }

    const parsedReport = parseAndValidateImport(rawText, existingQuestions, selectedTopicId);
    if (parsedReport.total === 0) {
      alert('Không nhận diện được câu hỏi nào từ định dạng nhập vào. Vui lòng xem tài liệu mẫu bên dưới.');
      return;
    }

    setReport(parsedReport);
    setStep('PREVIEW');
  };

  // Step 2 -> Step 3: Commit
  const handleCommit = () => {
    if (!report) return;

    // Filter only valid items
    const validRawQuestions = report.items
      .filter(item => item.isValid)
      .map(item => item.raw);

    if (validRawQuestions.length === 0) {
      alert('Không có câu hỏi hợp lệ nào để nhập.');
      return;
    }

    const res = storage.commitImportedQuestions(
      activeExam.id,
      currentUser.id,
      validRawQuestions,
      strategy
    );

    setCommitResult(res);
    setStep('REPORT');
    onSuccess();
  };

  // Sample templates
  const sampleDOCXText = `Câu 1: Một công ty cần lưu trữ dữ liệu tệp tin trên AWS có thể mount đồng thời vào hàng trăm máy chủ Linux EC2 instances. Dịch vụ lưu trữ nào phù hợp nhất?
A. Amazon S3 Standard
B. Amazon Elastic File System (Amazon EFS)
C. Amazon Elastic Block Store (Amazon EBS)
D. AWS Storage Gateway
Đáp án: B
Giải thích: Amazon EFS là hệ thống tệp tin mạng (NFS) được quản lý hoàn toàn, hỗ trợ kết nối đồng thời từ hàng trăm đến hàng nghìn EC2 instances.

Thẻ ghi nhớ:
Mặt trước: Vai trò chính của AWS KMS (Key Management Service) là gì?
Mặt sau: Quản lý tập trung các khóa mã hóa (CMKs), tạo, xoay vòng và kiểm soát quyền truy cập để mã hóa dữ liệu trên các dịch vụ AWS và ứng dụng.
Giải thích: Tích hợp với AWS CloudTrail để audit mọi thao tác sử dụng khóa.`;

  const sampleJSON = `[
  {
    "type": "FLASHCARD",
    "content": "Sự khác biệt cốt lõi giữa Security Group và Network ACL trong AWS VPC?",
    "answer_content": "Security Group hoạt động ở cấp độ Instance (Stateful, chỉ cần mở Inbound thì Outbound tự cho phép).\\nNetwork ACL hoạt động ở cấp độ Subnet (Stateless, phải mở cả Inbound và Outbound rules).",
    "explanation": "Security Group kiểm tra sau khi lưu lượng đã qua Network ACL.",
    "difficulty": 2
  }
]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800 text-xs">
          <span className={`font-bold px-3 py-1 rounded-full ${
            step === 'INPUT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            1. Nhập học liệu
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`font-bold px-3 py-1 rounded-full ${
            step === 'PREVIEW' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            2. Xem trước & Xử lý trùng
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`font-bold px-3 py-1 rounded-full ${
            step === 'REPORT' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            3. Báo cáo kết quả
          </span>
        </div>

        {/* STEP 1: INPUT */}
        {step === 'INPUT' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Import câu hỏi & Thẻ Flashcard hàng loạt</h2>
              <p className="text-xs text-slate-400 mt-1">
                Chuẩn hóa cấu trúc trung gian (ADD-13). Hỗ trợ định dạng văn bản DOCX, JSON hoặc Markdown.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawText(sampleDOCXText)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-blue-400 text-xs font-semibold border border-slate-700 transition"
              >
                + Điền mẫu Word/Text
              </button>
              <button
                type="button"
                onClick={() => setRawText(sampleJSON)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-purple-400 text-xs font-semibold border border-slate-700 transition"
              >
                + Điền mẫu JSON
              </button>
            </div>

            <div>
              <textarea
                rows={10}
                required
                placeholder="Dán nội dung các câu hỏi hoặc thẻ ghi nhớ theo định dạng mẫu vào đây..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Default topic select */}
            {topics.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Gắn chủ đề mặc định cho các câu chưa phân loại:
                </label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleParse}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition flex items-center gap-2"
              >
                <span>Phân tích & Kiểm tra (Validation)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & DUPLICATE STRATEGY */}
        {step === 'PREVIEW' && report && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Kết quả kiểm tra dữ liệu trước khi lưu</h2>
              <p className="text-xs text-slate-400 mt-1">
                BR-41 & BR-42: Dữ liệu preview chưa được ghi vào cơ sở dữ liệu cho đến khi bạn xác nhận.
              </p>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <div className="text-[11px] text-slate-400">Tổng phát hiện</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{report.total}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[11px] text-emerald-400">Hợp lệ</div>
                <div className="text-lg font-extrabold text-emerald-300 mt-0.5">{report.validCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <div className="text-[11px] text-red-400">Lỗi dữ liệu (BR-43)</div>
                <div className="text-lg font-extrabold text-red-300 mt-0.5">{report.errorCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-[11px] text-amber-400">Trùng lặp (BR-44)</div>
                <div className="text-lg font-extrabold text-amber-300 mt-0.5">{report.duplicateCount}</div>
              </div>
            </div>

            {/* Duplicate strategy selector */}
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                Chính sách xử lý khi gặp câu hỏi trùng lặp (BR-44, BR-45):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'SKIP', label: 'Bỏ qua (Khuyên dùng)', desc: 'Không nhập câu trùng' },
                  { key: 'KEEP_BOTH', label: 'Nhập cả hai', desc: 'Tạo bản ghi mới độc lập' },
                  { key: 'UPDATE_EXISTING', label: 'Cập nhật câu cũ', desc: 'Ghi đè nội dung mới' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setStrategy(opt.key as DuplicateStrategy)}
                    className={`p-2.5 rounded-xl text-left border transition ${
                      strategy === opt.key
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Items review list */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {report.items.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    !item.isValid
                      ? 'bg-red-500/10 border-red-500/30'
                      : item.isDuplicate
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-850 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">#{idx + 1}</span>
                      <span className="font-semibold text-white truncate max-w-sm">
                        {item.raw.content.slice(0, 70)}...
                      </span>
                    </div>
                    <div>
                      {!item.isValid ? (
                        <span className="text-[10px] font-bold text-red-400">✕ Lỗi cú pháp</span>
                      ) : item.isDuplicate ? (
                        <span className="text-[10px] font-bold text-amber-400">⚠ Trùng lặp</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400">✓ Sẵn sàng</span>
                      )}
                    </div>
                  </div>

                  {/* Errors display */}
                  {item.errors.length > 0 && (
                    <div className="text-[11px] text-red-300 space-y-0.5">
                      {item.errors.map((e, errIdx) => (
                        <div key={errIdx}>• {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between">
              <button
                type="button"
                onClick={() => setStep('INPUT')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                ← Quay lại sửa nội dung
              </button>
              <button
                type="button"
                onClick={handleCommit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
              >
                Xác nhận lưu vào đề thi ({report.validCount} câu)
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REPORT */}
        {step === 'REPORT' && commitResult && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Import học liệu hoàn tất!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Các câu hỏi và flashcard đã được lưu trữ thành công vào ngân hàng đề thi {activeExam.code}.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Đã thêm mới</span>
                <span className="text-emerald-400 text-lg font-bold">+{commitResult.added}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Đã cập nhật</span>
                <span className="text-blue-400 text-lg font-bold">{commitResult.updated}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Đã bỏ qua</span>
                <span className="text-amber-400 text-lg font-bold">{commitResult.skipped}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
