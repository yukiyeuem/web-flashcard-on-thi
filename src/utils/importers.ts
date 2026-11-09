/**
 * Standardized Import Parser and Validator (ADD-13, ADD-14, BR-41, BR-42, BR-43)
 * Supports Word (.docx), PDF (.pdf), Text (.txt, .md), and JSON (.json)
 */

// @ts-ignore
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { ImportPreviewItem, ImportReport, IntermediateQuestion, Question } from '../types';

// Set up pdf.js worker
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  // worker fallback
}

/**
 * Extract clean textual content from any uploaded file (.docx, .pdf, .txt, .json)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Word Document (.docx)
  if (fileName.endsWith('.docx')) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  // 2. PDF Document (.pdf)
  if (fileName.endsWith('.pdf')) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += pageText + '\n\n';
      }
      return fullText;
    } catch (err: any) {
      console.warn('PDF parsing fallback', err);
      // Fallback: try reading as text
      return await file.text();
    }
  }

  // 3. Plain Text, Markdown, JSON, CSV
  return await file.text();
}

/**
 * Parses and validates raw text into standardized IntermediateQuestion structures
 */
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

  // Textual format parser (DOCX, PDF text, TXT, MD)
  if (intermediateList.length === 0) {
    // Split into question blocks
    const blocks = trimmed.split(/\n\s*\n|\n(?=(?:Câu\s+\d+|Question\s+\d+|Thẻ\s+\d+|Flashcard\s+\d+):?)/i);

    blocks.forEach(block => {
      const text = block.trim();
      if (!text) return;

      // Check if it's a Flashcard block (Front / Back)
      if (/mặt\s*trước|front\s*:/i.test(text) && /mặt\s*sau|back\s*:/i.test(text)) {
        const frontMatch = text.match(/(?:mặt\s*trước|front):\s*([\s\S]*?)(?=(?:mặt\s*sau|back):)/i);
        const backMatch = text.match(/(?:mặt\s*sau|back):\s*([\s\S]*?)(?=(?:giải\s*thích|note|lưu\s*ý):|$)/i);
        const expMatch = text.match(/(?:giải\s*thích|note|lưu\s*ý):\s*([\s\S]*)$/i);

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
        const ansMatch = line.match(/^(?:đáp\s*án|answer|key|correct):\s*([A-Za-z,\s]+)$/i);
        const expMatch = line.match(/^(?:giải\s*thích|explanation|lưu\s*ý|note):\s*(.*)$/i);

        if (ansMatch) {
          correct = ansMatch[1].toUpperCase().split(/[,\s]+/).filter(Boolean);
        } else if (expMatch) {
          explanation = expMatch[1];
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
          // Question text
          content += (content ? '\n' : '') + line.replace(/^(?:Câu|Question)\s*\d+[\.\:\-]\s*/i, '');
        }
      }

      const isMulti = correct.length > 1;
      const type = options.length > 0 ? (isMulti ? 'MULTI' : 'SINGLE') : 'FLASHCARD';

      if (content.trim()) {
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
      }
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
