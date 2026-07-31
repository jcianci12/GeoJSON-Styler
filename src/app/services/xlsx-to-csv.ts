import * as XLSX from 'xlsx';

/**
 * Reads an XLSX (Excel) file and converts first sheet to CSV string.
 * Returns null for non-XLSX files.
 */
export function xlsxFileToCsvString(file: File): Promise<string> {
  const ext = getFileExtension(file.name);
  if (ext !== 'xlsx' && ext !== 'xls') {
    return Promise.reject(new Error(`Not an Excel file: .${ext}`));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet, { FS: ',' });
        resolve(csv);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function getFileExtension(filename: string): string {
  const match = /^.+\.([^.]+)$/.exec(filename.toLowerCase());
  return match ? match[1] : '';
}
