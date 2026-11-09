import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  FileCode,
  FileSpreadsheet,
  FileType,
  Loader2,
  Sparkles
} from 'lucide-react';
import { DuplicateStrategy, Exam, ImportReport, Topic, User } from '../types';
import { extractTextFromFile, parseAndValidateImport } from '../utils/importers';
import { downloadSampleTemplate } from '../utils/exporters';
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topics[0]?.id || '');
  const [strategy, setStrategy] = useState<DuplicateStrategy>('SKIP');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [commitResult, setCommitResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const existingQuestions = storage.getQuestionsByExam(activeExam.id, currentUser.id);

  // Handle file upload (.docx, .pdf, .txt, .json)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsExtracting(true);
      setUploadedFileName(file.name);
      const text = await extractTextFromFile(file);
      if (!text || !text.trim()) {
        alert('Tệp tin không có nội dung văn bản hoặc không thể trích xuất.');
        return;
      }
      setRawText(text);
    } catch (err: any) {
      alert(`Lỗi khi đọc tệp tin: ${err.message || 'Không thể trích xuất văn bản từ tệp này.'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Step 1 -> Step 2: Parse and Preview
  const handleParse = () => {
    if (!rawText.trim()) {
      alert('Vui lòng tải tệp Word (.docx), PDF (.pdf) hoặc dán nội dung câu hỏi.');
      return;
    }

    const parsedReport = parseAndValidateImport(rawText, existingQuestions, selectedTopicId);
    if (parsedReport.total === 0) {
      alert('Không nhận diện được câu hỏi nào từ nội dung tài liệu. Vui lòng kiểm tra định dạng (Câu 1: ... A. ... B. ... Đáp án: ... hoặc Mặt trước: ... Mặt sau: ...)');
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
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
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
            1. Tải lên tệp Word/PDF
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
            3. Báo cáo hoàn tất
          </span>
        </div>

        {/* STEP 1: INPUT & FILE UPLOAD */}
        {step === 'INPUT' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Upload Tài Liệu & Thêm Câu Hỏi Tự Động</h2>
              <p className="text-xs text-slate-300 mt-1">
                Hỗ trợ trích xuất trực tiếp câu hỏi và đáp án từ tệp <strong>Word (.docx)</strong>, <strong>PDF (.pdf)</strong>, tệp văn bản <strong>(.txt, .md)</strong> hoặc <strong>JSON</strong>.
              </p>
            </div>

            {/* Drag & Drop / File Picker Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-500/50 hover:border-blue-400 bg-blue-950/20 hover:bg-blue-950/30 rounded-2xl p-6 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt,.json,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                {isExtracting ? (
                  <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7 text-blue-400" />
                )}
              </div>
              <div className="text-sm font-extrabold text-white">
                {isExtracting ? (
                  <span className="text-amber-400">Đang đọc và trích xuất nội dung từ tệp tin...</span>
                ) : uploadedFileName ? (
                  <span className="text-emerald-400">✓ Đã nạp tệp: {uploadedFileName} (Nhấn để chọn tệp khác)</span>
                ) : (
                  <span>Nhấn vào đây để tải lên tệp Word (.docx) hoặc PDF (.pdf)</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Hệ thống tự động phân tích các câu trắc nghiệm (A, B, C, D) và thẻ ghi nhớ (Mặt trước / Mặt sau)
              </p>

              {/* Supported format badges */}
              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-semibold">
                <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30">
                  📄 Word (.docx)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-600/30 text-red-300 border border-red-500/30">
                  📑 Adobe PDF (.pdf)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                  📝 Text / Markdown (.txt)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/30">
                  ⚡ JSON (.json)
                </span>
              </div>

              {/* Template Download Links */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Tải tệp mẫu chuẩn:</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); downloadSampleTemplate('docx'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-semibold text-[11px] border border-slate-700 transition"
                >
                  📄 File mẫu Word (.docx)
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); downloadSampleTemplate('pdf'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 font-semibold text-[11px] border border-slate-700 transition"
                >
                  📑 File mẫu PDF (.pdf)
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); downloadSampleTemplate('txt'); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] border border-slate-700 transition"
                >
                  📝 File mẫu Text (.txt)
                </button>
              </div>
            </div>

            {/* Or Paste Manual Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200">
                  Hoặc kiểm tra / dán nội dung văn bản bên dưới:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFileName(null);
                      setRawText(sampleDOCXText);
                    }}
                    className="text-[11px] text-blue-400 hover:underline font-semibold"
                  >
                    + Điền mẫu Word
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFileName(null);
                      setRawText(sampleJSON);
                    }}
                    className="text-[11px] text-purple-400 hover:underline font-semibold"
                  >
                    + Điền mẫu JSON
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                required
                placeholder="Nội dung văn bản trích xuất sẽ tự động xuất hiện tại đây sau khi bạn tải file Word/PDF lên, hoặc bạn có thể gõ trực tiếp..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full p-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Default topic select */}
            {topics.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Chủ đề mặc định gán cho các câu hỏi mới:
                </label>
                <select
                  value={selectedTopicId}
                  onChange={e => setSelectedTopicId(e.target.value)}
                  className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                >
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isExtracting || !rawText.trim()}
                onClick={handleParse}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-extrabold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
              >
                <span>Phân tích câu hỏi & Đáp án</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & DUPLICATE STRATEGY */}
        {step === 'PREVIEW' && report && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">Kết Quả Phân Tích Dữ Liệu</h2>
              <p className="text-xs text-slate-300 mt-1">
                Xem lại danh sách câu hỏi đã nhận diện từ tệp tài liệu trước khi xác nhận lưu vào đề thi.
              </p>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-bold">Tổng nhận diện</div>
                <div className="text-xl font-black text-white mt-0.5">{report.total}</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                <div className="text-[11px] text-emerald-400 font-bold">Hợp lệ</div>
                <div className="text-xl font-black text-emerald-300 mt-0.5">{report.validCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30">
                <div className="text-[11px] text-red-400 font-bold">Lỗi cú pháp</div>
                <div className="text-xl font-black text-red-300 mt-0.5">{report.errorCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <div className="text-[11px] text-amber-400 font-bold">Trùng lặp</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">{report.duplicateCount}</div>
              </div>
            </div>

            {/* Duplicate strategy selector */}
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                Chính sách khi gặp câu hỏi đã có sẵn trong đề:
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
                    className={`p-3 rounded-xl text-left border-2 transition ${
                      strategy === opt.key
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Helper for un-keyed exam dump questions */}
            {report.items.some(it => it.raw.type !== 'FLASHCARD' && (!it.raw.correct || it.raw.correct.length === 0)) && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-amber-200">
                  <span className="font-bold text-amber-300">💡 Phát hiện đề thi chưa có đáp án:</span> Có{' '}
                  <span className="font-extrabold text-white">
                    {report.items.filter(it => it.raw.type !== 'FLASHCARD' && (!it.raw.correct || it.raw.correct.length === 0)).length}
                  </span>{' '}
                  câu chưa có đáp án chính thức (phù hợp ôn luyện). Bạn có thể gán tạm đáp án hoặc lưu để tự luyện!
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updatedItems = report.items.map(it => {
                      if (it.raw.type !== 'FLASHCARD' && (!it.raw.correct || it.raw.correct.length === 0)) {
                        return {
                          ...it,
                          raw: { ...it.raw, correct: ['A'] },
                          warnings: ['Đã gán tạm đáp án mặc định (A)']
                        };
                      }
                      return it;
                    });
                    setReport({ ...report, items: updatedItems });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] shadow-md shrink-0 transition"
                >
                  ⚡ Gán tạm đáp án A cho tất cả
                </button>
              </div>
            )}

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
                      <span className="font-bold text-white truncate max-w-sm">
                        {item.raw.content.slice(0, 80)}...
                      </span>
                    </div>
                    <div>
                      {!item.isValid ? (
                        <span className="text-[10px] font-bold text-red-400">✕ Lỗi dữ liệu</span>
                      ) : item.isDuplicate ? (
                        <span className="text-[10px] font-bold text-amber-400">⚠ Trùng câu có sẵn</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400">✓ Sẵn sàng</span>
                      )}
                    </div>
                  </div>

                  {/* Warnings display */}
                  {item.warnings && item.warnings.length > 0 && (
                    <div className="text-[11px] text-amber-300 space-y-0.5">
                      {item.warnings.map((w, wIdx) => (
                        <div key={wIdx}>💡 {w}</div>
                      ))}
                    </div>
                  )}

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
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={handleCommit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition"
              >
                Xác nhận lưu ({report.validCount} câu hợp lệ)
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
              <h2 className="text-xl font-extrabold text-white">Đã Thêm Câu Hỏi Thành Công!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Các câu hỏi từ tệp tài liệu đã được nạp vào chứng chỉ {activeExam.code}.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold">Thêm mới</span>
                <span className="text-emerald-400 text-xl font-black">+{commitResult.added}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold">Cập nhật</span>
                <span className="text-blue-400 text-xl font-black">{commitResult.updated}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
                <span className="text-slate-400 block text-[10px] font-bold">Bỏ qua</span>
                <span className="text-amber-400 text-xl font-black">{commitResult.skipped}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition"
              >
                Đóng & Xem ngân hàng câu hỏi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
