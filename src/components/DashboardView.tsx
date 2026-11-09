import React, { useState } from 'react';
import { 
  Flame, 
  BrainCircuit, 
  Award, 
  Clock, 
  Layers, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  BookOpen,
  Sparkles,
  BarChart3,
  Target
} from 'lucide-react';
import { Exam, MockAttempt, Question, QuestionProgress, Topic, User } from '../types';
import { storage } from '../utils/storage';

interface DashboardViewProps {
  currentUser: User;
  activeExam: Exam;
  topics: Topic[];
  questions: Question[];
  onStartStudy: (mode: 'DUE' | 'WRONG' | 'ALL' | 'FLASHCARD') => void;
  onStartMock: () => void;
  onGoToQuestions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  activeExam,
  topics,
  questions,
  onStartStudy,
  onStartMock,
  onGoToQuestions
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('7D');

  // BR-32: Exam total question count deduplicated
  const examStats = storage.getExamQuestionStats(activeExam.id, currentUser.id);
  const allProgress = storage.getProgressList(currentUser.id, activeExam.id);
  const mockAttempts = storage.getMockAttempts(currentUser.id).filter(a => a.exam_id === activeExam.id && a.status === 'COMPLETED');

  // Calculate learning indicators (ADD-15)
  const now = Date.now();
  const timeLimitMs = timeRange === '7D' ? 7 * 86400000 : timeRange === '30D' ? 30 * 86400000 : Infinity;
  const cutoffTime = now - timeLimitMs;

  const studiedQuestions = questions.filter(q => {
    const p = allProgress.find(prog => prog.question_id === q.id);
    return !!p && p.history.length > 0;
  });

  const dueQuestions = questions.filter(q => {
    const p = allProgress.find(prog => prog.question_id === q.id);
    return !p || p.due_at <= now;
  });

  const recentWrongQuestions = questions.filter(q => {
    const p = allProgress.find(prog => prog.question_id === q.id);
    if (!p) return false;
    const last = p.history[p.history.length - 1];
    return last && (last.rating === 'AGAIN' || last.is_correct === false);
  });

  const masteredQuestions = allProgress.filter(p => p.status === 'MASTERED');

  // Calculate Accuracy over time range (ADD-15)
  let totalReviewsInRange = 0;
  let correctReviewsInRange = 0;
  allProgress.forEach(p => {
    p.history.forEach(h => {
      if (h.timestamp >= cutoffTime) {
        totalReviewsInRange++;
        if (h.is_correct || h.rating === 'GOOD' || h.rating === 'EASY') {
          correctReviewsInRange++;
        }
      }
    });
  });

  const accuracyPercentage = totalReviewsInRange > 0 
    ? Math.round((correctReviewsInRange / totalReviewsInRange) * 100) 
    : 85; // baseline

  // Topic Mastery calculation
  const topicMasteryList = topics.map(t => {
    const tQuestions = questions.filter(q => q.topics.includes(t.id));
    const studiedCount = tQuestions.filter(q => {
      const p = allProgress.find(prog => prog.question_id === q.id);
      return !!p && p.status === 'MASTERED';
    }).length;

    const percentage = tQuestions.length > 0 ? Math.round((studiedCount / tQuestions.length) * 100) : 0;
    return {
      topic: t,
      total: tQuestions.length,
      mastered: studiedCount,
      percentage
    };
  }).sort((a, b) => a.percentage - b.percentage); // ascending so weakest is first

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome & Certification Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeExam.color }} />
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">
                Mục tiêu chứng chỉ: {activeExam.code}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Chào mừng trở lại, {currentUser.name}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Bạn đang ôn thi <strong>{activeExam.title}</strong>. Hôm nay có{' '}
              <strong className="text-amber-400 font-bold">{dueQuestions.length} câu hỏi</strong> đến hạn lặp lại theo thuật toán SM-2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartStudy('DUE')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-xl shadow-orange-500/20 transition transform hover:-translate-y-0.5"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Ôn ngay câu đến hạn ({dueQuestions.length})</span>
            </button>
            <button
              onClick={onStartMock}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Làm bài thi thử</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Bar (ADD-15) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold">Tổng câu hỏi (BR-32)</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{examStats.totalQuestions}</div>
          <div className="text-[11px] text-slate-500 truncate">
            {examStats.flashcardCount} thẻ • {examStats.singleCount + examStats.multiCount} trắc nghiệm
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-semibold">Đến hạn hôm nay</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{dueQuestions.length}</div>
          <div className="text-[11px] text-amber-300/80">Cần ôn lại theo SM-2</div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold">Đã thuộc vững</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{masteredQuestions.length}</div>
          <div className="text-[11px] text-emerald-300/80">Khoảng cách &gt; 14 ngày</div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400 font-semibold">Cần củng cố</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{recentWrongQuestions.length}</div>
          <div className="text-[11px] text-red-300/80">Làm sai trong các lần trước</div>
        </div>
      </div>

      {/* Accuracy & Learning Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Accuracy & Time Filter (ADD-15) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Độ chính xác ôn tập</h3>
              <p className="text-xs text-slate-400">Tỷ lệ trả lời đúng theo thời gian</p>
            </div>
            {/* Time filter */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-[11px]">
              {(['7D', '30D', 'ALL'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    timeRange === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === '7D' ? '7 Ngày' : r === '30D' ? '30 Ngày' : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 border border-slate-800 text-center space-y-2">
            <div className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              {accuracyPercentage}%
            </div>
            <p className="text-xs text-slate-300">
              Độ chính xác trung bình trong kỳ chọn ({totalReviewsInRange} lượt đánh giá)
            </p>
          </div>

          {/* Quick Study launch buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onStartStudy('WRONG')}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 text-xs font-bold transition flex items-center justify-between"
            >
              <span>Luyện riêng các câu hay sai ({recentWrongQuestions.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onStartStudy('FLASHCARD')}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center justify-between"
            >
              <span>Lật thẻ Flashcard (2 mặt ADD-04)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Topic Mastery Breakdown (Domain Weaknesses) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Mức độ làm chủ theo chủ đề (Topic Mastery)</h3>
              <p className="text-xs text-slate-400">Các chủ đề có tỷ lệ thấp cần được ưu tiên ôn tập trước</p>
            </div>
            <button
              onClick={onGoToQuestions}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Quản lý học liệu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {topicMasteryList.map(tm => (
              <div key={tm.topic.id} className="p-3.5 rounded-2xl bg-slate-850/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tm.topic.color || '#3b82f6' }} />
                    <span className="font-bold text-slate-200">{tm.topic.name}</span>
                  </div>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {tm.mastered} / {tm.total} câu thuộc ({tm.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      tm.percentage >= 70
                        ? 'bg-emerald-500'
                        : tm.percentage >= 40
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${tm.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mock Exam History */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Lịch sử bài thi thử ({mockAttempts.length})</h3>
          </div>
          <button
            onClick={onStartMock}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
          >
            Làm bài thi mới
          </button>
        </div>

        {mockAttempts.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Bạn chưa hoàn thành bài thi thử nào cho chứng chỉ này. Hãy thử sức để đánh giá trình độ hiện tại!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5 px-3">Thời điểm nộp</th>
                  <th className="py-2.5 px-3">Số câu hỏi</th>
                  <th className="py-2.5 px-3">Thời gian thi</th>
                  <th className="py-2.5 px-3">Điểm số</th>
                  <th className="py-2.5 px-3 text-right">Kết quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {mockAttempts.map(att => (
                  <tr key={att.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(att.submitted_at || att.started_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{att.total_questions} câu</td>
                    <td className="py-3 px-3 text-slate-400">{att.duration_minutes} phút</td>
                    <td className="py-3 px-3 font-bold text-white">{att.score_percentage}%</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        att.is_passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {att.is_passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
