import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) envVars[key.trim()] = values.join('=').trim();
});

const geminiKey = envVars['VITE_GEMINI_API_KEY'];
const groqKey = envVars['VITE_GROQ_API_KEY'];
const openRouterKey = envVars['VITE_OPENROUTER_API_KEY'];
const mistralKey = envVars['VITE_MISTRAL_API_KEY'];

async function testGemini() {
  console.log('\n--- Testing Gemini ---');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say hello in 1 word' }] }]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log('Gemini OK:', data.candidates[0].content.parts[0].text.trim());
  } catch (err) {
    console.error('Gemini Error:', err.message);
  }
}

async function testGroq() {
  console.log('\n--- Testing Groq ---');
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${groqKey}` }
    });
    const data = await res.json();
    const models = data.data.map(m => m.id);
    console.log('Available Groq Models:', models.slice(0, 10).join(', '));
    // Let's test the first one
    if (models.length > 0) {
      const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({ model: 'groq/compound', messages: [{ role: 'user', content: 'Say hello' }] })
      });
      const chatData = await chatRes.json();
      console.log(`Groq test with groq/compound:`, JSON.stringify(chatData));
    }
  } catch (err) {
    console.error('Groq Error:', err.message);
  }
}

async function testOpenRouter() {
  console.log('\n--- Testing OpenRouter ---');
  try {
    const chatRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openRouterKey}` },
      body: JSON.stringify({ model: 'openrouter/auto', messages: [{ role: 'user', content: 'Say hello' }] })
    });
    const chatData = await chatRes.json();
    console.log(`OpenRouter test with auto OK:`, JSON.stringify(chatData));
  } catch (err) {
    console.error('OpenRouter Error:', err.message);
  }
}

async function testMistral() {
  console.log('\n--- Testing Mistral ---');
  try {
    const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: 'Say hello in 1 word' }],
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    console.log('Mistral OK:', data.choices[0].message.content);
  } catch (err) {
    console.error('Mistral Error:', err.message);
  }
}

async function run() {
  await testGemini();
  await testGroq();
  await testOpenRouter();
  await testMistral();
}

run();
