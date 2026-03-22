import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface ReportQuestion {
  text: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
}

interface ReportData {
  protocolNumber: string;
  date: string;
  attendees: string[];
  questions: ReportQuestion[];
}

export async function generateReport(data: ReportData) {
  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

  const sections: Paragraph[] = [];

  // Title
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'ЖАСЫРЫН ДАЎЫС БЕРИЎ НӘТИЙЖЕЛЕРИ', bold: true, size: 28, font: 'Times New Roman' })],
  }));

  sections.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Мәжилис №${data.protocolNumber}, Сәне: ${data.date}`, size: 24, font: 'Times New Roman' })],
  }));

  sections.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Қатнасыўшылар саны: ${data.attendees.length}`, size: 24, font: 'Times New Roman' })],
  }));

  // Attendees list
  sections.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: 'Қатнасыўшылар:', bold: true, size: 24, font: 'Times New Roman' })],
  }));

  const sorted = [...data.attendees].sort();
  sorted.forEach((name, i) => {
    sections.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${i + 1}. ${name}`, size: 24, font: 'Times New Roman' })],
    }));
  });

  // Questions
  data.questions.forEach((q, qi) => {
    const total = q.votes_for + q.votes_against + q.votes_abstain;
    const verdict = q.votes_for > q.votes_against ? 'ҚАРАР ҚАБЫЛ ЕТИЛДИ' :
      q.votes_for < q.votes_against ? 'ҚАРАР ҚАБЫЛ ЕТИЛМЕДИ' : 'ДАЎЫСЛАР ТЕҢ';

    sections.push(new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: `${qi + 1}-мәселе: ${q.text}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));

    const makeCell = (text: string, bold = false) => new TableCell({
      borders,
      width: { size: 2340, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 24, font: 'Times New Roman' })] })],
    });

    sections.push(new Paragraph({ children: [] })); // spacer

    const table = new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      rows: [
        new TableRow({ children: [makeCell('Қосыламан', true), makeCell('Қарсыман', true), makeCell('Бийтәреп', true), makeCell('Жәми', true)] }),
        new TableRow({ children: [makeCell(String(q.votes_for)), makeCell(String(q.votes_against)), makeCell(String(q.votes_abstain)), makeCell(String(total))] }),
      ],
    });

    sections.push(new Paragraph({ children: [] }));

    sections.push(new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [new TextRun({ text: `Нәтийже: ${verdict}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));
  });

  // Signatures
  sections.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  sections.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Баслық: ____________________', size: 24, font: 'Times New Roman' })],
  }));
  sections.push(new Paragraph({
    children: [new TextRun({ text: 'Хаткер: ____________________', size: 24, font: 'Times New Roman' })],
  }));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Times New Roman', size: 24 } } },
    },
    sections: [{ children: [...sections, table!].filter(Boolean) }],
  });

  // Hmm, table is used inside the loop. Let me restructure.
  // Actually let me just build all children properly.
  const allChildren: (Paragraph | Table)[] = [];

  // Re-build properly
  allChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'ЖАСЫРЫН ДАЎЫС БЕРИЎ НӘТИЙЖЕЛЕРИ', bold: true, size: 28, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Мәжилис №${data.protocolNumber}, Сәне: ${data.date}`, size: 24, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: `Қатнасыўшылар саны: ${data.attendees.length}`, size: 24, font: 'Times New Roman' })],
  }));

  allChildren.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: 'Қатнасыўшылар:', bold: true, size: 24, font: 'Times New Roman' })],
  }));

  sorted.forEach((name, i) => {
    allChildren.push(new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: `${i + 1}. ${name}`, size: 24, font: 'Times New Roman' })],
    }));
  });

  data.questions.forEach((q, qi) => {
    const total = q.votes_for + q.votes_against + q.votes_abstain;
    const verdict = q.votes_for > q.votes_against ? 'ҚАРАР ҚАБЫЛ ЕТИЛДИ' :
      q.votes_for < q.votes_against ? 'ҚАРАР ҚАБЫЛ ЕТИЛМЕДИ' : 'ДАЎЫСЛАР ТЕҢ';

    allChildren.push(new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: `${qi + 1}-мәселе: ${q.text}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));

    const makeCell = (text: string, bold = false) => new TableCell({
      borders,
      width: { size: 2340, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 24, font: 'Times New Roman' })] })],
    });

    allChildren.push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 2340, 2340],
      rows: [
        new TableRow({ children: [makeCell('Қосыламан', true), makeCell('Қарсыман', true), makeCell('Бийтәреп', true), makeCell('Жәми', true)] }),
        new TableRow({ children: [makeCell(String(q.votes_for)), makeCell(String(q.votes_against)), makeCell(String(q.votes_abstain)), makeCell(String(total))] }),
      ],
    }));

    allChildren.push(new Paragraph({
      spacing: { before: 100, after: 200 },
      children: [new TextRun({ text: `Нәтийже: ${verdict}`, bold: true, size: 24, font: 'Times New Roman' })],
    }));
  });

  allChildren.push(new Paragraph({ spacing: { before: 400 }, children: [] }));
  allChildren.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Баслық: ____________________', size: 24, font: 'Times New Roman' })],
  }));
  allChildren.push(new Paragraph({
    children: [new TextRun({ text: 'Хаткер: ____________________', size: 24, font: 'Times New Roman' })],
  }));

  const finalDoc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
    sections: [{ children: allChildren }],
  });

  const blob = await Packer.toBlob(finalDoc);
  saveAs(blob, `protocol_${data.protocolNumber}_${data.date}.docx`);
}
