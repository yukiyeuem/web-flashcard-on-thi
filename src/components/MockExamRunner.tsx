import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Flag, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Send, 
  AlertTriangle, 
  Save, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Exam, MockAttempt, MockAttemptItem, Question, User } from '../types';
import { storage } from '../utils/storage';

interface MockExamRunnerProps {
  currentUser: User;
  activeExam: Exam;
  questions: Question[];
  onFinishAttempt: (attempt: MockAttempt) => void;
  onCancelAttempt: () => void;
}

export const MockExamRunner: React.FC<MockExamRunnerProps> = ({
  currentUser,
  activeExam,
  questions,
  onFinishAttempt,
  onCancelAttempt
}) => {
  const [attempt, setAttempt] = useState<MockAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED' | 'CONFLICT' | 'DEADLINE'>('IDLE');
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [customDuration, setCustomDuration] = useState(activeExam.default_time_minutes || 60);
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(questions.length || 10);
  const [customPassingScore, setCustomPassingScore] = useState<number>(activeExam.passing_score || 72);

  // Sync customQuestionCount when questions change
  useEffect(() => {
    if (questions.length > 0 && (!customQuestionCount || customQuestionCount > questions.length)) {
      setCustomQuestionCount(questions.length);
    }
  }, [questions.length]);

  // Start new attempt (ADD-10 check)
  const handleStartAttempt = () => {
    try {
      if (questions.length === 0) {
        alert('Chứng chỉ này chưa có câu hỏi nào để thi thử.');
        return;
      }

      const count = Number(customQuestionCount);
      if (isNaN(count) || count <= 0) {
        alert('Số lượng câu hỏi phải là số nguyên dương lớn hơn 0.');
        return;
      }
      if (count > questions.length) {
        alert(`Số lượng câu hỏi (${count}) không được vượt quá tổng số câu hiện có trong bài thi (${questions.length} câu).`);
        return;
      }

      const passing = Number(customPassingScore);
      if (isNaN(passing) || passing <= 0 || passing > 100) {
        alert('Điểm yêu cầu đỗ phải từ 1% đến 100%.');
        return;
      }

      // Shuffle and pick exactly the requested count
      const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, count);
      const newAttempt = storage.startMockExam(
        currentUser.id,
        activeExam,
        shuffled,
        customDuration,
        passing
      );

      setAttempt(newAttempt);
      setCurrentIndex(0);
      setTimeLeftMs(customDuration * 60 * 1000);
      setSaveStatus('SAVED');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const currentItem: MockAttemptItem | undefined = attempt?.items[currentIndex];

  // Answer selection with Optimistic Concurrency Control (ADD-11)
  const handleSelectOption = (key: string) => {
    if (!attempt || !currentItem) return;

    const snap = currentItem.snapshot;
    let nextAnswers: string[] = [];

    if (snap.type === 'SINGLE') {
      nextAnswers = [key];
    } else if (snap.type === 'MULTI') {
      const set = new Set(currentItem.selected_answers);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      nextAnswers = Array.from(set);
    } else {
      // Flashcard toggle
      nextAnswers = currentItem.selected_answers.includes('DONE') ? [] : ['DONE'];
    }

    triggerAutosave(currentItem.question_id, nextAnswers, currentItem.is_flagged, currentItem.version);
  };

  const handleToggleFlag = () => {
    if (!attempt || !currentItem) return;
    triggerAutosave(
      currentItem.question_id,
      currentItem.selected_answers,
      !currentItem.is_flagged,
      currentItem.version
    );
  };

  // Autosave with version increment (ADD-11)
  const triggerAutosave = (
    questionId: string,
    answers: string[],
    flagged: boolean,
    expectedVersion: number
  ) => {
    if (!attempt) return;
    setSaveStatus('SAVING');
    setConflictMessage(null);

    try {
      const res = storage.updateAttemptItem(
        currentUser.id,
        attempt.id,
        questionId,
        answers,
        flagged,
        expectedVersion
      );

      if (res.deadlineReached) {
        setSaveStatus('DEADLINE');
        handleAutoSubmit();
        return;
      }

      // Update local attempt state
      setAttempt(prev => {
        if (!prev) return null;
        return {
          ...prev,
          items: prev.items.map(i => {
            if (i.question_id === questionId) {
              return {
                ...i,
                selected_answers: answers,
                is_flagged: flagged,
                version: res.currentVersion
              };
            }
            return i;
          })
        };
      });

      setSaveStatus('SAVED');
    } catch (err: any) {
      if (err.message.includes('CONCURRENT_UPDATE')) {
        setSaveStatus('CONFLICT');
        setConflictMessage(err.message);
        // Refresh latest state from storage
        const latest = storage.getActiveMockAttempt(currentUser.id);
        if (latest) setAttempt(latest);
      } else {
        alert(err.message);
      }
    }
  };

  // Submit Mock Exam (ADD-12)
  const handleSubmitConfirm = () => {
    if (!attempt) return;
    const completed = storage.submitMockExam(currentUser.id, attempt.id);
    onFinishAttempt(completed);
  };

  const handleAutoSubmit = () => {
    if (!attempt) return;
    alert('⏰ Thời gian làm bài đã kết thúc! Hệ thống đang tự động thu bài và chấm điểm.');
    const completed = storage.submitMockExam(currentUser.id, attempt.id);
    onFinishAttempt(completed);
  };

  const handleAbandon = () => {
    if (window.confirm('CẢNH BÁO: Hủy bài thi sẽ xóa bỏ kết quả làm dở. Bạn có chắc chắn muốn hủy?')) {
      if (attempt) {
        storage.abandonMockExam(currentUser.id, attempt.id);
      }
      setAttempt(null);
      onCancelAttempt();
    }
  };

  // Format Timer HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // START SCREEN IF NO ACTIVE ATTEMPT
  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Thi Thử Chứng Chỉ (Mock Exam Simulator)</h1>
            <p className="text-xs text-slate-400">
              Mô phỏng trải nghiệm thi thật với thời gian đếm ngược, lưu tự động chống xung đột và chấm điểm tức thì.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Chứng chỉ:</span>
            <span className="font-bold text-slate-200">{activeExam.title} ({activeExam.code})</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Tổng số câu sẵn có trong đề:</span>
            <span className="font-bold text-blue-400">{questions.length} câu</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Cơ chế bảo mật (BA v1.1):</span>
            <span className="font-bold text-emerald-400">ADD-10 (Độc quyền 1 bài), ADD-11 (Chống ghi đè)</span>
          </div>
        </div>

        {/* Custom Configuration: Question Count & Passing Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Số câu hỏi thi (Tự điền):
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={questions.length}
                value={customQuestionCount}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setCustomQuestionCount(isNaN(val) ? 1 : Math.min(val, questions.length));
                }}
                className="w-full px-4 py-2.5 bg-slate-800 border-2 border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                / {questions.length} câu
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nhập từ 1 đến tối đa {questions.length} câu. Hệ thống sẽ bốc ngẫu nhiên.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Điểm đỗ yêu cầu % (Tự điền):
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                value={customPassingScore}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setCustomPassingScore(isNaN(val) ? 1 : Math.min(Math.max(val, 1), 100));
                }}
                className="w-full px-4 py-2.5 bg-slate-800 border-2 border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-emerald-400">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Điểm tối thiểu để được xét ĐẠT (Passed). Mặc định: {activeExam.passing_score}%.
            </p>
          </div>
        </div>

        {/* Custom Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-200">
              Thời lượng thi thử (Phút):
            </label>
            <span className="text-xs font-mono font-bold text-amber-400">{customDuration} phút</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[15, 30, 60, activeExam.default_time_minutes || 130].map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setCustomDuration(mins)}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                  customDuration === mins
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {mins} phút
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartAttempt}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer"
        >
          <span>Bắt đầu thi thử ({customQuestionCount} câu • Cần {customPassingScore}%)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ACTIVE RUNNING ATTEMPT
  const answeredCount = attempt.items.filter(i => i.selected_answers.length > 0).length;
  const flaggedCount = attempt.items.filter(i => i.is_flagged).length;
  const isUrgent = timeLeftMs < 5 * 60 * 1000; // under 5 mins

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Bar: Exam info, Timer, Status */}
      <div className="sticky top-18 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-white">{activeExam.code} Mock Exam</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
              Câu {currentIndex + 1} / {attempt.items.length}
            </span>
          </div>
          {/* Concurrency status indicator (ADD-11) */}
          <div className="flex items-center gap-2 text-[11px] mt-1 text-slate-400">
            {saveStatus === 'SAVING' && (
              <span className="text-amber-400 flex items-center gap-1">
                <Save className="w-3.5 h-3.5 animate-spin" />
                Đang lưu đáp án lên máy chủ...
              </span>
            )}
            {saveStatus === 'SAVED' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã đồng bộ tự động (v{currentItem?.version})
              </span>
            )}
            {saveStatus === 'CONFLICT' && (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {conflictMessage || 'Xung đột phiên bản! Đang tải dữ liệu mới...'}
              </span>
            )}
          </div>
        </div>

        {/* Timer & Submit button */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-extrabold text-sm sm:text-base ${
            isUrgent 
              ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-amber-300'
          }`}>
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(timeLeftMs)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nộp bài thi</span>
          </button>

          <button
            onClick={handleAbandon}
            className="text-xs text-slate-500 hover:text-red-400 px-2.5 py-2 rounded-lg transition"
            title="Hủy bỏ bài thi"
          >
            Hủy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Panel */}
        <div className="lg:col-span-3 space-y-4">
          {currentItem && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Question Meta Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">Câu hỏi #{currentIndex + 1}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    currentItem.snapshot.type === 'MULTI' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {currentItem.snapshot.type === 'MULTI' ? 'Nhiều lựa chọn (MULTI)' : 'Chọn một đáp án (SINGLE)'}
                  </span>
                </div>

                {/* Flag for review */}
                <button
                  type="button"
                  onClick={handleToggleFlag}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                    currentItem.is_flagged
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Flag className={`w-3.5 h-3.5 ${currentItem.is_flagged ? 'fill-amber-400 text-amber-400' : ''}`} />
                  <span>{currentItem.is_flagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}</span>
                </button>
              </div>

              {/* Question stem */}
              <div className="text-base font-bold text-slate-100 leading-relaxed">
                {currentItem.snapshot.content}
              </div>

              {/* Options */}
              {currentItem.snapshot.options && currentItem.snapshot.options.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {currentItem.snapshot.options.map(opt => {
                    const isSelected = currentItem.selected_answers.includes(opt.key);

                    return (
                      <div
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key)}
                        className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold shadow-md shadow-blue-600/10'
                            : 'bg-slate-850 border-slate-700/80 hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Pure flashcard in mock */
                <div className="p-6 rounded-2xl bg-slate-850 border border-slate-700 text-center space-y-4">
                  <p className="text-xs text-slate-400">Bạn đã nắm chắc kiến thức của câu hỏi này chưa?</p>
                  <button
                    onClick={() => handleSelectOption('DONE')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs transition ${
                      currentItem.selected_answers.includes('DONE')
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {currentItem.selected_answers.includes('DONE') ? '✓ Đã nắm vững' : 'Đánh dấu đã hiểu'}
                  </button>
                </div>
              )}

              {/* Navigation Back / Next */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Câu trước</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex === attempt.items.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-lg shadow-blue-600/25"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Question Navigator Palette */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Bảng điều hướng câu hỏi
            </h3>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Đánh dấu ({flaggedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                <span>Chưa làm ({attempt.items.length - answeredCount})</span>
              </div>
            </div>

            {/* Grid of question badges */}
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
              {attempt.items.map((it, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = it.selected_answers.length > 0;
                const isFlagged = it.is_flagged;

                let badgeStyle = 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500';
                if (isCurrent) {
                  badgeStyle = 'ring-2 ring-white border-transparent text-white font-extrabold';
                }
                if (isFlagged) {
                  badgeStyle += ' bg-amber-500/25 border-amber-500 text-amber-300';
                } else if (isAnswered) {
                  badgeStyle += ' bg-blue-600/30 border-blue-500 text-blue-200 font-semibold';
                }

                return (
                  <button
                    key={it.question_id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center transition relative ${badgeStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Xác nhận nộp bài thi thử?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Sau khi nộp bài, hệ thống sẽ chốt điểm số tức thì và mở khóa phần giải thích chi tiết cho từng câu hỏi.
            </p>

            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2 mb-6">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Số câu đã trả lời:</span>
                <span className="font-bold text-blue-400">{answeredCount} / {attempt.items.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Số câu chưa hoàn thành:</span>
                <span className={`font-bold ${attempt.items.length - answeredCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {attempt.items.length - answeredCount} câu
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Số câu còn cắm cờ (Flag):</span>
                <span className="font-bold text-slate-300">{flaggedCount} câu</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-700"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleSubmitConfirm}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
