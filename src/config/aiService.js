import { GoogleGenAI } from '@google/genai';

// =============================================
// Multi-Provider AI Service with Auto-Fallback
// =============================================
// Supported providers: Gemini, Groq, Mistral, Cerebras
// When one provider hits rate limit, automatically switches to the next.

// --- Provider Configuration ---
const providers = [];

// 1. Groq (Ultra-fast inference on LPUs, <1s response time)
const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
if (groqKey) {
  providers.push({
    name: 'Groq (Qwen 27B)',
    type: 'openai-compatible',
    model: 'qwen/qwen3.8-27b',
    apiKey: groqKey,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  });
  providers.push({
    name: 'Groq (GPT-OSS 120B)',
    type: 'openai-compatible',
    model: 'openai/gpt-oss-120b',
    apiKey: groqKey,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  });
}

// 2. Gemini (Google GenAI 3.6 Flash)
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
if (geminiKey) {
  const geminiClient = new GoogleGenAI({ apiKey: geminiKey });
  providers.push({
    name: 'Gemini (3.6 Flash)',
    type: 'gemini',
    model: 'gemini-3.6-flash',
    apiKey: geminiKey,
    client: geminiClient,
  });
}

// 3. Mistral (open-mistral-7b & mistral-small-latest)
const mistralKey = import.meta.env.VITE_MISTRAL_API_KEY || '';
if (mistralKey) {
  providers.push({
    name: 'Mistral (7B)',
    type: 'openai-compatible',
    model: 'open-mistral-7b',
    apiKey: mistralKey,
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
  });
  providers.push({
    name: 'Mistral (Small)',
    type: 'openai-compatible',
    model: 'mistral-small-latest',
    apiKey: mistralKey,
    baseUrl: 'https://api.mistral.ai/v1/chat/completions',
  });
}

// 4. OpenRouter (Multi-model free tier fallback)
const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
if (openRouterKey) {
  providers.push({
    name: 'OpenRouter (Qwen 27B)',
    type: 'openai-compatible',
    model: 'qwen/qwen3.8-27b:free',
    apiKey: openRouterKey,
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
  });
}

// --- OpenAI-Compatible API Call with 8s Timeout ---
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(provider.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: provider.model,
        messages: messages,
        temperature: 0.6,
        max_tokens: 1500,
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
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`${provider.name} timed out after 25s`);
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- Gemini API Call with 25s Timeout ---
async function callGemini(provider, systemPrompt, chatHistory, lastMessage) {
  let generatePromise;
  if (chatHistory.length === 0) {
    generatePromise = provider.client.models.generateContent({
      model: provider.model,
      contents: `${systemPrompt}\n\nUser message: ${lastMessage}`,
    }).then(res => res.text);
  } else {
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

    generatePromise = chat.sendMessage({ message: lastMessage }).then(res => res.text);
  }

  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      const timeoutErr = new Error(`${provider.name} timed out after 25s`);
      timeoutErr.status = 408;
      reject(timeoutErr);
    }, 25000);
  });

  return await Promise.race([generatePromise, timeoutPromise]);
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
      testContext = `### Failing Test Results:\n${failingTests.map((r, i) => `Test Case ${i + 1}:
Code / Invocation: ${r.code || 'N/A'}
Expected: ${r.expected}
${r.error ? `Execution Error: ${r.error}` : `Got: ${r.got}`}`).join('\n\n')}

The user wants you to FIX their code so that it passes ALL test cases. You MUST return ONLY the fully fixed code wrapped in a \`\`\`python code block. DO NOT output any explanation, hints, or markdown text outside the code block. Your entire response must be just the code block.`;
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

  let problemFullDescription = problem.description;
  if (problem.type === 'multiple_choice' && problem.questions) {
    problemFullDescription += '\n\n### Questions:\n' + JSON.stringify(problem.questions, null, 2);
  }

  // Extract required function signature(s) from initialCode, answer_key, or testCases
  let requiredSignatures = [];
  if (problem.initialCode) {
    const sigMatches = problem.initialCode.match(/def\s+[a-zA-Z0-9_]+\s*\([^)]*\):/g);
    if (sigMatches) {
      requiredSignatures = [...new Set(sigMatches)];
    }
  }
  if (requiredSignatures.length === 0 && problem.answer_key) {
    const sigMatches = problem.answer_key.match(/def\s+[a-zA-Z0-9_]+\s*\([^)]*\):/g);
    if (sigMatches) {
      requiredSignatures = [...new Set(sigMatches)];
    }
  }
  if (requiredSignatures.length === 0 && problem.testCases) {
    for (const tc of problem.testCases) {
      const codeStr = tc.code || tc.input || '';
      const m = codeStr.match(/(?:print\s*\(\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
      if (m && m[1] && !['print', 'len', 'str', 'int', 'float', 'type', 'list', 'dict', 'set', 'tuple', 'sorted', 'range'].includes(m[1])) {
        requiredSignatures.push(`def ${m[1]}(...):`);
        break;
      }
    }
  }

  const funcSignatureNote = requiredSignatures.length > 0 ? `
### CRITICAL FUNCTION SIGNATURE RULE:
The automated test runner will execute test cases calling the following exact function name(s):
${requiredSignatures.join('\n')}
You MUST implement or preserve the EXACT function name(s) above. DO NOT change the function name, rename it to solve/solution/run, or omit it, otherwise all test cases will fail with NameError.
` : '';

  const systemPrompt = `
You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
IMPORTANT PERSONA RULES:
- Always use the pronoun "mình" to refer to yourself, and "bạn" to refer to the user.
- Do NOT be overly friendly or chatty. Do not use emojis unless necessary.
- ONLY answer the specific question the user asks. Do NOT digress into other questions or topics.
- Keep your explanations extremely concise. Do NOT repeat points that have already been made.
${isFixMode ? '- DO NOT explain anything. ONLY return the code block.' : '- Provide direct, concise instructions and point out logical errors. Do not write long paragraphs.'}

A student is working on the following problem.

### Problem Title:
${problem.title}

### Problem Description:
${problemFullDescription}

${problem.answer_key ? `### Problem Creator's Reference Solution (Use this reference to ensure the fixed code adheres to the expected signature, return structure, and formatting):\n\`\`\`python\n${problem.answer_key}\n\`\`\`\n` : ''}
${funcSignatureNote}
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

// --- Learning AI Export ---
export async function askAIForLearning(notebookTitle, cellCode, cellOutput, cellIndex, chatHistory = []) {
  if (providers.length === 0) {
    throw new Error('Chưa cấu hình API Key nào. Vui lòng thêm ít nhất 1 key vào file .env.');
  }

  const outputText = Array.isArray(cellOutput)
    ? cellOutput.map(o => o.text).join('\n')
    : (cellOutput || '');

  const systemPrompt = `
You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
IMPORTANT PERSONA RULES:
- Always use the pronoun "mình" to refer to yourself, and "bạn" to refer to the user.
- Do NOT be overly friendly or chatty. Do not use emojis unless necessary.
- ONLY answer the specific question the user asks. Do NOT digress into other questions or topics.
- Keep your explanations extremely concise. Do NOT repeat points that have already been made.
- Provide direct, concise instructions and point out logical errors. Do not write long paragraphs.
- Do NOT rewrite the entire code. Only explain concepts, point out errors, and suggest fixes.
- If the student asks about a concept, explain it with a simple example.
- If the code has an error, point out the line and suggest how to fix it (do not write the full code).

### Notebook: ${notebookTitle}
${cellCode ? `
### Code hiện tại (Cell ${cellIndex !== null ? cellIndex + 1 : '?'}):
\`\`\`python
${cellCode}
\`\`\`` : ''}
${outputText ? `
### Output:
\`\`\`
${outputText}
\`\`\`` : ''}
  `.trim();

  let userMessage;
  if (chatHistory.length === 0) {
    userMessage = "Help me understand this code/notebook";
  } else {
    userMessage = chatHistory[chatHistory.length - 1]?.content || "Help me";
  }

  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`🎓 Learning AI: Trying ${provider.name}...`);

      let resultText;
      if (provider.type === 'gemini') {
        resultText = await callGemini(provider, systemPrompt, chatHistory, userMessage);
      } else {
        resultText = await callOpenAICompatible(provider, systemPrompt, chatHistory, userMessage);
      }

      console.log(`✅ ${provider.name} responded.`);
      return { text: resultText, providerName: provider.name, modelName: provider.model };

    } catch (error) {
      const status = error?.status;
      const msg = error?.message || '';
      console.warn(`❌ ${provider.name} failed: ${msg.substring(0, 150)}`);
      errors.push({ provider: provider.name, status, message: msg });
      continue;
    }
  }

  console.error("All AI providers failed:", errors);
  const allRateLimited = errors.every(e => e.status === 429 || e.message?.includes('429') || e.message?.includes('quota'));
  if (allRateLimited) {
    throw new Error(`AI đang quá tải. Vui lòng đợi 1 phút rồi thử lại!`);
  }
  throw new Error(`Không thể kết nối AI. Vui lòng thử lại sau.`);
}
