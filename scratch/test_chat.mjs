import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));

async function testChat() {
  const prompt = `You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
A student is working on 1. The Scroll (String).
Student code:
def process_scroll(spell):
    length = len(spell)
    return length

User message: Phân tích giúp mình xem code này sai ở đâu?`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  console.log('Result:\n', data.choices?.[0]?.message?.content);
}

testChat().catch(console.error);
