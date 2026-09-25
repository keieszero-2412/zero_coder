const dotenv = require('dotenv');
const fs = require('fs');
const env = dotenv.parse(fs.readFileSync('.env'));

async function testPythonCodingPrompt() {
  console.log('=== TESTING PYTHON CODE GENERATION ON ACTIVE PROVIDERS ===');

  const prompt = `You are a Python programming assistant. Write a Python function def add_numbers(a, b): that returns the sum of a and b. Return ONLY the code block.`;

  // 1. Groq (qwen/qwen3.8-27b)
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });
    const d = await res.json();
    console.log(`\n1. Groq (qwen/qwen3.8-27b) [${Date.now() - t0}ms]:\n`, d.choices?.[0]?.message?.content);
  } catch (e) {
    console.log('Groq error:', e.message);
  }

  // 2. Gemini (gemini-3.5-flash-lite)
  try {
    const t0 = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.VITE_GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const d = await res.json();
    console.log(`\n2. Gemini (gemini-3.5-flash-lite) [${Date.now() - t0}ms]:\n`, d.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (e) {
    console.log('Gemini error:', e.message);
  }

  // 3. Mistral (open-mistral-7b)
  try {
    const t0 = Date.now();
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.VITE_MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'open-mistral-7b',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200
      })
    });
    const d = await res.json();
    console.log(`\n3. Mistral (open-mistral-7b) [${Date.now() - t0}ms]:\n`, d.choices?.[0]?.message?.content);
  } catch (e) {
    console.log('Mistral error:', e.message);
  }
}

testPythonCodingPrompt();
