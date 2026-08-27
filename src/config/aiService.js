import { GoogleGenAI } from '@google/genai';

// =============================================
// Multi-Provider AI Service with Auto-Fallback
// =============================================
// Supported providers: Gemini, Groq, Mistral, Cerebras
// When one provider hits rate limit, automatically switches to the next.

// --- Provider Configuration ---
const providers = [];

// 1. Gemini (Google)
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (geminiKey) {
  providers.push({
    name: 'Gemini',
    type: 'gemini',
    model: 'gemini-3.6-flash',
    apiKey: geminiKey,
    client: new GoogleGenAI({ apiKey: geminiKey }),
  });
}

// 2. Groq (Llama 3.3 70B - very fast)
const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
if (groqKey) {
  providers.push({
    name: 'Groq',
    type: 'openai-compatible',
    model: 'groq/compound',
    apiKey: groqKey,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  });
}

// 3. OpenRouter (Free Llama/Gemma)
const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
if (openRouterKey) {
  providers.push({
    name: 'OpenRouter',
    type: 'openai-compatible',
    model: 'openrouter/auto',
    apiKey: openRouterKey,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  });
}

// 4. Mistral
const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY || '';
if (mistralKey) {
  providers.push({
    name: 'Mistral',
    type: 'openai-compatible',
    model: 'mistral-small-latest',
    apiKey: mistralKey,
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
  });
}

// --- OpenAI-Compatible API Call ---
async function callOpenAICompatible(provider, systemPrompt, chatHistory, lastMessage) {
  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  // Add chat history
  for (const msg of chatHistory) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Add the current message
  messages.push({ role: 'user', content: lastMessage });

  const response = await fetch(provider.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`${provider.name} API error: ${errorBody.substring(0, 200)}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// --- Gemini API Call ---
async function callGemini(provider, systemPrompt, chatHistory, lastMessage) {
  if (chatHistory.length === 0) {
    // No history: simple generateContent
    const response = await provider.client.models.generateContent({
      model: provider.model,
      contents: `${systemPrompt}\n\nUser message: ${lastMessage}`,
    });
    return response.text;
  }

  // With history: use chat session
  const formattedHistory = chatHistory.slice(0, -1).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = provider.client.chats.create({
    model: provider.model,
    config: {
      systemInstruction: systemPrompt,
    },
    history: formattedHistory,
  });

  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
}

// --- Main Export ---
export async function askAIForHelp(problem, userCode, testResults, chatHistory = [], isFixMode = false) {
  if (providers.length === 0) {
    throw new Error('Chưa cấu hình API Key nào. Vui lòng thêm ít nhất 1 key vào file .env (VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY, VITE_MISTRAL_API_KEY, hoặc VITE_CEREBRAS_API_KEY).');
  }

  // --- Build prompt ---
  const failingTests = testResults.filter(r => !r.passed);
  const isCorrect = testResults.length > 0 && failingTests.length === 0;

  let testContext = "";
  if (isCorrect) {
    testContext = "The student's code is CORRECT and passes all tests! You must tell them their code is absolutely correct. Do NOT look for more errors or suggest optimizations. If the user specifically asks you to 'Fix my code', you MUST return exactly the string 'No error to fix' and nothing else.";
  } else if (failingTests.length > 0) {
    if (isFixMode) {
      testContext = `### Failing Test Results:\n${failingTests.map((r, i) => `Test Case ${i + 1}: Expected ${r.expected}, Got ${r.got || r.error}`).join('\n')}

The user wants you to FIX their code. You MUST return ONLY the fully fixed code wrapped in a \`\`\`python code block. DO NOT output any explanation, hints, or markdown text outside the code block. Your entire response must be just the code block.`;
    } else {
      testContext = `### Failing Test Results:\n${failingTests.map((r, i) => `
Test Case ${i + 1}:
Code: ${r.code}
Expected: ${r.expected}
${r.error ? `Execution Error: ${r.error}` : `Got: ${r.got}`}
`).join('\n')}

Please provide a clear and concise hint. Do NOT just give them the exact correct code. Instead, point out what part of their code is causing the error or logical mistake, and guide them on how to fix it themselves.`;
    }
  } else {
    testContext = "The student hasn't run the tests yet or test results are unavailable. Review the code for obvious logical errors or ask them to run the code to see the results.";
  }

  const systemPrompt = `
You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
IMPORTANT PERSONA RULES:
- Always use the pronoun "mình" to refer to yourself, and "bạn" to refer to the user.
- Do NOT be overly friendly or chatty. Do not use emojis unless necessary.
${isFixMode ? '- DO NOT explain anything. ONLY return the code block.' : '- Provide direct, concise instructions and point out logical errors. Do not write long paragraphs.'}

A student is working on the following problem.

### Problem Title:
${problem.title}

### Problem Description:
${problem.description}

### Student's Current Code:
\`\`\`python
${userCode}
\`\`\`

${testContext}
  `;

  // --- Determine the user message ---
  let userMessage;
  if (chatHistory.length === 0) {
    userMessage = isFixMode ? "Fix my code" : "Help me with this problem";
  } else {
    userMessage = chatHistory[chatHistory.length - 1]?.content || "Help me";
  }

  // --- Try each provider with fallback ---
  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name} (${provider.model})...`);
      
      let resultText;
      if (provider.type === 'gemini') {
        resultText = await callGemini(provider, systemPrompt, chatHistory, userMessage);
      } else {
        resultText = await callOpenAICompatible(provider, systemPrompt, chatHistory, userMessage);
      }

      console.log(`✅ ${provider.name} responded successfully.`);
      return {
        text: resultText,
        providerName: provider.name,
        modelName: provider.model
      };

    } catch (error) {
      const status = error?.status;
      const msg = error?.message || '';

      console.warn(`❌ ${provider.name} failed (Status: ${status}): ${msg.substring(0, 150)}`);
      errors.push({ provider: provider.name, status, message: msg });

      // Auth error for this provider: skip to next
      if (status === 401 || status === 403) {
        continue;
      }

      // Rate limit: skip to next provider immediately  
      if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate')) {
        continue;
      }

      // Other errors (500, network...): also try next
      continue;
    }
  }

  // All providers failed
  console.error("All AI providers failed:", errors);
  
  const allRateLimited = errors.every(e => e.status === 429 || e.message?.includes('429') || e.message?.includes('quota'));
  if (allRateLimited) {
    throw new Error(`Tất cả ${errors.length} hệ thống AI đều đang bị quá tải. Vui lòng đợi khoảng 1 phút rồi thử lại nhé!`);
  }
  
  const providerNames = errors.map(e => `${e.provider} (${e.status || 'error'})`).join(', ');
  throw new Error(`Không thể kết nối AI. Đã thử: ${providerNames}. Vui lòng kiểm tra API Key hoặc thử lại sau.`);
}
