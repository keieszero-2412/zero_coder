import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const apiKey = envContent.match(/VITE_GEMINI_API_KEY=(.*)/)?.[1]?.trim();
const ai = new GoogleGenAI({ apiKey });

// Test gemini-3.6-flash specifically
try {
  console.log('Testing gemini-3.6-flash...');
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: 'Say hello in Vietnamese, just one short sentence.',
  });
  console.log(`✅ Works! Response: ${response.text}`);
} catch (error) {
  console.log(`❌ Failed: Status ${error?.status}`);
  console.log(`   Message: ${error?.message?.substring(0, 300)}`);
}
