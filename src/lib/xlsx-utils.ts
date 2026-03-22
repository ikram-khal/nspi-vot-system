import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ImportResult {
  added: number;
  skipped: number;
  members: { name: string; pin: string }[];
}

export function parseXlsx(file: File): Promise<{ name: string; pin: string }[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        // Skip header row
        const members = rows.slice(1)
          .filter(r => r[0] && r[1])
          .map(r => ({ name: String(r[0]).trim(), pin: String(r[1]).trim() }));
        resolve(members);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Аты-жөни', 'PIN'],
    ['Ибрагимов Алишер Бахтиярович', '1001'],
    ['Каримова Гулнора Рустамовна', '1002'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 35 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Ағзалар');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf]), 'agzalar_shablon.xlsx');
}
