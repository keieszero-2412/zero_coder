const dotenv = require('dotenv');
const fs = require('fs');

// Load .env
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const GROQ_KEY = envConfig.VITE_GROQ_API_KEY;
const GEMINI_KEY = envConfig.VITE_GEMINI_API_KEY;
const MISTRAL_KEY = envConfig.VITE_MISTRAL_API_KEY;
const OPENROUTER_KEY = envConfig.VITE_OPENROUTER_API_KEY;

async function testGroq() {
  console.log('\n--- 1. Testing Groq API ---');
  if (!GROQ_KEY) return console.log('No GROQ_KEY');

  // First fetch available models on Groq
  try {
    const listRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${GROQ_KEY}` }
    });
    if (!listRes.ok) {
      console.log('Groq models list failed:', listRes.status, await listRes.text());
    } else {
      const data = await listRes.json();
      console.log('Groq active models count:', data.data?.length);
      const sampleModels = data.data?.map(m => m.id).slice(0, 10);
      console.log('Sample Groq models:', sampleModels);
    }
  } catch (e) {
    console.log('Groq list error:', e.message);
  }

  // Try calling Groq with llama-3.3-70b-versatile or current models
  const testModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  for (const model of testModels) {
    try {
      const start = Date.now();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 20
        })
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        console.log(`✅ Groq [${model}] SUCCESS (${elapsed}ms):`, json.choices[0]?.message?.content);
      } else {
        const err = await res.text();
        console.log(`❌ Groq [${model}] FAILED (${res.status}):`, err.substring(0, 120));
      }
    } catch (e) {
      console.log(`❌ Groq [${model}] ERROR:`, e.message);
    }
  }
}

async function testGemini() {
  console.log('\n--- 2. Testing Gemini API ---');
  if (!GEMINI_KEY) return console.log('No GEMINI_KEY');

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
  for (const m of models) {
    try {
      const start = Date.now();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello in 3 words' }] }]
        })
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log(`✅ Gemini [${m}] SUCCESS (${elapsed}ms):`, text?.trim());
      } else {
        const err = await res.text();
        console.log(`❌ Gemini [${m}] FAILED (${res.status}):`, err.substring(0, 150));
      }
    } catch (e) {
      console.log(`❌ Gemini [${m}] ERROR:`, e.message);
    }
  }
}

async function testMistral() {
  console.log('\n--- 3. Testing Mistral API ---');
  if (!MISTRAL_KEY) return console.log('No MISTRAL_KEY');

  const models = ['mistral-small-latest', 'open-mistral-7b'];
  for (const model of models) {
    try {
      const start = Date.now();
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${MISTRAL_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 20
        })
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        console.log(`✅ Mistral [${model}] SUCCESS (${elapsed}ms):`, json.choices[0]?.message?.content);
      } else {
        const err = await res.text();
        console.log(`❌ Mistral [${model}] FAILED (${res.status}):`, err.substring(0, 120));
      }
    } catch (e) {
      console.log(`❌ Mistral [${model}] ERROR:`, e.message);
    }
  }
}

async function testOpenRouter() {
  console.log('\n--- 4. Testing OpenRouter API ---');
  if (!OPENROUTER_KEY) return console.log('No OPENROUTER_KEY');

  const models = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'mistralai/mistral-7b-instruct:free'
  ];
  for (const model of models) {
    try {
      const start = Date.now();
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Say hello in 3 words' }],
          max_tokens: 20
        })
      });
      const elapsed = Date.now() - start;
      if (res.ok) {
        const json = await res.json();
        console.log(`✅ OpenRouter [${model}] SUCCESS (${elapsed}ms):`, json.choices[0]?.message?.content?.trim());
      } else {
        const err = await res.text();
        console.log(`❌ OpenRouter [${model}] FAILED (${res.status}):`, err.substring(0, 120));
      }
    } catch (e) {
      console.log(`❌ OpenRouter [${model}] ERROR:`, e.message);
    }
  }
}

async function main() {
  await testGroq();
  await testGemini();
  await testMistral();
  await testOpenRouter();
}

main();
