import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env'));

const promptFix = `
You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
- DO NOT explain anything. ONLY return the code block.

A student is working on the following problem.

### Problem Title:
1. The Scroll (String)

### Student's Current Code:
\`\`\`python
def process_scroll(spell):
    length = len(spell)
    return length
\`\`\`

### Failing Test Results:
Test Case 1:
Code: print(process_scroll("abracadabra"))
Expected: (11, 5, 'cbrccdcbrc', 'crbcdcccrbc')
Got: 11

The user wants you to FIX their code so that it passes ALL test cases. You MUST return ONLY the fully fixed code wrapped in a \`\`\`python code block. DO NOT output any explanation, hints, or markdown text outside the code block. Your entire response must be just the code block.
`;

async function testAll() {
  console.log('Testing Groq qwen3.8-27b...');
  const resGroq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.VITE_GROQ_API_KEY}` },
    body: JSON.stringify({ model: 'qwen/qwen3.8-27b', messages: [{ role: 'user', content: promptFix }] })
  });
  const dataGroq = await resGroq.json();
  console.log('GROQ RESPONSE:\n', dataGroq.choices?.[0]?.message);

  console.log('\nTesting Groq gpt-oss-120b...');
  const resOss = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.VITE_GROQ_API_KEY}` },
    body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: [{ role: 'user', content: promptFix }] })
  });
  const dataOss = await resOss.json();
  console.log('GPT-OSS RESPONSE:\n', dataOss.choices?.[0]?.message);

  console.log('\nTesting Gemini 3.5 Flash Lite...');
  const resGemini = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.VITE_GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: promptFix }] }] })
  });
  const dataGemini = await resGemini.json();
  console.log('GEMINI RESPONSE:\n', JSON.stringify(dataGemini.candidates?.[0]?.content?.parts, null, 2));
}

testAll().catch(console.error);
