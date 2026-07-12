#!/usr/bin/env python3
import os
import re
import json
import urllib.request
import urllib.error

API_KEY = os.environ.get('ARK_API_KEY')
API_URL = os.environ.get('ARK_API_URL', 'https://ark.cn-beijing.volces.com/api/v3/chat/completions')
MODEL = os.environ.get('ARK_MODEL')

def extract_chinese_strings(content):
    chinese_pattern = re.compile(r'[\u4e00-\u9fff]+')
    matches = chinese_pattern.findall(content)
    return list(set(matches))

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def translate_text(text, target_lang='en'):
    if not API_KEY:
        raise RuntimeError('ARK_API_KEY is not configured')
    if not MODEL:
        raise RuntimeError('ARK_MODEL is not configured')

    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {API_KEY}'
        }
        
        data = {
            'model': MODEL,
            'messages': [
                {
                    'role': 'system',
                    'content': f'You are a professional translator. Translate the following text to {target_lang}. Keep the original meaning and tone.'
                },
                {
                    'role': 'user',
                    'content': text
                }
            ],
            'temperature': 0.3,
            'max_tokens': 1000
        }
        
        request = urllib.request.Request(
            API_URL,
            data=json.dumps(data).encode('utf-8'),
            headers=headers
        )
        
        with urllib.request.urlopen(request) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
            
    except urllib.error.URLError as e:
        print(f'API 请求错误: {e}')
        return f'[翻译失败: {text}]'
    except Exception as e:
        print(f'翻译错误: {e}')
        return f'[翻译失败: {text}]'

def translate_batch(texts, target_lang='en'):
    results = []
    for i, text in enumerate(texts, 1):
        print(f'   正在翻译 {i}/{len(texts)}...', end='\r')
        translation = translate_text(text, target_lang)
        results.append({
            'original': text,
            'translation': translation
        })
    print('   翻译完成!                ')
    return results

def run_demo():
    print('=' * 60)
    print('AI i18n 工具 - 第一个 Demo (Python 版本)')
    print('=' * 60)
    
    test_file = os.path.join(os.path.dirname(__file__), 'examples', 'TestComponent.jsx')
    print('\n1. 读取测试文件...')
    print(f'   文件路径: {test_file}')
    
    try:
        content = read_file(test_file)
        chinese_strings = extract_chinese_strings(content)
        
        print('\n2. 扫描中文字符串...')
        print(f'   找到 {len(chinese_strings)} 个中文字符串:')
        for i, s in enumerate(chinese_strings, 1):
            print(f'   {i}. {s}')
        
        print('\n3. 开始翻译 (中文 → 英文)...')
        translations = translate_batch(chinese_strings, 'en')
        
        print('\n4. 翻译结果:')
        print('-' * 60)
        for i, item in enumerate(translations, 1):
            print(f'\n   原文 [{i}]: {item["original"]}')
            print(f'   翻译 [{i}]: {item["translation"]}')
        
        print('\n' + '=' * 60)
        print('Demo 完成！')
        print('=' * 60)
        
    except Exception as e:
        print(f'\n错误: {e}')

if __name__ == '__main__':
    run_demo()
