/**
 * Exporter utility for Word (.docx) and Adobe PDF (.pdf) (ADD-13, ADD-14)
 * Allows exporting questions and downloading standard formatting templates
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import { Question } from '../types';

/**
 * Trigger browser file download from Blob
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export questions list to Microsoft Word (.docx)
 */
export async function exportQuestionsToDocx(
  examTitle: string,
  examCode: string,
  questions: Question[]
): Promise<void> {
  const docParagraphs: Paragraph[] = [
    new Paragraph({
      text: `${examTitle.toUpperCase()} (${examCode})`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      text: `Tổng số câu hỏi: ${questions.length} câu | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  ];

  questions.forEach((q, idx) => {
    // Question title & stem
    const typeLabel = q.type === 'FLASHCARD' ? 'Thẻ ghi nhớ' : q.type === 'MULTI' ? 'Trắc nghiệm chọn nhiều' : 'Trắc nghiệm';
    docParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${idx + 1} [${typeLabel}]: `, bold: true, color: '1D4ED8' }),
          new TextRun({ text: q.content, bold: true })
        ],
        spacing: { before: 240, after: 120 }
      })
    );

    // Options
    if (q.options && q.options.length > 0) {
      q.options.forEach(opt => {
        const isCorrect = q.correct && q.correct.includes(opt.key);
        docParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `    ${opt.key}. `, bold: true }),
              new TextRun({ text: opt.text })
            ],
            spacing: { after: 60 }
          })
        );
      });
    }

    // Flashcard back
    if (q.type === 'FLASHCARD' && q.answer_content) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `    Mặt sau (Đáp án): `, bold: true, color: '047857' }),
            new TextRun({ text: q.answer_content })
          ],
          spacing: { after: 80 }
        })
      );
    }

    // Correct answer line
    if (q.correct && q.correct.length > 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Đáp án: `, bold: true, color: '047857' }),
            new TextRun({ text: q.correct.join(', '), bold: true, color: '047857' })
          ],
          spacing: { before: 80, after: 80 }
        })
      );
    } else if (q.type !== 'FLASHCARD') {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Đáp án: `, bold: true, color: 'B45309' }),
            new TextRun({ text: `(Chưa có đáp án - Dành cho tự luyện hoặc điền sau)`, italics: true, color: 'B45309' })
          ],
          spacing: { before: 80, after: 80 }
        })
      );
    }

    // Explanation
    if (q.explanation && q.explanation.trim()) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Giải thích: `, bold: true, italics: true }),
            new TextRun({ text: q.explanation, italics: true })
          ],
          spacing: { after: 180 }
        })
      );
    }

    // Separator line
    docParagraphs.push(
      new Paragraph({
        text: '----------------------------------------------------------------------------------------------------',
        alignment: AlignmentType.CENTER,
        spacing: { after: 180 }
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const safeName = examCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'De_thi';
  downloadBlob(blob, `${safeName}_CertFlash.docx`);
}

/**
 * Export questions list to Adobe PDF (.pdf)
 */
export async function exportQuestionsToPdf(
  examTitle: string,
  examCode: string,
  questions: Question[]
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      pdf.addPage();
      cursorY = 20;
    }
  };

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(`${examTitle.toUpperCase()} (${examCode})`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 7;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Tong so cau hoi: ${questions.length} cau | Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 10;
  pdf.setTextColor(0);

  questions.forEach((q, idx) => {
    checkPageBreak(35);

    // Question Number & Stem
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(29, 78, 216); // blue
    const qHeader = `Cau ${idx + 1} (${q.type}): `;
    pdf.text(qHeader, margin, cursorY);
    const headerWidth = pdf.getTextWidth(qHeader);

    pdf.setTextColor(20, 20, 20);
    // Wrap question stem
    const stemLines = pdf.splitTextToSize(q.content, contentWidth - headerWidth);
    pdf.text(stemLines[0] || '', margin + headerWidth, cursorY);
    cursorY += 5;

    if (stemLines.length > 1) {
      for (let i = 1; i < stemLines.length; i++) {
        checkPageBreak(6);
        pdf.text(stemLines[i], margin, cursorY);
        cursorY += 5;
      }
    }

    cursorY += 2;

    // Options
    if (q.options && q.options.length > 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      q.options.forEach(opt => {
        checkPageBreak(6);
        const optText = `${opt.key}. ${opt.text}`;
        const optLines = pdf.splitTextToSize(optText, contentWidth - 8);
        optLines.forEach((line: string) => {
          pdf.text(line, margin + 5, cursorY);
          cursorY += 4.5;
        });
      });
    }

    // Flashcard back
    if (q.type === 'FLASHCARD' && q.answer_content) {
      checkPageBreak(6);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(4, 120, 87);
      pdf.text(`Mat sau: ${q.answer_content}`, margin + 5, cursorY);
      cursorY += 5;
      pdf.setTextColor(0);
    }

    // Answers
    checkPageBreak(10);
    pdf.setFont('helvetica', 'bold');
    if (q.correct && q.correct.length > 0) {
      pdf.setTextColor(4, 120, 87);
      pdf.text(`Dap an: ${q.correct.join(', ')}`, margin, cursorY);
    } else {
      pdf.setTextColor(180, 83, 9);
      pdf.text(`Dap an: (Chua co dap an - bai tap tu luyen)`, margin, cursorY);
    }
    cursorY += 5;
    pdf.setTextColor(0);

    // Explanation
    if (q.explanation && q.explanation.trim()) {
      checkPageBreak(6);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.setTextColor(80);
      const expLines = pdf.splitTextToSize(`Giai thich: ${q.explanation}`, contentWidth);
      expLines.forEach((line: string) => {
        pdf.text(line, margin, cursorY);
        cursorY += 4;
      });
      pdf.setTextColor(0);
    }

    // Line separator
    cursorY += 2;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, cursorY, pageWidth - margin, cursorY);
    cursorY += 6;
  });

  const safeName = examCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'De_thi';
  pdf.save(`${safeName}_CertFlash.pdf`);
}

/**
 * Download sample template files in .docx, .pdf or .txt
 */
export async function downloadSampleTemplate(format: 'docx' | 'pdf' | 'txt'): Promise<void> {
  const sampleQuestions: Question[] = [
    {
      id: 'sample-1',
      exam_id: 'sample',
      type: 'SINGLE',
      content: 'Một công ty cần lưu trữ dữ liệu tệp tin trên AWS có thể mount đồng thời vào hàng trăm máy chủ Linux EC2 instances. Dịch vụ lưu trữ nào phù hợp nhất?',
      options: [
        { key: 'A', text: 'Amazon S3 Standard' },
        { key: 'B', text: 'Amazon Elastic File System (Amazon EFS)' },
        { key: 'C', text: 'Amazon Elastic Block Store (Amazon EBS)' },
        { key: 'D', text: 'AWS Storage Gateway' }
      ],
      correct: ['B'],
      answer_content: null,
      explanation: 'Amazon EFS là hệ thống tệp tin mạng (NFS) được quản lý hoàn toàn, hỗ trợ kết nối đồng thời từ hàng trăm đến hàng nghìn EC2 instances.',
      topics: ['sample-topic'],
      difficulty: 2,
      source: 'DOCX',
      user_id: 'admin',
      version: 1,
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'sample-2',
      exam_id: 'sample',
      type: 'MULTI',
      content: 'Which two configurations are required to establish an Oracle Data Guard physical standby database? (Choose two.)',
      options: [
        { key: 'A', text: 'FORCE LOGGING must be enabled on the primary database.' },
        { key: 'B', text: 'The standby database must have FLASHBACK DATABASE disabled.' },
        { key: 'C', text: 'The primary and standby databases must share the same DB_UNIQUE_NAME.' },
        { key: 'D', text: 'Archivelog mode must be enabled on the primary database.' },
        { key: 'E', text: 'The COMPATIBLE initialization parameter must be set to 10.2 or lower.' }
      ],
      correct: ['A', 'D'],
      answer_content: null,
      explanation: 'FORCE LOGGING and ARCHIVELOG mode are fundamental requirements for the primary database in Oracle Data Guard.',
      topics: ['sample-topic'],
      difficulty: 3,
      source: 'DOCX',
      user_id: 'admin',
      version: 1,
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'sample-3',
      exam_id: 'sample',
      type: 'FLASHCARD',
      content: 'Mặt trước: Vai trò chính của Oracle ASM (Automatic Storage Management) là gì?',
      options: [],
      correct: [],
      answer_content: 'Mặt sau: ASM là hệ thống tệp và trình quản lý phân vùng đĩa ảo hóa tích hợp dành cho Oracle Database, cung cấp khả năng tự động cân bằng I/O (striping) và nhân bản đĩa (mirroring).',
      explanation: 'Giải thích: Giúp đơn giản hóa quản trị đĩa lưu trữ cho các cơ sở dữ liệu quy mô lớn và RAC.',
      topics: ['sample-topic'],
      difficulty: 2,
      source: 'DOCX',
      user_id: 'admin',
      version: 1,
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ];

  if (format === 'docx') {
    await exportQuestionsToDocx('BẢNG MẪU ĐỊNH DẠNG ĐỀ THI & FLASHCARD CHUẨN', 'CERTFLASH-TEMPLATE', sampleQuestions);
  } else if (format === 'pdf') {
    await exportQuestionsToPdf('BẢNG MẪU ĐỊNH DẠNG ĐỀ THI & FLASHCARD CHUẨN', 'CERTFLASH-TEMPLATE', sampleQuestions);
  } else {
    // TXT format
    const textContent = `CÂU HỎI MẪU ĐỊNH DẠNG CERTFLASH (HỖ TRỢ WORD .DOCX, PDF, TXT)
====================================================================

Câu 1: Một công ty cần lưu trữ dữ liệu tệp tin trên AWS có thể mount đồng thời vào hàng trăm máy chủ Linux EC2 instances. Dịch vụ lưu trữ nào phù hợp nhất?
A. Amazon S3 Standard
B. Amazon Elastic File System (Amazon EFS)
C. Amazon Elastic Block Store (Amazon EBS)
D. AWS Storage Gateway
Đáp án: B
Giải thích: Amazon EFS là hệ thống tệp tin mạng (NFS) được quản lý hoàn toàn, hỗ trợ kết nối đồng thời từ hàng trăm đến hàng nghìn EC2 instances.

--------------------------------------------------------------------

Question #2: Which two configurations are required to establish an Oracle Data Guard physical standby database? (Choose two.)
A. FORCE LOGGING must be enabled on the primary database.
B. The standby database must have FLASHBACK DATABASE disabled.
C. The primary and standby databases must share the same DB_UNIQUE_NAME.
D. Archivelog mode must be enabled on the primary database.
E. The COMPATIBLE initialization parameter must be set to 10.2 or lower.
Answer: A, D
Explanation: FORCE LOGGING and ARCHIVELOG mode are fundamental requirements for the primary database in Oracle Data Guard.

--------------------------------------------------------------------

Thẻ ghi nhớ:
Mặt trước: Vai trò chính của Oracle ASM (Automatic Storage Management) là gì?
Mặt sau: ASM là hệ thống tệp và trình quản lý phân vùng đĩa ảo hóa tích hợp dành cho Oracle Database, cung cấp khả năng tự động cân bằng I/O (striping) và nhân bản đĩa (mirroring).
Giải thích: Giúp đơn giản hóa quản trị đĩa lưu trữ cho các cơ sở dữ liệu quy mô lớn và RAC.
`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'CertFlash_Sample_Template.txt');
  }
}
