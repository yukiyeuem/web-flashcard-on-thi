/**
 * Standardized Import Parser and Validator (ADD-13, ADD-14, BR-41, BR-42, BR-43)
 * Supports Word (.docx), PDF (.pdf), Text (.txt, .md), and JSON (.json)
 * Handles un-keyed dumps (e.g. Oracle 1Z0-083, AWS, Azure, CompTIA dumps)
 */

// @ts-ignore
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { ImportPreviewItem, ImportReport, IntermediateQuestion, Question } from '../types';

// Set up pdf.js worker with reliable local fallback
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    // Attempt CDN worker with version alignment or unpkg
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
  }
} catch {
  // worker fallback mode
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
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        useSystemFonts: true
      });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          if (!item.str) continue;
          
          // If vertical position changes significantly or item has EOL, add newline
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageStr += '\n' + item.str;
          } else {
            pageStr += (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n') ? ' ' : '') + item.str;
          }
          lastY = item.transform[5];
        }

        fullText += '\n\n' + pageStr;
      }
      return fullText;
    } catch (err: any) {
      console.warn('PDF parsing error, attempting text fallback', err);
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

  // 1. Try JSON first
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
          source: 'DOCX'
        });
      });
    } catch {
      // Fallback to text parser below
    }
  }

  // 2. Textual format parser (DOCX, PDF, TXT, MD)
  if (intermediateList.length === 0) {
    // Regex matching Question headers: Question #1, Question 1, Câu 1, Câu #1, Q1, Thẻ 1
    const questionHeaderRegex = /(?:(?:Question|Câu|Thẻ|Flashcard|Q)\s*(?:#|No\.?|\.)?\s*\d+[\s\.\:\-]*)/i;

    // Split text into question chunks
    // Splitting either by double-newline or right before a Question header
    const rawChunks = trimmed.split(/(?=(?:Question|Câu|Thẻ|Flashcard|Q)\s*(?:#|No\.?|\.)?\s*\d+)/i)
      .map(c => c.trim())
      .filter(c => c.length > 5);

    // If split produced only 1 chunk or failed, fallback to double-newline split
    const blocks = rawChunks.length > 1 ? rawChunks : trimmed.split(/\n\s*\n+/);

    blocks.forEach(block => {
      const text = block.trim();
      if (!text || text.length < 5) return;

      // Case A: Flashcard block (Mặt trước / Mặt sau)
      if (/mặt\s*trước|front\s*:/i.test(text) && /mặt\s*sau|back\s*:/i.test(text)) {
        const frontMatch = text.match(/(?:mặt\s*trước|front):\s*([\s\S]*?)(?=(?:mặt\s*sau|back):)/i);
        const backMatch = text.match(/(?:mặt\s*sau|back):\s*([\s\S]*?)(?=(?:giải\s*thích|explanation|note|lưu\s*ý):|$)/i);
        const expMatch = text.match(/(?:giải\s*thích|explanation|note|lưu\s*ý):\s*([\s\S]*)$/i);

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

      // Case B: Multiple choice / dump question block
      let content = text;
      let correct: string[] = [];
      let explanation = '';

      // Extract explicit Answer / Đáp án line if present
      const ansMatch = content.match(/(?:đáp\s*án|answer|correct\s*answer|key):\s*([A-Za-z,\s]+)/i);
      if (ansMatch) {
        correct = ansMatch[1].toUpperCase().split(/[^A-Z]+/).filter(Boolean);
        content = content.replace(ansMatch[0], '');
      }

      // Extract Explanation / Giải thích line if present
      const expMatch = content.match(/(?:giải\s*thích|explanation|lưu\s*ý|note):\s*([\s\S]*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        content = content.replace(expMatch[0], '');
      }

      // Split question content vs options A, B, C, D, E, F...
      // Handles both separate lines and same-line options separated by spaces
      const optSplitPattern = /(?:^|[\r\n\s]+)(?=[A-Fa-f][\.\)\:\-]\s+)/;
      const pieces = content.split(optSplitPattern).map(p => p.trim()).filter(Boolean);

      let stem = pieces[0] || '';
      // Strip leading "Question #1:", "Câu 1." prefix from the stem if desired
      const qNumMatch = stem.match(/^((?:Question|Câu|Q|Thẻ)\s*(?:#|No\.?|\.)?\s*\d+[\s\.\:\-]*)/i);
      if (qNumMatch) {
        stem = stem.slice(qNumMatch[0].length).trim();
      }

      const options: { key: string; text: string }[] = [];
      for (let i = 1; i < pieces.length; i++) {
        const optMatch = pieces[i].match(/^([A-Fa-f])[\.\)\:\-]\s*([\s\S]*)$/);
        if (optMatch) {
          options.push({
            key: optMatch[1].toUpperCase(),
            text: optMatch[2].trim()
          });
        }
      }

      // Detect if question is multi-choice from stem (e.g. "Choose three", "Choose two", "Chọn 2")
      const isMultiByStem = /(?:choose\s+(?:two|three|four|five|all)|chọn\s+(?:hai|ba|bốn|nhiều|\d+))/i.test(stem);
      const isMulti = correct.length > 1 || isMultiByStem;
      const type = options.length > 0 ? (isMulti ? 'MULTI' : 'SINGLE') : 'FLASHCARD';

      if (stem.trim()) {
        intermediateList.push({
          type,
          content: stem.trim(),
          options,
          correct,
          answer_content: type === 'FLASHCARD' ? explanation || 'Chưa có mặt sau' : null,
          explanation: explanation.trim(),
          topics: defaultTopicId ? [defaultTopicId] : [],
          difficulty: 2,
          source: 'DOCX'
        });
      }
    });
  }

  // 3. Validate each item (BR-42, BR-43)
  const previewItems: ImportPreviewItem[] = intermediateList.map(raw => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!raw.content || raw.content.trim().length === 0) {
      errors.push('Thiếu nội dung câu hỏi hoặc mặt trước thẻ.');
    }

    if (raw.type === 'FLASHCARD') {
      if (!raw.answer_content || raw.answer_content.trim().length === 0) {
        errors.push('Mặt sau Flashcard không được để trống.');
      }
    } else {
      if (!raw.options || raw.options.length < 2) {
        errors.push('Câu trắc nghiệm cần ít nhất 2 phương án (A, B...).');
      }
      // Non-blocking warning if answers are not provided (e.g. practice dumps)
      if (!raw.correct || raw.correct.length === 0) {
        warnings.push('Chưa có đáp án chính thức trong tệp. Hệ thống sẽ lưu dưới dạng bài tập tự luyện (có thể bổ sung sau).');
      }
      if (raw.type === 'SINGLE' && raw.correct && raw.correct.length > 1) {
        warnings.push('Phát hiện nhiều đáp án cho câu Single. Hệ thống đã tự động chuyển sang Multi-choice.');
        raw.type = 'MULTI';
      }
    }

    // Check duplicate against existing
    const norm = raw.content.trim().toLowerCase();
    const duplicate = existingQuestions.find(e => e.content.trim().toLowerCase() === norm);

    return {
      raw,
      isValid: errors.length === 0,
      errors,
      warnings,
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
