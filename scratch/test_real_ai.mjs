import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));
for (const k in env) {
  process.env[k] = env[k];
}
// Also mock import.meta.env for Vite code
globalThis.importMetaEnv = env;

// Read aiService.js and run test
async function testDirect() {
  const problems = JSON.parse(fs.readFileSync('public/problems.json', 'utf8'));
  const prob = problems.find(p => p.id === 'tin314_p1_q1');

  // Direct fetch using Groq with qwen/qwen3.8-27b
  const prompt = `You are an AI assistant named "Zero".
A student is working on 1. The Scroll (String).
Student's current code:
def process_scroll(spell):
    length = len(spell)
    count_a = spell.count('a')
    replaced = spell.replace('a', 'c')
    reversed_str = replaced[::-1]
    return length, count_a, reversed_str

The user wants you to FIX their code so that it passes ALL test cases. You MUST return ONLY the fully fixed code wrapped in a \`\`\`python code block.`;

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
  console.log('Choices message:', JSON.stringify(data.choices?.[0]?.message, null, 2));
}

testDirect().catch(console.error);
