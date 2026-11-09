import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Layers, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  FileQuestion, 
  Sparkles, 
  X,
  HelpCircle,
  Tag,
  FolderTree
} from 'lucide-react';
import { Exam, Question, QuestionOption, QuestionType, Topic, User } from '../types';
import { storage } from '../utils/storage';

interface QuestionManagerProps {
  currentUser: User;
  activeExam: Exam;
  topics: Topic[];
  questions: Question[];
  onRefreshData: () => void;
  onOpenImport: () => void;
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  currentUser,
  activeExam,
  topics,
  questions,
  onRefreshData,
  onOpenImport
}) => {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  
  // Topic Management Modal
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicColor, setNewTopicColor] = useState('#3b82f6');
  const [deleteTopicTarget, setDeleteTopicTarget] = useState<Topic | null>(null);

  // Question Edit / Create Modal
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [modalType, setModalType] = useState<QuestionType>('SINGLE');

  // BR-32: Exam total question count deduplicated
  const stats = storage.getExamQuestionStats(activeExam.id, currentUser.id);

  // Filtered Questions
  const filtered = questions.filter(q => {
    if (selectedTopic !== 'ALL' && !q.topics.includes(selectedTopic)) return false;
    if (selectedType !== 'ALL' && q.type !== selectedType) return false;
    if (selectedDifficulty !== 'ALL' && q.difficulty !== Number(selectedDifficulty)) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const inContent = q.content.toLowerCase().includes(s);
      const inAnswer = q.answer_content?.toLowerCase().includes(s);
      const inExpl = q.explanation.toLowerCase().includes(s);
      const inOpts = q.options?.some(o => o.text.toLowerCase().includes(s));
      if (!inContent && !inAnswer && !inExpl && !inOpts) return false;
    }
    return true;
  });

  // Handle open create question
  const handleOpenCreate = (type: QuestionType = 'SINGLE') => {
    setModalType(type);
    setValidationErrors([]);
    setEditingQuestion({
      exam_id: activeExam.id,
      user_id: currentUser.id,
      type,
      content: '',
      options: type === 'FLASHCARD' ? [] : [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correct: type === 'FLASHCARD' ? [] : ['A'],
      answer_content: type === 'FLASHCARD' ? '' : null,
      explanation: '',
      topics: topics.length > 0 ? [topics[0].id] : [],
      difficulty: 2,
      source: 'MANUAL',
      version: 1
    });
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const questionToSave: Question = {
      id: editingQuestion.id || 'q-' + Date.now(),
      exam_id: activeExam.id,
      user_id: currentUser.id,
      type: modalType,
      content: editingQuestion.content || '',
      options: modalType === 'FLASHCARD' ? [] : (editingQuestion.options || []),
      correct: modalType === 'FLASHCARD' ? [] : (editingQuestion.correct || []),
      answer_content: modalType === 'FLASHCARD' ? (editingQuestion.answer_content || '') : null,
      explanation: editingQuestion.explanation || '',
      topics: editingQuestion.topics || [],
      difficulty: (editingQuestion.difficulty as any) || 2,
      source: editingQuestion.source || 'MANUAL',
      version: editingQuestion.version || 1,
      created_at: editingQuestion.created_at || Date.now(),
      updated_at: Date.now()
    };

    const errors = storage.validateQuestion(questionToSave);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    storage.saveQuestion(questionToSave, currentUser.id);
    setEditingQuestion(null);
    onRefreshData();
  };

  const handleDeleteQuestion = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      storage.deleteQuestion(id, currentUser.id);
      onRefreshData();
    }
  };

  // Topic creation & deletion (BR-36)
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;

    storage.saveTopic({
      id: 'topic-' + Date.now(),
      exam_id: activeExam.id,
      user_id: currentUser.id,
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
      color: newTopicColor
    }, currentUser.id);

    setNewTopicName('');
    setNewTopicDesc('');
    onRefreshData();
  };

  const confirmDeleteTopic = () => {
    if (!deleteTopicTarget) return;
    const { affectedQuestions } = storage.deleteTopic(deleteTopicTarget.id, currentUser.id);
    setDeleteTopicTarget(null);
    onRefreshData();
    alert(`Đã xóa chủ đề "${deleteTopicTarget.name}". Có ${affectedQuestions} câu hỏi đã được gỡ liên kết an toàn sang nhóm chưa phân loại (BR-36).`);
  };

  // Export questions to JSON
  const handleExportJSON = () => {
    const data = storage.getQuestionsByExam(activeExam.id, currentUser.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certflash_${activeExam.code}_questions.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Deduplication Stats (BR-32) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeExam.color }} />
              <h1 className="text-xl font-bold text-white">{activeExam.title}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-blue-400 border border-slate-700">
                {activeExam.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">{activeExam.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowTopicModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <FolderTree className="w-4 h-4 text-purple-400" />
              <span>Chủ đề ({topics.length})</span>
            </button>

            <button
              onClick={onOpenImport}
              className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border-2 border-emerald-500/50 text-xs font-bold text-emerald-300 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Tải tệp Word (.docx) / PDF</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Export</span>
            </button>

            <div className="relative group">
              <button
                onClick={() => handleOpenCreate('SINGLE')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition flex items-center gap-2 shadow-lg shadow-blue-600/25"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
            </div>
          </div>
        </div>

        {/* BR-32 Deduplication Stat Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium">Tổng câu hỏi (BR-32 Không trùng)</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{stats.totalQuestions}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-blue-400 font-medium">Trắc nghiệm 1 đáp án (SINGLE)</span>
            <div className="text-xl font-extrabold text-blue-200 mt-0.5">{stats.singleCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-purple-400 font-medium">Trắc nghiệm nhiều đáp án (MULTI)</span>
            <div className="text-xl font-extrabold text-purple-200 mt-0.5">{stats.multiCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-850 border border-slate-800">
            <span className="text-[11px] text-amber-400 font-medium">Thẻ ghi nhớ (FLASHCARD ADD-04)</span>
            <div className="text-xl font-extrabold text-amber-200 mt-0.5">{stats.flashcardCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi, đáp án, giải thích..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic filter */}
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả chủ đề ({topics.length})</option>
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả loại câu hỏi</option>
            <option value="SINGLE">Trắc nghiệm SINGLE</option>
            <option value="MULTI">Trắc nghiệm MULTI</option>
            <option value="FLASHCARD">Thẻ FLASHCARD</option>
          </select>

          {/* Difficulty filter */}
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Tất cả độ khó</option>
            <option value="1">Dễ (Level 1)</option>
            <option value="2">Trung bình (Level 2)</option>
            <option value="3">Khó (Level 3)</option>
          </select>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
            <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Không tìm thấy câu hỏi nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc thêm câu hỏi mới cho chứng chỉ này.</p>
          </div>
        ) : (
          filtered.map((q, idx) => {
            const qTopics = topics.filter(t => q.topics.includes(t.id));

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-slate-900 hover:bg-slate-850/90 border border-slate-800 transition group"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      q.type === 'FLASHCARD'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : q.type === 'MULTI'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                    }`}>
                      {q.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      Độ khó: {q.difficulty === 1 ? 'Dễ' : q.difficulty === 2 ? 'Trung bình' : 'Khó'}
                    </span>
                    {qTopics.map(t => (
                      <span
                        key={t.id}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setEditingQuestion(q);
                        setModalType(q.type);
                        setValidationErrors([]);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition"
                      title="Sửa câu hỏi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-sm font-semibold text-slate-100 leading-relaxed mb-3">
                  {q.content}
                </h4>

                {/* Flashcard Back content (ADD-04) */}
                {q.type === 'FLASHCARD' && q.answer_content && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 mb-3 whitespace-pre-line">
                    <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Mặt sau thẻ Flashcard (ADD-04):
                    </div>
                    {q.answer_content}
                  </div>
                )}

                {/* Options for SINGLE / MULTI */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map(opt => {
                      const isCorrect = q.correct?.includes(opt.key);
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl text-xs flex items-start gap-2.5 ${
                            isCorrect
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                              : 'bg-slate-800/60 border border-slate-700/60 text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {opt.key}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                    <strong className="text-slate-300">Giải thích: </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: TOPIC MANAGEMENT (BR-36) */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Quản lý chủ đề kiến thức (Topics)</h3>
                <p className="text-xs text-slate-400">Phân loại câu hỏi theo từng Domain của chứng chỉ.</p>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create new topic form */}
            <form onSubmit={handleCreateTopic} className="space-y-3 mb-6 p-4 rounded-2xl bg-slate-850 border border-slate-800">
              <div className="text-xs font-bold text-slate-300">Tạo chủ đề mới:</div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Tên chủ đề (ví dụ: Storage & S3, Compute, IAM...)"
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mô tả ngắn gọn (tùy chọn)"
                  value={newTopicDesc}
                  onChange={e => setNewTopicDesc(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="color"
                  value={newTopicColor}
                  onChange={e => setNewTopicColor(e.target.value)}
                  className="w-9 h-8 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                >
                  Thêm
                </button>
              </div>
            </form>

            {/* List existing topics */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {topics.map(t => {
                const count = questions.filter(q => q.topics.includes(t.id)).length;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color || '#3b82f6' }} />
                      <div>
                        <div className="text-xs font-bold text-slate-200">{t.name}</div>
                        <div className="text-[10px] text-slate-400">{count} câu hỏi đang gắn thẻ</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteTopicTarget(t)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                      title="Xóa chủ đề (BR-36)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TOPIC WITH BR-36 IMPACT NOTIFICATION */}
      {deleteTopicTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Xác nhận xóa chủ đề (Quy tắc BR-36)</span>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Bạn đang chuẩn bị xóa chủ đề <strong className="text-white">"{deleteTopicTarget.name}"</strong>.
              <br /><br />
              <strong className="text-amber-400">Tác động:</strong> Có{' '}
              <strong>{questions.filter(q => q.topics.includes(deleteTopicTarget.id)).length}</strong> câu hỏi
              đang gắn chủ đề này. Hệ thống sẽ gỡ liên kết an toàn, câu hỏi vẫn được giữ nguyên và chuyển sang trạng thái Chưa phân loại.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTopicTarget(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteTopic}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
              >
                Đồng ý xóa chủ đề
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT QUESTION (ADD-04) */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingQuestion.id ? 'Chỉnh sửa câu hỏi' : 'Tạo mới câu hỏi & Thẻ ghi nhớ'}
                </h3>
                <p className="text-xs text-slate-400">
                  Chuẩn hóa dữ liệu theo đặc tả BA v1.1 (ADD-04: Thẻ Flashcard bắt buộc mặt sau).
                </p>
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 space-y-1">
                {validationErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Loại câu hỏi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SINGLE', 'MULTI', 'FLASHCARD'] as QuestionType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setModalType(t);
                        setEditingQuestion(prev => ({
                          ...prev,
                          type: t,
                          options: t === 'FLASHCARD' ? [] : (prev?.options?.length ? prev.options : [
                            { key: 'A', text: '' },
                            { key: 'B', text: '' },
                            { key: 'C', text: '' },
                            { key: 'D', text: '' }
                          ]),
                          correct: t === 'FLASHCARD' ? [] : ['A'],
                          answer_content: t === 'FLASHCARD' ? (prev?.answer_content || '') : null
                        }));
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        modalType === t
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {t === 'SINGLE' && 'Trắc nghiệm 1 đáp án'}
                      {t === 'MULTI' && 'Nhiều đáp án (MULTI)'}
                      {t === 'FLASHCARD' && 'Thẻ FLASHCARD (2 mặt)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content / Front */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {modalType === 'FLASHCARD' ? 'Nội dung Mặt trước (Front Content):' : 'Nội dung câu hỏi / Tình huống:'}
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={modalType === 'FLASHCARD' ? 'Thuật ngữ, khái niệm hoặc câu hỏi cần nhớ...' : 'Mô tả bài toán hoặc câu hỏi chứng chỉ...'}
                  value={editingQuestion.content || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, content: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Flashcard BACK (ADD-04 mandatory) */}
              {modalType === 'FLASHCARD' && (
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Mặt sau thẻ (Answer Content - Bắt buộc ADD-04):
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Định nghĩa, câu trả lời đầy đủ, các điểm cốt lõi cần nhớ..."
                    value={editingQuestion.answer_content || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, answer_content: e.target.value })}
                    className="w-full p-3 bg-slate-800 border border-amber-500/40 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Options for SINGLE / MULTI */}
              {modalType !== 'FLASHCARD' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Danh sách đáp án lựa chọn & Đánh dấu đáp án đúng:
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {modalType === 'SINGLE' ? 'Chọn đúng 1 đáp án' : 'Chọn 1 hoặc nhiều đáp án đúng'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(editingQuestion.options || []).map((opt, oIdx) => {
                      const isCorrect = editingQuestion.correct?.includes(opt.key);

                      return (
                        <div key={opt.key} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (modalType === 'SINGLE') {
                                setEditingQuestion({ ...editingQuestion, correct: [opt.key] });
                              } else {
                                const set = new Set(editingQuestion.correct || []);
                                if (set.has(opt.key)) set.delete(opt.key);
                                else set.add(opt.key);
                                setEditingQuestion({ ...editingQuestion, correct: Array.from(set) });
                              }
                            }}
                            className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {opt.key}
                          </button>
                          <input
                            type="text"
                            required
                            placeholder={`Nội dung lựa chọn ${opt.key}...`}
                            value={opt.text}
                            onChange={e => {
                              const opts = [...(editingQuestion.options || [])];
                              opts[oIdx].text = e.target.value;
                              setEditingQuestion({ ...editingQuestion, options: opts });
                            }}
                            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Giải thích chi tiết (Explanation & Key takeaways):
                </label>
                <textarea
                  rows={2}
                  placeholder="Lý do vì sao đáp án đúng, phân tích các phương án gây nhiễu..."
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Topics & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gắn chủ đề (Topic):</label>
                  <select
                    value={editingQuestion.topics?.[0] || ''}
                    onChange={e => setEditingQuestion({ ...editingQuestion, topics: [e.target.value] })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Độ khó:</label>
                  <select
                    value={editingQuestion.difficulty || 2}
                    onChange={e => setEditingQuestion({ ...editingQuestion, difficulty: Number(e.target.value) as any })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>Dễ (Cơ bản / Recall)</option>
                    <option value={2}>Trung bình (Scenario / Phân tích)</option>
                    <option value={3}>Khó (Troubleshooting / Kiến trúc phức tạp)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
