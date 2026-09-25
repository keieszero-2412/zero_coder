import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));

async function testThink() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VITE_GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen/qwen3.8-27b',
      messages: [{ role: 'user', content: 'Solve this in Python: reverse a string' }]
    })
  });
  const data = await res.json();
  console.log('Full choice 0:', JSON.stringify(data.choices?.[0], null, 2));
}

testThink().catch(console.error);
