import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import fetch from 'node-fetch'; // if needed, but modern node has global fetch

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    env[key.trim()] = rest.join('=').trim();
  }
});

async function testGemini() {
  console.log("Testing Gemini...");
  try {
    const aiClient = new GoogleGenAI({ apiKey: env.VITE_GEMINI_API_KEY });
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: 'Hello, respond with exactly "Gemini OK".',
    });
    console.log("✅ Gemini:", response.text);
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
  }
}

async function testGroq() {
  console.log("Testing Groq...");
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'groq/compound', // updated model
        messages: [{ role: 'user', content: 'Hello, respond with exactly "Groq OK".' }]
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${await response.text()}`);
    const data = await response.json();
    console.log("✅ Groq:", data.choices[0].message.content);
  } catch (error) {
    console.error("❌ Groq Error:", error.message);
  }
}

async function testMistral() {
  console.log("Testing Mistral...");
  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.VITE_MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'Hello, respond with exactly "Mistral OK".' }]
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${await response.text()}`);
    const data = await response.json();
    console.log("✅ Mistral:", data.choices[0].message.content);
  } catch (error) {
    console.error("❌ Mistral Error:", error.message);
  }
}

async function testOpenRouter() {
  console.log("Testing OpenRouter...");
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.VITE_OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [{ role: 'user', content: 'Hello, respond with exactly "OpenRouter OK".' }]
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${await response.text()}`);
    const data = await response.json();
    console.log("✅ OpenRouter:", data.choices[0].message.content);
  } catch (error) {
    console.error("❌ OpenRouter Error:", error.message);
  }
}

async function runAll() {
  await testGemini();
  await testGroq();
  await testOpenRouter();
  await testMistral();
}

runAll();
