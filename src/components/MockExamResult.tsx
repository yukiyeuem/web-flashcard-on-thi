import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  ChevronDown, 
  Filter, 
  BrainCircuit, 
  Flame, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Exam, MockAttempt, QuestionOption } from '../types';
import confetti from 'canvas-confetti';

interface MockExamResultProps {
  attempt: MockAttempt;
  activeExam: Exam;
  onRetake: () => void;
  onBackToDashboard: () => void;
}

export const MockExamResult: React.FC<MockExamResultProps> = ({
  attempt,
  activeExam,
  onRetake,
  onBackToDashboard
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'CORRECT' | 'WRONG' | 'FLAGGED'>('ALL');

  useEffect(() => {
    if (attempt.is_passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [attempt.is_passed]);

  const total = attempt.total_questions;
  const correct = attempt.correct_count || 0;
  const wrong = total - correct;
  const percentage = attempt.score_percentage || 0;
  const isPassed = attempt.is_passed;

  const filteredItems = attempt.items.filter(it => {
    if (filterMode === 'CORRECT') return it.is_correct;
    if (filterMode === 'WRONG') return !it.is_correct;
    if (filterMode === 'FLAGGED') return it.is_flagged;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Top Pass / Fail Banner */}
      <div className={`p-8 rounded-3xl border text-center space-y-4 relative overflow-hidden ${
        isPassed
          ? 'bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/40 shadow-2xl shadow-emerald-500/10'
          : 'bg-gradient-to-b from-red-950/40 to-slate-900 border-red-500/40 shadow-2xl shadow-red-500/10'
      }`}>
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${
          isPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isPassed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
        </div>

        <div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {isPassed ? 'ĐẠT YÊU CẦU (PASSED)' : 'CHƯA ĐẠT (FAILED)'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-3">
            {percentage}% Điểm số
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Điểm đỗ yêu cầu của chứng chỉ: <strong className="text-slate-200">{attempt.passing_score}%</strong>
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Số câu đúng</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{correct} / {total}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Số câu làm sai</div>
            <div className="text-xl font-extrabold text-red-400 mt-0.5">{wrong}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Thời gian làm</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{attempt.duration_minutes} phút</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-[11px] text-slate-400">Ngày nộp bài</div>
            <div className="text-sm font-bold text-slate-300 mt-1">
              {new Date(attempt.submitted_at || Date.now()).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={onRetake}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Thi thử lại đề khác</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang Tổng quan</span>
          </button>
        </div>
      </div>

      {/* Topic Mastery Breakdown */}
      {attempt.topic_breakdown && attempt.topic_breakdown.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Phân tích năng lực theo từng chủ đề (Topic Breakdown)</h2>
          </div>

          <div className="space-y-3 pt-2">
            {attempt.topic_breakdown.map(tb => (
              <div key={tb.topic_id} className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{tb.topic_name}</span>
                  <span className="font-mono font-bold text-slate-300">
                    {tb.correct}/{tb.total} ({tb.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      tb.percentage >= 75
                        ? 'bg-emerald-500'
                        : tb.percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${tb.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Question-by-Question Review (BR-30: Only revealed after submit) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Xem lại chi tiết bài làm & Lời giải</h2>
            <p className="text-xs text-slate-400">
              Quy tắc BR-30: Đáp án đúng và giải thích chỉ được hiển thị sau khi đã nộp bài thành công.
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({total})
            </button>
            <button
              onClick={() => setFilterMode('CORRECT')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đúng ({correct})
            </button>
            <button
              onClick={() => setFilterMode('WRONG')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'WRONG' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sai ({wrong})
            </button>
          </div>
        </div>

        {/* Question Items Review */}
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const snap = item.snapshot;

            return (
              <div
                key={item.question_id}
                className={`p-6 rounded-2xl border space-y-4 ${
                  item.is_correct
                    ? 'bg-slate-850/80 border-emerald-500/30'
                    : 'bg-slate-850/80 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-400">Câu #{idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.is_correct ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {item.is_correct ? '✓ Đúng' : '✕ Chưa chính xác'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{snap.type}</span>
                  </div>
                  {item.is_flagged && (
                    <span className="text-[10px] text-amber-400 font-bold">🚩 Có cắm cờ</span>
                  )}
                </div>

                <div className="text-sm font-bold text-slate-100 leading-relaxed">
                  {snap.content}
                </div>

                {/* Option list */}
                {snap.options && snap.options.length > 0 && (
                  <div className="space-y-2">
                    {snap.options.map(opt => {
                      const wasChosen = item.selected_answers.includes(opt.key);
                      const isRealCorrect = snap.correct?.includes(opt.key);

                      let style = 'bg-slate-800/60 border-slate-700 text-slate-300';
                      if (isRealCorrect) {
                        style = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                      } else if (wasChosen && !isRealCorrect) {
                        style = 'bg-red-500/20 border-red-500 text-red-200';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${style}`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isRealCorrect ? 'bg-emerald-500 text-slate-950' : wasChosen ? 'bg-red-500 text-white' : 'bg-slate-700'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                          {wasChosen && (
                            <span className="ml-auto text-[10px] opacity-80 shrink-0">(Bạn đã chọn)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Flashcard answer content (ADD-04) */}
                {snap.type === 'FLASHCARD' && snap.answer_content && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 whitespace-pre-line">
                    <strong className="text-amber-300 block mb-1">Mặt sau Flashcard:</strong>
                    {snap.answer_content}
                  </div>
                )}

                {/* Explanation */}
                {snap.explanation && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-blue-400">Giải thích chi tiết: </strong>
                    {snap.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
