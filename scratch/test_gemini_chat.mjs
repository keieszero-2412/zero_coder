import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));

async function testGeminiChat() {
  const prompt = `You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
A student is working on 1. The Scroll (String).
Student code:
def process_scroll(spell):
    length = len(spell)
    return length

User message: Phân tích giúp mình xem code này sai ở đâu?`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.VITE_GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await res.json();
  console.log('Gemini Result:\n', data.candidates?.[0]?.content?.parts?.[0]?.text);
}

testGeminiChat().catch(console.error);
