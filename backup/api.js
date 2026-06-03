import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env') });

const API_KEY = process.env.ARK_API_KEY;
const API_URL = process.env.ARK_API_URL;
const MODEL = process.env.ARK_MODEL;

export async function translateText(text, targetLang = 'en') {
  if (!API_KEY) {
    throw new Error('ARK_API_KEY is not configured');
  }

  if (!MODEL) {
    throw new Error('ARK_MODEL is not configured');
  }

  if (!API_URL) {
    throw new Error('ARK_API_URL is not configured');
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Keep the original meaning and tone.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Translation error:', error.message);
    throw error;
  }
}

export async function translateBatch(texts, targetLang = 'en') {
  const results = [];
  for (const text of texts) {
    const translation = await translateText(text, targetLang);
    results.push({
      original: text,
      translation: translation
    });
  }
  return results;
}
