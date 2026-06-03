import { scanFile } from './extractor.js';
import { translateBatch } from './api.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runDemo() {
  console.log('=' .repeat(60));
  console.log('AI i18n 工具 - 第一个 Demo');
  console.log('=' .repeat(60));
  
  const testFile = path.resolve(__dirname, '../examples/TestComponent.jsx');
  console.log('\n1. 读取测试文件...');
  console.log(`   文件路径: ${testFile}`);
  
  try {
    const scanResult = await scanFile(testFile);
    console.log('\n2. 扫描中文字符串...');
    console.log(`   找到 ${scanResult.chineseStrings.length} 个中文字符串:`);
    scanResult.chineseStrings.forEach((str, index) => {
      console.log(`   ${index + 1}. ${str}`);
    });
    
    console.log('\n3. 开始翻译 (中文 → 英文)...');
    console.log('   请稍候...\n');
    
    const translations = await translateBatch(scanResult.chineseStrings, 'en');
    
    console.log('4. 翻译结果:');
    console.log('-' .repeat(60));
    translations.forEach((item, index) => {
      console.log(`\n   原文 [${index + 1}]: ${item.original}`);
      console.log(`   翻译 [${index + 1}]: ${item.translation}`);
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('Demo 完成！');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n错误:', error.message);
  }
}

runDemo();
