import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const parseFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const fileType = file.name.split('.').pop()?.toLowerCase();

  if (fileType === 'docx') {
    return extractTextFromDocx(arrayBuffer);
  } else if (fileType === 'xlsx' || fileType === 'xls') {
    return extractTextFromExcel(arrayBuffer);
  } else {
    throw new Error('فرمت فایل پشتیبانی نمی‌شود. لطفاً فایل Word (.docx) یا Excel (.xlsx) آپلود کنید.');
  }
};

const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Docx parsing error:', error);
    throw new Error('خطا در خواندن فایل Word.');
  }
};

const extractTextFromExcel = (arrayBuffer: ArrayBuffer): string => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      // Convert sheet to text (tab separated values)
      const sheetText = XLSX.utils.sheet_to_txt(sheet);
      text += `--- Sheet: ${sheetName} ---\n${sheetText}\n`;
    });
    
    return text;
  } catch (error) {
    console.error('Excel parsing error:', error);
    throw new Error('خطا در خواندن فایل Excel.');
  }
};