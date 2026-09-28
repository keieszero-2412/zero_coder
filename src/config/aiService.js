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
    timeout: 8000,
  });
  providers.push({
    name: 'Groq (GPT-OSS 120B)',
    type: 'openai-compatible',
    model: 'openai/gpt-oss-120b',
    apiKey: groqKey,
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    timeout: 8000,
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

  // Add chat history (excluding the last item if it is already lastMessage)
  const historyBeforeLast = chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.content === lastMessage
    ? chatHistory.slice(0, -1)
    : chatHistory;

  for (const msg of historyBeforeLast) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Add the current message
  messages.push({ role: 'user', content: lastMessage });

  const controller = new AbortController();
  const timeoutMs = provider.timeout || 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
    if (data.error) {
      const error = new Error(`${provider.name} API error: ${JSON.stringify(data.error).substring(0, 200)}`);
      error.status = response.status;
      throw error;
    }
    
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`${provider.name} timed out after ${timeoutMs/1000}s`);
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
    const historyBeforeLast = chatHistory.length > 0 && chatHistory[chatHistory.length - 1]?.content === lastMessage
      ? chatHistory.slice(0, -1)
      : chatHistory;

    const formattedHistory = historyBeforeLast.map(msg => ({
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
    const timeoutMs = provider.timeout || 12000;
    const id = setTimeout(() => {
      clearTimeout(id);
      const timeoutErr = new Error(`${provider.name} timed out after ${timeoutMs/1000}s`);
      timeoutErr.status = 408;
      reject(timeoutErr);
    }, timeoutMs);
  });

  return await Promise.race([generatePromise, timeoutPromise]);
}

let websiteContextCache = null;
async function getWebsiteContext() {
  if (websiteContextCache) return websiteContextCache;
  try {
    const [probsRes, lecsRes] = await Promise.all([
      fetch('/problems.json'),
      fetch('/lectures/lectures.json')
    ]);
    const probs = await probsRes.json();
    const lecsData = await lecsRes.json();
    const lecs = lecsData.lectures || [];

    let context = `\n\n--- THÔNG TIN VỀ WEBSITE ZERO CODER ---\n`;
    context += `Bạn là trợ lý ảo của nền tảng học lập trình Zero Coder. Dưới đây là danh sách toàn bộ các Bài giảng (Lectures) và Bài tập (Problems) có trên hệ thống để bạn biết tổng quan khóa học và hướng dẫn học sinh:\n\n`;

    context += `[DANH SÁCH BÀI GIẢNG HIỆN CÓ]\n`;
    lecs.forEach(l => {
      context += `- ID: ${l.id} | Tiêu đề: ${l.title}\n`;
    });

    context += `\n[DANH SÁCH BÀI TẬP HIỆN CÓ (Gộp theo danh mục)]\n`;
    const byCategory = {};
    probs.forEach(p => {
      if (!byCategory[p.category]) byCategory[p.category] = [];
      byCategory[p.category].push(`${p.id} (${p.title})`);
    });

    for (const [cat, pList] of Object.entries(byCategory)) {
      context += `- Danh mục "${cat}": ${pList.join(', ')}\n`;
    }

    websiteContextCache = context;
    return context;
  } catch (err) {
    console.warn("Could not fetch website context for AI", err);
    return "";
  }
}

// --- Main Export ---
export async function askAIForHelp(problem, userCode, testResults, chatHistory = [], isFixMode = false) {
  if (providers.length === 0) {
    throw new Error('Chưa cấu hình API Key nào. Vui lòng thêm ít nhất 1 key vào file .env (VITE_GEMINI_API_KEY, VITE_GROQ_API_KEY, VITE_MISTRAL_API_KEY, hoặc VITE_CEREBRAS_API_KEY).');
  }

  // --- Build prompt ---
  const isMCQ = problem.type === 'multiple_choice';
  const failingTests = testResults.filter(r => !r.passed);
  const isCorrect = testResults.length > 0 && failingTests.length === 0;

  let testContext = "";
  if (isCorrect) {
    testContext = "The student's submission is CORRECT and passes all questions/tests! You must congratulate them and confirm their answers are completely accurate.";
  } else if (failingTests.length > 0) {
    if (isFixMode) {
      testContext = `### Failing Test Results:\n${failingTests.map((r, i) => `Test Case ${i + 1}:
Code / Invocation: ${r.code || 'N/A'}
Expected: ${r.expected}
${r.error ? `Execution Error: ${r.error}` : `Got: ${r.got}`}`).join('\n\n')}

The user wants you to FIX their code so that it passes ALL test cases. You MUST return ONLY the fully fixed code wrapped in a \`\`\`python code block. DO NOT output any explanation, hints, or markdown text outside the code block. Your entire response must be just the code block.`;
    } else {
      testContext = `### Kết quả kiểm tra các câu bị sai (Failing Test Results):\n${failingTests.map((r, i) => `
- ${r.code || `Câu ${i + 1}`}:
  + Đáp án đúng theo key: ${r.expected}
  + Đáp án học viên đã chọn: ${r.got}
  ${r.error ? `+ Lỗi: ${r.error}` : ''}
`).join('\n')}

Hãy cung cấp gợi ý ngắn gọn, rõ ràng giúp học viên hiểu tại sao các câu trên lại sai và hướng dẫn họ tư duy để chọn đáp án đúng. Tuyệt đối đối chiếu đúng số thứ tự câu hỏi.`;
    }
  } else {
    testContext = isMCQ 
      ? "Học viên chưa nộp bài hoặc chưa bấm kiểm tra kết quả."
      : "The student hasn't run the tests yet or test results are unavailable. Review the code for obvious logical errors or ask them to run the code to see the results.";
  }

  let problemFullDescription = problem.description || '';
  let mcqQuestionsAndAnswersBlock = "";
  let mcqSummaryBlock = "";

  if (isMCQ && problem.questions) {
    let parsedAnswers = {};
    try {
      parsedAnswers = typeof userCode === 'string' ? JSON.parse(userCode || '{}') : (userCode || {});
    } catch {
      parsedAnswers = {};
    }

    const questions = problem.questions;
    const correctAnswers = problem.correctAnswers || {};

    const questionBlocks = questions.map((q, idx) => {
      const qNum = idx + 1; // Số thứ tự hiển thị cho học viên: Câu 1, Câu 2, ..., Câu 7, Câu 8...
      const rawUserAns = parsedAnswers[idx] ?? parsedAnswers[String(idx)];
      const rawCorrectAns = correctAnswers[idx] ?? correctAnswers[String(idx)];

      let userAnsStr = "Chưa chọn";
      if (rawUserAns !== undefined && rawUserAns !== null) {
        if (Array.isArray(rawUserAns)) {
          userAnsStr = rawUserAns.length > 0 ? JSON.stringify(rawUserAns) : "Chưa chọn";
        } else {
          userAnsStr = String(rawUserAns);
        }
      }

      let correctAnsStr = "Chưa có đáp án key";
      if (rawCorrectAns !== undefined && rawCorrectAns !== null) {
        if (Array.isArray(rawCorrectAns)) {
          correctAnsStr = rawCorrectAns.length > 0 ? JSON.stringify(rawCorrectAns) : "Chưa có";
        } else {
          correctAnsStr = String(rawCorrectAns);
        }
      }

      const optionsFormatted = (q.options || []).map((opt) => `  - ${opt}`).join('\n');

      return `==============================
[CÂU HỎI SỐ ${qNum}] (Học viên gọi là "Câu ${qNum}"):
- Đề bài: ${q.text || ''}
${optionsFormatted ? `- Các phương án lựa chọn:\n${optionsFormatted}` : ''}
- ĐÁP ÁN HỌC VIÊN ĐANG CHỌN Ở CÂU ${qNum}: ${userAnsStr}
- ĐÁP ÁN ĐÚNG THEO KEY Ở CÂU ${qNum}: ${correctAnsStr}`;
    });

    mcqQuestionsAndAnswersBlock = `
### BẢNG ĐỐI CHIẾU CHI TIẾT TỪNG CÂU HỎI (ĐÃ ĐỒNG BỘ CHUẨN XÁC THEO SỐ THỨ TỰ CÂU 1 ĐẾN CÂU ${questions.length}):
${questionBlocks.join('\n\n')}

⚠️ QUY TẮC CỰC KỲ QUAN TRỌNG DÀNH CHO BẠN (AI ZERO) KHI TRẢ LỜI VỀ CÁC CÂU TRẮC NGHIỆM:
1. Học viên nhìn thấy và gọi tên các câu hỏi theo số thứ tự từ "Câu 1" đến "Câu ${questions.length}" (1-indexed).
2. Khi học viên nhắc đến "Câu X" (ví dụ: Câu 7), bạn BẮT BUỘC phải tra cứu đúng khối "[CÂU HỎI SỐ X]" (ví dụ: [CÂU HỎI SỐ 7]) ở trên.
3. TUYỆT ĐỐI KHÔNG ĐƯỢC nhầm lẫn giữa chỉ số index trong code/JSON với số thứ tự câu hỏi!
   - Ví dụ: Ở Câu 7 (tương ứng index 6), nếu học viên chọn ["B"] thì bạn phải xác nhận học viên đang chọn B. Tuyệt đối KHÔNG ĐƯỢC lấy lựa chọn của Câu 8 (index 7) đem gán cho Câu 7!
4. Hãy luôn phản hồi chính xác dựa theo bảng đối chiếu [CÂU HỎI SỐ X] ở trên.
`;

    mcqSummaryBlock = `
### TỔNG QUAN ĐÁP ÁN HỌC VIÊN ĐANG CHỌN HIỆN TẠI (THEO SỐ THỨ TỰ TỪ CÂU 1 ĐẾN CÂU ${questions.length}):
${questions.map((_, idx) => {
  const qNum = idx + 1;
  const ans = parsedAnswers[idx] ?? parsedAnswers[String(idx)];
  const display = ans !== undefined && ans !== null 
    ? (Array.isArray(ans) ? (ans.length > 0 ? JSON.stringify(ans) : 'Chưa chọn') : String(ans))
    : 'Chưa chọn';
  return `- Câu ${qNum}: ${display}`;
}).join('\n')}
`;
  }

  // Extract required function signature(s) from initialCode, answer_key, or testCases
  let requiredSignatures = [];
  if (!isMCQ) {
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
  }

  const funcSignatureNote = requiredSignatures.length > 0 ? `
### CRITICAL FUNCTION SIGNATURE RULE:
The automated test runner will execute test cases calling the following exact function name(s):
${requiredSignatures.join('\n')}
You MUST implement or preserve the EXACT function name(s) above. DO NOT change the function name, rename it to solve/solution/run, or omit it, otherwise all test cases will fail with NameError.
` : '';

  const studentContentSection = isMCQ ? `
${mcqSummaryBlock}

${mcqQuestionsAndAnswersBlock}
` : `
### Student's Current Code (MÃ NGUỒN HIỆN TẠI MỚI NHẤT TRONG EDITOR):
\`\`\`python
${userCode || '# (Editor hiện đang trống)'}
\`\`\`
LƯU Ý ĐẶC BIỆT BẮT BUỘC:
- Khung mã trên là mã nguồn HIỆN TẠI MỚI NHẤT học viên đang viết trong editor. Bạn PHẢI phân tích dựa trên chính xác mã này.
- Tuyệt đối KHÔNG phân tích theo mã khung khởi tạo ban đầu (initial code) nếu học viên đã viết mã khác.
- Nếu học viên đã cập nhật mã so với các câu hỏi trước, hãy tập trung phân tích mã mới nhất này.
`;

  const systemPrompt = `
You are an AI programming assistant. Your name is "Zero". You must communicate in Vietnamese.
IMPORTANT PERSONA RULES:
- Always use the pronoun "mình" to refer to yourself, and "bạn" to refer to the user.
- Do NOT be overly friendly or chatty. Do not use emojis unless necessary.
- ONLY answer the specific question the user asks. Do NOT digress into other questions or topics.
- Keep your explanations extremely concise. Do NOT repeat points that have already been made.
${isFixMode ? '- DO NOT explain anything. ONLY return the code block.' : '- Provide direct, concise instructions and point out logical errors. Do not write long paragraphs. NEVER propose code to the editor or tell the user to check diff/accept/reject.'}

A student is working on the following problem.

### Problem Title:
${problem.title}

### Problem Description:
${problemFullDescription}

${problem.answer_key ? `### Problem Creator's Reference Solution:\n\`\`\`python\n${problem.answer_key}\n\`\`\`\n` : ''}
${funcSignatureNote}
${studentContentSection}

${testResults.length > 0 ? `### Note on Test Results:
The following test results are from the student's last submission. Always evaluate their CURRENT answers/code above to see if these errors still apply:
${testContext}` : testContext}
  `;

  // --- Determine the user message ---
  let userMessage;
  if (chatHistory.length === 0) {
    userMessage = isFixMode ? "Fix my code" : "Help me with this problem";
  } else {
    userMessage = chatHistory[chatHistory.length - 1]?.content || "Help me";
  }

  // Đối với bài trắc nghiệm: luôn đính kèm snapshot đáp án real-time mới nhất vào message gửi tới model
  let userMessageForModel = userMessage;
  if (isMCQ && problem.questions) {
    let parsed = {};
    try { parsed = JSON.parse(userCode || '{}'); } catch {}
    const currentSummary = (problem.questions || []).map((_, idx) => {
      const a = parsed[idx] ?? parsed[String(idx)];
      const disp = a !== undefined && a !== null ? (Array.isArray(a) ? (a.length > 0 ? a.join(', ') : 'Chưa chọn') : String(a)) : 'Chưa chọn';
      return `Câu ${idx + 1}: [ ${disp} ]`;
    }).join(' | ');

    userMessageForModel = `[ĐỒNG BỘ REAL-TIME ĐÁP ÁN MỚI NHẤT HỌC VIÊN ĐANG CHỌN TRÊN GIAO DIỆN:\n${currentSummary}\n(LƯU Ý: Học viên có thể vừa thay đổi/chọn lại đáp án trên giao diện trước khi nhắn tin. Bạn PHẢI luôn ưu tiên cập nhật theo trạng thái mới nhất này, tuyệt đối không dùng đáp án cũ từ các lượt chat trước!)]\n\nCâu hỏi/Yêu cầu của học viên: ${userMessage}`;
  }

  // --- Try each provider with fallback ---
  const errors = [];

  for (const provider of providers) {
    try {
      console.log(`🤖 Trying ${provider.name} (${provider.model})...`);

      let resultText;
      if (provider.type === 'gemini') {
        resultText = await callGemini(provider, systemPrompt, chatHistory, userMessageForModel);
      } else {
        resultText = await callOpenAICompatible(provider, systemPrompt, chatHistory, userMessageForModel);
      }

      if (!resultText || !resultText.trim()) {
        throw new Error(`${provider.name} returned an empty response`);
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

  const websiteContext = await getWebsiteContext();

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

${websiteContext}

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

      if (!resultText || !resultText.trim()) {
        throw new Error(`${provider.name} returned an empty response`);
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
