import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  ChevronRight, 
  Check, 
  X, 
  Flame, 
  BrainCircuit, 
  Clock, 
  Shuffle, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  Award,
  ArrowRight
} from 'lucide-react';
import { Exam, Question, QuestionProgress, ReviewMode, ReviewRating, StudySessionItem, Topic, User } from '../types';
import { storage } from '../utils/storage';
import { calculateSM2, formatIntervalLabel } from '../utils/sm2';
import confetti from 'canvas-confetti';

interface StudySessionViewProps {
  currentUser: User;
  activeExam: Exam;
  topics: Topic[];
  questions: Question[];
  onFinishSession: () => void;
}

export const StudySessionView: React.FC<StudySessionViewProps> = ({
  currentUser,
  activeExam,
  topics,
  questions,
  onFinishSession
}) => {
  // Session Configuration State
  const [inSession, setInSession] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ReviewMode>('DUE');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('ALL');
  const [isShuffle, setIsShuffle] = useState(true);

  // Active Session State
  const [sessionItems, setSessionItems] = useState<StudySessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userSelectedOption, setUserSelectedOption] = useState<string | null>(null);
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [completedCount, setCompletedCount] = useState(0);

  // Stats for the setup screen
  const allProgress = storage.getProgressList(currentUser.id, activeExam.id);
  const now = Date.now();
  const dueQuestions = questions.filter(q => {
    const p = allProgress.find(prog => prog.question_id === q.id);
    return !p || p.due_at <= now;
  });
  const wrongQuestions = questions.filter(q => {
    const p = allProgress.find(prog => prog.question_id === q.id);
    const lastHistory = p?.history[p.history.length - 1];
    return lastHistory?.rating === 'AGAIN' || lastHistory?.is_correct === false;
  });

  // Start Session (ADD-08: Creates Snapshots)
  const handleStartSession = () => {
    let pool: Question[] = [];

    switch (selectedMode) {
      case 'DUE':
        pool = dueQuestions.length > 0 ? dueQuestions : questions;
        break;
      case 'WRONG':
        pool = wrongQuestions.length > 0 ? wrongQuestions : questions;
        break;
      case 'TOPIC':
        pool = selectedTopicId === 'ALL' 
          ? questions 
          : questions.filter(q => q.topics.includes(selectedTopicId));
        break;
      case 'FLASHCARD':
        pool = questions.filter(q => q.type === 'FLASHCARD');
        if (pool.length === 0) pool = questions; // fallback
        break;
      case 'ALL':
      default:
        pool = [...questions];
        break;
    }

    if (pool.length === 0) {
      alert('Không có câu hỏi nào phù hợp với chế độ này. Hãy thử chọn chế độ "Ôn tất cả".');
      return;
    }

    if (isShuffle) {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }

    // ADD-08: Snapshot items
    const items: StudySessionItem[] = pool.map(q => ({
      question_id: q.id,
      snapshot: { ...q }
    }));

    setSessionItems(items);
    setCurrentIndex(0);
    setIsFlipped(false);
    setUserSelectedOption(null);
    setHasRevealedAnswer(false);
    setCompletedCount(0);
    setQuestionStartTime(Date.now());
    setInSession(true);
  };

  const currentItem = sessionItems[currentIndex];
  const currentProgress = currentItem ? storage.getQuestionProgress(currentUser.id, currentItem.question_id) : undefined;

  // Rate question and record SM-2 progress
  const handleRate = (rating: ReviewRating) => {
    if (!currentItem) return;
    const elapsedMs = Date.now() - questionStartTime;
    const snap = currentItem.snapshot;

    let isCorrect = true;
    if (snap.type === 'SINGLE') {
      isCorrect = userSelectedOption === snap.correct?.[0];
    } else if (snap.type === 'MULTI') {
      isCorrect = snap.correct?.includes(userSelectedOption || '') || false;
    } else {
      isCorrect = rating !== 'AGAIN';
    }

    // Record progress with SM-2 algorithm
    storage.recordReview(
      currentUser.id,
      currentItem.question_id,
      activeExam.id,
      rating,
      isCorrect,
      elapsedMs
    );

    const nextCount = completedCount + 1;
    setCompletedCount(nextCount);

    if (currentIndex + 1 < sessionItems.length) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setUserSelectedOption(null);
      setHasRevealedAnswer(false);
      setQuestionStartTime(Date.now());
    } else {
      // Completed session!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      alert(`🎉 Chúc mừng bạn đã hoàn thành phiên ôn tập ${sessionItems.length} câu hỏi! Các khoảng thời gian ôn tập SM-2 đã được cập nhật thành công.`);
      setInSession(false);
      onFinishSession();
    }
  };

  // Calculate next preview intervals for the 4 rating buttons
  const againSM2 = calculateSM2(currentProgress, 'AGAIN');
  const hardSM2 = calculateSM2(currentProgress, 'HARD');
  const goodSM2 = calculateSM2(currentProgress, 'GOOD');
  const easySM2 = calculateSM2(currentProgress, 'EASY');

  // SETUP SCREEN
  if (!inSession) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Ôn Tập Thông Minh Lặp Ngắt Quãng (SM-2)</h1>
              <p className="text-xs text-slate-400">
                Thuật toán SuperMemo SM-2 tự động tính toán thời điểm vàng để ôn lại, tối đa hóa khả năng ghi nhớ dài hạn.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs font-semibold text-amber-400">Đến hạn hôm nay (Due today)</div>
              <div className="text-2xl font-extrabold text-white mt-1">{dueQuestions.length} câu</div>
              <p className="text-[11px] text-amber-300/80 mt-0.5">Cần củng cố để không bị quên</p>
            </div>
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <div className="text-xs font-semibold text-red-400">Cần ôn lại (Sai gần đây)</div>
              <div className="text-2xl font-extrabold text-white mt-1">{wrongQuestions.length} câu</div>
              <p className="text-[11px] text-red-300/80 mt-0.5">Khắc phục lỗ hổng kiến thức</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs font-semibold text-blue-400">Tổng ngân hàng câu hỏi</div>
              <div className="text-2xl font-extrabold text-white mt-1">{questions.length} câu</div>
              <p className="text-[11px] text-blue-300/80 mt-0.5">{activeExam.code}</p>
            </div>
          </div>

          {/* Study Mode Selector */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chọn chế độ ôn tập:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMode('DUE')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedMode === 'DUE'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-lg shadow-amber-600/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-amber-300">🔥 Ôn câu đến hạn (SM-2 Due)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    {dueQuestions.length} câu
                  </span>
                </div>
                <p className="text-xs text-slate-400">Ưu tiên ôn các câu hỏi đến hạn theo thuật toán lặp ngắt quãng.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('WRONG')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedMode === 'WRONG'
                    ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-600/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-red-300">🎯 Ôn câu sai gần đây</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">
                    {wrongQuestions.length} câu
                  </span>
                </div>
                <p className="text-xs text-slate-400">Luyện tập lại các câu hỏi trả lời chưa đúng hoặc đánh giá AGAIN.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('FLASHCARD')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedMode === 'FLASHCARD'
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-purple-300">🎴 Thẻ Flashcard thuần (2 mặt)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    {questions.filter(q => q.type === 'FLASHCARD').length} thẻ
                  </span>
                </div>
                <p className="text-xs text-slate-400">Lật thẻ 3D, củng cố định nghĩa, thuật ngữ và khái niệm chứng chỉ.</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('ALL')}
                className={`p-4 rounded-2xl border text-left transition ${
                  selectedMode === 'ALL'
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-blue-300">📚 Ôn tất cả ({questions.length} câu)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    Full Deck
                  </span>
                </div>
                <p className="text-xs text-slate-400">Duyệt qua toàn bộ ngân hàng câu hỏi của chứng chỉ hiện tại.</p>
              </button>
            </div>

            {/* Filter Topic if mode is TOPIC */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lọc theo chủ đề cụ thể:</label>
              <select
                value={selectedTopicId}
                onChange={e => {
                  setSelectedTopicId(e.target.value);
                  setSelectedMode('TOPIC');
                }}
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả chủ đề</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Shuffle toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={isShuffle}
                  onChange={e => setIsShuffle(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                />
                <Shuffle className="w-4 h-4 text-slate-400" />
                <span>Trộn ngẫu nhiên thứ tự câu hỏi (Shuffle)</span>
              </label>
            </div>

            {/* Start Button */}
            <div className="pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={handleStartSession}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600 hover:from-amber-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
              >
                <span>Bắt đầu phiên ôn tập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE STUDY SESSION
  const q = currentItem.snapshot;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Session Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn dừng phiên ôn tập? Tiến độ các câu đã đánh giá vẫn được lưu trữ.')) {
                setInSession(false);
              }
            }}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
          >
            ← Thoát
          </button>
          <span className="text-xs font-bold text-slate-200">
            Câu {currentIndex + 1} / {sessionItems.length}
          </span>
          <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-semibold">
            {q.type}
          </span>
        </div>

        {/* Progress track */}
        <div className="w-36 sm:w-48 bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-blue-500 h-2 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sessionItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D FLASHCARD / QUESTION CARD */}
      <div className="perspective-1000 min-h-[380px]">
        <div
          onClick={() => {
            if (q.type === 'FLASHCARD' || hasRevealedAnswer) {
              setIsFlipped(!isFlipped);
            }
          }}
          className={`relative w-full rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-8 shadow-2xl transition-all duration-500 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180 bg-slate-850 border-amber-500/40' : ''
          }`}
        >
          {/* FRONT SIDE */}
          {!isFlipped ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <BrainCircuit className="w-4 h-4 text-blue-400" />
                  Mặt trước:
                </span>
                <span className="text-[11px] text-slate-500">
                  {q.type === 'FLASHCARD' ? 'Nhấn để lật thẻ ↻' : 'Chọn đáp án bên dưới'}
                </span>
              </div>

              {/* Question stem */}
              <div className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                {q.content}
              </div>

              {/* Options for SINGLE / MULTI */}
              {q.options && q.options.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {q.options.map(opt => {
                    const isSelected = userSelectedOption === opt.key;
                    const isCorrect = q.correct?.includes(opt.key);

                    let itemStyle = 'bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-200';
                    if (hasRevealedAnswer) {
                      if (isCorrect) {
                        itemStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                      } else if (isSelected) {
                        itemStyle = 'bg-red-500/20 border-red-500 text-red-200';
                      }
                    } else if (isSelected) {
                      itemStyle = 'bg-blue-600/20 border-blue-500 text-blue-200 font-semibold';
                    }

                    return (
                      <div
                        key={opt.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasRevealedAnswer) {
                            setUserSelectedOption(opt.key);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition cursor-pointer ${itemStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-700/80 flex items-center justify-center font-bold text-xs shrink-0">
                          {opt.key}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reveal button for trắc nghiệm */}
              {q.type !== 'FLASHCARD' && !hasRevealedAnswer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHasRevealedAnswer(true);
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-4 h-4 text-blue-400" />
                  <span>Xem đáp án & Giải thích</span>
                </button>
              )}

              {/* Flashcard hint */}
              {q.type === 'FLASHCARD' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin-slow" />
                  <span>Nhấn vào thẻ bất kỳ đâu để lật xem đáp án mặt sau (ADD-04)</span>
                </div>
              )}
            </div>
          ) : (
            /* BACK SIDE */
            <div className="space-y-6 rotate-y-180">
              <div className="flex items-center justify-between text-xs text-amber-400">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Mặt sau thẻ (Answer Content):
                </span>
                <span className="text-[11px] text-slate-400">Nhấn để lật lại ↻</span>
              </div>

              {/* Answer content (ADD-04) */}
              <div className="text-sm sm:text-base font-medium text-slate-100 whitespace-pre-line leading-relaxed bg-slate-900/60 p-5 rounded-2xl border border-slate-700/60">
                {q.answer_content || q.explanation || 'Không có nội dung bổ sung.'}
              </div>

              {q.explanation && q.type === 'FLASHCARD' && (
                <div className="text-xs text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                  <strong className="text-slate-300">Ghi chú & Bí quyết: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SM-2 SELF-EVALUATION BUTTONS (ADD-05, ADD-07) */}
      {(hasRevealedAnswer || isFlipped || q.type === 'FLASHCARD') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">
              Bạn nhớ kiến thức này ở mức độ nào? (SM-2 Interval Calculation)
            </span>
            <span className="text-slate-400 text-[11px]">Chọn để lên lịch lần ôn tới</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* AGAIN */}
            <button
              onClick={() => handleRate('AGAIN')}
              className="p-3 rounded-2xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-red-300 group-hover:text-red-200">Quên / Làm sai</div>
              <div className="text-[10px] text-slate-400 mt-1">Lặp lại: {formatIntervalLabel(againSM2.interval_days)}</div>
            </button>

            {/* HARD */}
            <button
              onClick={() => handleRate('HARD')}
              className="p-3 rounded-2xl bg-amber-600/15 hover:bg-amber-600/25 border border-amber-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">Khó nhớ</div>
              <div className="text-[10px] text-slate-400 mt-1">Ôn lại: {formatIntervalLabel(hardSM2.interval_days)}</div>
            </button>

            {/* GOOD */}
            <button
              onClick={() => handleRate('GOOD')}
              className="p-3 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-blue-300 group-hover:text-blue-200">Nhớ tốt</div>
              <div className="text-[10px] text-slate-400 mt-1">Ôn lại: {formatIntervalLabel(goodSM2.interval_days)}</div>
            </button>

            {/* EASY */}
            <button
              onClick={() => handleRate('EASY')}
              className="p-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-left transition group"
            >
              <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Rất dễ</div>
              <div className="text-[10px] text-slate-400 mt-1">Ôn lại: {formatIntervalLabel(easySM2.interval_days)}</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
