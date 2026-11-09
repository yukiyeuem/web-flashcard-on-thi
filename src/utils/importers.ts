/**
 * Standardized Import Parser and Validator (ADD-13, ADD-14, BR-41, BR-42, BR-43)
 */

import { ImportPreviewItem, ImportReport, IntermediateQuestion, Question } from '../types';

export function parseAndValidateImport(
  rawText: string,
  existingQuestions: Question[],
  defaultTopicId?: string
): ImportReport {
  const intermediateList: IntermediateQuestion[] = [];
  const trimmed = rawText.trim();

  // Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item: any) => {
        intermediateList.push({
          type: item.type || (item.answer_content ? 'FLASHCARD' : (item.options?.length ? 'SINGLE' : 'FLASHCARD')),
          content: item.content || item.front || item.question || '',
          options: item.options || [],
          correct: Array.isArray(item.correct) ? item.correct : item.correct ? [item.correct] : [],
          answer_content: item.answer_content || item.back || null,
          explanation: item.explanation || item.note || '',
          topics: item.topics || (defaultTopicId ? [defaultTopicId] : []),
          difficulty: item.difficulty || 2,
          source: item.source || 'DOCX'
        });
      });
    } catch {
      // Fallback to text parser below
    }
  }

  // If JSON parsing was not applicable or yielded nothing, parse textual format (DOCX/TXT)
  if (intermediateList.length === 0) {
    const blocks = trimmed.split(/\n\s*\n|\n(?=(?:Câu\s+\d+|Question\s+\d+|Thẻ\s+\d+|Flashcard\s+\d+):?)/i);

    blocks.forEach(block => {
      const text = block.trim();
      if (!text) return;

      // Check if it's a Flashcard block
      if (/mặt\s*trước|front\s*:/i.test(text) && /mặt\s*sau|back\s*:/i.test(text)) {
        const frontMatch = text.match(/(?:mặt\s*trước|front):\s*([\s\S]*?)(?=(?:mặt\s*sau|back):)/i);
        const backMatch = text.match(/(?:mặt\s*sau|back):\s*([\s\S]*?)(?=(?:giải\s*thích|note):|$)/i);
        const expMatch = text.match(/(?:giải\s*thích|note):\s*([\s\S]*)$/i);

        intermediateList.push({
          type: 'FLASHCARD',
          content: frontMatch ? frontMatch[1].trim() : text,
          options: [],
          correct: [],
          answer_content: backMatch ? backMatch[1].trim() : '',
          explanation: expMatch ? expMatch[1].trim() : '',
          topics: defaultTopicId ? [defaultTopicId] : [],
          difficulty: 2,
          source: 'DOCX'
        });
        return;
      }

      // Check if it's multiple choice
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      let content = '';
      const options: { key: string; text: string }[] = [];
      let correct: string[] = [];
      let explanation = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const optMatch = line.match(/^([A-Fa-f])[\.\)\:\-]\s*(.*)$/);
        const ansMatch = line.match(/^(?:đáp\s*án|answer|key):\s*([A-Za-z,\s]+)$/i);
        const expMatch = line.match(/^(?:giải\s*thích|explanation|lưu\s*ý):\s*(.*)$/i);

        if (ansMatch) {
          correct = ansMatch[1].toUpperCase().split(/[,\s]+/).filter(Boolean);
        } else if (expMatch) {
          explanation = expMatch[1];
          // Capture remaining lines as explanation
          for (let j = i + 1; j < lines.length; j++) {
            explanation += '\n' + lines[j];
          }
          break;
        } else if (optMatch) {
          options.push({
            key: optMatch[1].toUpperCase(),
            text: optMatch[2]
          });
        } else {
          // Question content line
          content += (content ? '\n' : '') + line.replace(/^(?:Câu|Question)\s*\d+[\.\:\-]\s*/i, '');
        }
      }

      const isMulti = correct.length > 1;
      const type = options.length > 0 ? (isMulti ? 'MULTI' : 'SINGLE') : 'FLASHCARD';

      intermediateList.push({
        type,
        content: content.trim(),
        options,
        correct,
        answer_content: type === 'FLASHCARD' ? explanation || 'Chưa có đáp án mặt sau' : null,
        explanation: explanation.trim(),
        topics: defaultTopicId ? [defaultTopicId] : [],
        difficulty: 2,
        source: 'DOCX'
      });
    });
  }

  // Validate each item (BR-42, BR-43)
  const previewItems: ImportPreviewItem[] = intermediateList.map(raw => {
    const errors: string[] = [];

    if (!raw.content || raw.content.trim().length === 0) {
      errors.push('Thiếu nội dung câu hỏi hoặc mặt trước thẻ.');
    }

    if (raw.type === 'FLASHCARD') {
      if (!raw.answer_content || raw.answer_content.trim().length === 0) {
        errors.push('Mặt sau Flashcard không được để trống (ADD-04).');
      }
    } else {
      if (!raw.options || raw.options.length < 2) {
        errors.push('Câu trắc nghiệm cần ít nhất 2 đáp án (A, B...).');
      }
      if (!raw.correct || raw.correct.length === 0) {
        errors.push('Chưa xác định đáp án đúng.');
      }
      if (raw.type === 'SINGLE' && raw.correct && raw.correct.length > 1) {
        errors.push('Câu hỏi SINGLE chỉ được có 1 đáp án đúng.');
      }
    }

    // Check duplicate against existing
    const norm = raw.content.trim().toLowerCase();
    const duplicate = existingQuestions.find(e => e.content.trim().toLowerCase() === norm);

    return {
      raw,
      isValid: errors.length === 0,
      errors,
      isDuplicate: !!duplicate,
      duplicateQuestionId: duplicate?.id
    };
  });

  const validCount = previewItems.filter(i => i.isValid).length;
  const errorCount = previewItems.filter(i => !i.isValid).length;
  const duplicateCount = previewItems.filter(i => i.isDuplicate).length;

  return {
    total: previewItems.length,
    validCount,
    errorCount,
    duplicateCount,
    items: previewItems
  };
}
