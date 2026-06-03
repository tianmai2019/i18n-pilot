import fs from 'fs/promises';
import path from 'path';

export function extractChineseStrings(content) {
  const chinesePattern = /[\u4e00-\u9fff]+/g;
  const matches = content.match(chinesePattern);
  return matches ? [...new Set(matches)] : [];
}

export async function readFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

export async function scanFile(filePath) {
  const content = await readFile(filePath);
  const chineseStrings = extractChineseStrings(content);
  return {
    filePath,
    content,
    chineseStrings
  };
}
