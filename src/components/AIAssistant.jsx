import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bot, Sparkles, Loader2, X, Send, Cpu, Check, Copy, Wand2, Zap, Lock, RotateCcw, Trash2 } from 'lucide-react';
import { askAIForHelp } from '../config/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMarkdown } from '../utils/latexHelper';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';



const CodeBlock = ({ inline, className, children, onProposeFix, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  
  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="code-block-wrapper" style={{ position: 'relative', margin: '1rem 0', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{match[1]}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {onProposeFix && match[1] === 'python' && (
              <button 
                onClick={() => onProposeFix(String(children).replace(/\n$/, ''))} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
                title="Apply fix to editor"
              >
                <Wand2 size={16} /> Apply Fix
              </button>
            )}
            <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? 'var(--success-color)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }} title="Copy code">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        <pre style={{ margin: 0, padding: '1rem', backgroundColor: 'var(--bg-color)', overflowX: 'auto' }} {...props}>
          <code className={className} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={className} style={{ backgroundColor: 'var(--surface-color)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontFamily: 'monospace' }} {...props}>{children}</code>;
};

const MessageBubble = React.memo(({ msg, onProposeFix }) => {
  const [displayedContent, setDisplayedContent] = useState(msg.isNew ? '' : msg.content);

  useEffect(() => {
    if (!msg.isNew) {
      setDisplayedContent(msg.content);
      return;
    }

    let i = 0;
    // Adaptive speed: finish in about 1.5 seconds regardless of length, minimum 1 char per tick
    const charsPerTick = Math.max(1, Math.floor(msg.content.length / 100));
    const interval = setInterval(() => {
      setDisplayedContent(msg.content.slice(0, i));
      i += charsPerTick;
      
      // Keep scrolling down while typing
      const container = document.querySelector('.ai-chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      
      if (i > msg.content.length) {
        setDisplayedContent(msg.content);
        clearInterval(interval);
        msg.isNew = false; // Mark as done so it doesn't re-type on re-renders
      }
    }, 15);

    return () => clearInterval(interval);
  }, [msg.content, msg.isNew]);

  return (
    <div className={`ai-chat-bubble ${msg.role}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{ 
          code: (props) => <CodeBlock {...props} onProposeFix={onProposeFix} />,
          span: ({node, className, children, ...props}) => {
            if (className === 'katex-error') {
              const rawText = String(children);
              if (rawText === 'undefined' || rawText === 'null') return null;
              return <span className="katex-error-override" title={props.title} style={{ color: 'inherit', fontStyle: 'italic' }}>{children}</span>;
            }
            return <span className={className} {...props}>{children}</span>;
          }
        }}
      >
        {preprocessMarkdown(displayedContent)}
      </ReactMarkdown>
    </div>
  );
});

// Helper to sanitize loaded messages and remove any orphaned or mismatched fix proposal messages
const sanitizeHistory = (msgs) => {
  if (!Array.isArray(msgs)) return [];
  const sanitized = [];
  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    // If it is the hardcoded fix proposal message
    if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.includes('Mình đã đề xuất bản sửa code')) {
      const prevMsg = i > 0 ? msgs[i - 1] : null;
      // Must be immediately preceded by a 'Fix my code' request
      if (!prevMsg || prevMsg.role !== 'user' || prevMsg.content?.includes('Analyze my code') || !prevMsg.content?.toLowerCase().includes('fix')) {
        continue; // Discard orphaned/mismatched fix proposal
      }
    }
    sanitized.push(msg);
  }
  return sanitized;
};

export function AIAssistant({ problem, userCode, testResults, onClose, onProposeFix }) {
  const { currentUser } = useAuth();
  const { showConfirm, showToast } = useNotification();
  const [requestSent, setRequestSent] = useState(false);
  
  const handleRequestBlueCode = async () => {
    try {
      await addDoc(collection(db, 'access_requests'), {
        email: currentUser.email,
        username: currentUser.username,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });
      setRequestSent(true);
    } catch (error) {
      console.error("Failed to request Blue Code:", error);
    }
  };

  const problemId = problem?.id;
  const storageKey = `zerocoder_ai_chat_${problemId || 'default'}`;
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      if (!problemId) return [];
      const saved = localStorage.getItem(`zerocoder_ai_chat_${problemId}`) || sessionStorage.getItem(`ai_chat_${problemId}`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return sanitizeHistory(parsed);
    } catch (e) {
      return [];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [currentProvider, setCurrentProvider] = useState('Gemini');
  
  const chatContainerRef = useRef(null);

  // Sync messages whenever problemId becomes available or changes
  useEffect(() => {
    if (!problemId) {
      setMessages([]);
      return;
    }
    try {
      const saved = localStorage.getItem(`zerocoder_ai_chat_${problemId}`) || sessionStorage.getItem(`ai_chat_${problemId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(sanitizeHistory(parsed));
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.error('Failed to sync chat history from storage', e);
      setMessages([]);
    }
  }, [problemId]);

  // Persist messages to both localStorage and sessionStorage
  useEffect(() => {
    if (problemId && messages.length > 0) {
      try {
        const json = JSON.stringify(messages);
        localStorage.setItem(`zerocoder_ai_chat_${problemId}`, json);
        sessionStorage.setItem(`ai_chat_${problemId}`, json);
      } catch (e) {
        console.error('Failed to save chat to storage', e);
      }
    }
  }, [messages, problemId]);

  // Auto-scroll to bottom of chat safely without locking scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, isLoading]);

  const handleIntent = async (intentPrompt, uiLabel = null) => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    
    const displayLabel = uiLabel || (intentPrompt.length > 50 ? 'Analyze my code' : intentPrompt);
    const intentMessage = { role: 'user', content: intentPrompt };
    
    // Add user bubble to UI
    setMessages(prev => [...prev, { role: 'user', content: displayLabel }]);
    
    try {
      const { text, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, [...messages, intentMessage], false);
      setCurrentProvider(providerName || 'AI');
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: text, isNew: true }]);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixIntent = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    
    setMessages(prev => [...prev, { role: 'user', content: 'Fix my code' }]);
    
    // Explicitly tell the AI not to return code if it's already correct.
    const intentMessage = { 
      role: 'user', 
      content: `Dưới đây là mã nguồn HIỆN TẠI của tôi trong editor:\n\`\`\`python\n${userCode || ''}\n\`\`\`\nHãy sửa mã này để vượt qua tất cả test cases. Nếu mã đã chính xác và không có lỗi, hãy trả về chính xác "No error to fix". Ngược lại, CHỈ trả về code đã sửa hoàn chỉnh trong block python, không kèm bất kỳ giải thích nào.` 
    };
    
    try {
      const { text: response, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, [intentMessage], true);
      setCurrentProvider(providerName || 'AI');
      
      // Extract python code from response
      const codeMatch = response.match(/```(?:python|py)?\n([\s\S]*?)```/);
      let extractedCode = codeMatch ? codeMatch[1].trim() : response.replace(/```python|```py|```/g, '').trim();
      
      if (
        extractedCode.toLowerCase().includes("no error to fix") || 
        response.toLowerCase().includes("no error to fix") ||
        extractedCode.trim() === userCode.trim()
      ) {
        setIsLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: "Mã nguồn của bạn đã chính xác hoặc không có lỗi cần sửa." }]);
        return;
      }
      
      setIsLoading(false);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Mình đã đề xuất bản sửa code cho bạn ở khung soạn thảo bên trái. Bạn hãy xem phần so sánh (diff) và bấm **Accept** để áp dụng hoặc **Reject** để huỷ nhé.',
          isNew: true
        }
      ]);
      onProposeFix(extractedCode);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    
    try {
      // For initial request, we don't send any user text, the AI will use the system prompt
      const { text, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, []);
      setCurrentProvider(providerName || 'AI');
      setIsLoading(false);
      setMessages([{ role: 'assistant', content: text, isNew: true }]);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      // Send the entire chat history
      const { text, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, updatedMessages);
      setCurrentProvider(providerName || 'AI');
      setIsLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: text, isNew: true }]);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = () => {
    if (!messages || messages.length === 0) return;
    showConfirm(
      'Are you sure you want to clear this chat history? All previous messages will be deleted permanently.',
      () => {
        setMessages([]);
        if (problemId) {
          localStorage.removeItem(`zerocoder_ai_chat_${problemId}`);
          sessionStorage.removeItem(`ai_chat_${problemId}`);
        }
        showToast('Chat history cleared successfully.', 'success');
      }
    );
  };

  // Standard Markdown rendering with CSS taking care of styling
  return (
    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', height: '40px', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.85rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '99px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: 18, 
                height: 18, 
                backgroundColor: 'var(--accent-primary)', 
                maskImage: 'url(/zerocoder-logo.png)', 
                maskSize: 'contain', 
                maskRepeat: 'no-repeat', 
                maskPosition: 'center',
                WebkitMaskImage: 'url(/zerocoder-logo.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
              }} />
              <span style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                letterSpacing: '0.3px',
                fontFamily: 'inherit',
                textTransform: 'none'
              }}>Ask AI</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {messages.length > 0 && (
            <button 
              onClick={handleDeleteHistory}
              style={{
                background: 'transparent',
                border: '1px solid color-mix(in srgb, var(--error) 25%, var(--border-color))',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.24rem 0.55rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 500,
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--error)';
                e.currentTarget.style.borderColor = 'var(--error)';
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--error) 12%, transparent)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--error) 25%, var(--border-color))';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="Clear chat history"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Close AI Assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>


      {currentUser?.colorCode === 'Gray' ? (
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            <Lock size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Access Denied</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            You don't have access to this feature.
          </p>
          <button 
            onClick={handleRequestBlueCode}
            disabled={requestSent}
            className={requestSent ? "button-secondary" : "button-primary"}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-full)' }}
          >
            {requestSent ? (
              <>
                <Check size={18} />
                Request Sent to Admin
              </>
            ) : (
              <>
                Request for Blue Code
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Chat Area */}
          <div ref={chatContainerRef} style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
            
            {messages.length === 0 && !isLoading && !error && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  backgroundColor: 'var(--accent-primary)', 
                  maskImage: 'url(/zerocoder-logo.png)', 
                  maskSize: 'contain', 
                  maskRepeat: 'no-repeat', 
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/zerocoder-logo.png)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  margin: '0 auto 1rem',
                  opacity: 0.8
                }} />
                <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>How can I help you?</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Ask a question or use the suggestions below.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <MessageBubble key={index} msg={msg} onProposeFix={onProposeFix} />
            ))}

            {isLoading && (
              <div className="ai-chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="spinner" style={{ animation: 'spin 2s linear infinite' }} />
                Thinking...
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--error)', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', margin: '1rem 0' }}>
                {error}
              </div>
            )}
            
          </div>

          {/* Persistent Suggestions */}
          {!isLoading && (
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', overflowX: 'auto', borderTop: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
              {problem?.type === 'multiple_choice' ? (
                <button 
                  onClick={() => handleIntent('Hãy kiểm tra và chấm điểm các đáp án trắc nghiệm mà tôi đã chọn, đồng thời giải thích ngắn gọn lý do cho các câu sai.', 'Grade & Explain')}
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onMouseOver={(e) => { e.target.style.background = 'var(--bg-surface-highlight)'; e.target.style.color = 'var(--text-primary)'; }}
                  onMouseOut={(e) => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
                >
                  Grade & Explain
                </button>
              ) : (
                <>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const codeSnippet = userCode && userCode.trim() 
                        ? userCode 
                        : '# (Editor hiện đang trống, chưa có mã)';
                      const prompt = `Dưới đây là mã nguồn HIỆN TẠI MỚI NHẤT của tôi trong editor:
\`\`\`python
${codeSnippet}
\`\`\`

Hãy phân tích kỹ mã nguồn hiện tại này của tôi và chỉ ra những chỗ tôi có thể đang làm sai, thiếu sót hoặc chưa tối ưu logic.
LƯU Ý QUAN TRỌNG CHO BẠN (AI):
- Bạn PHẢI phân tích dựa trên chính xác mã nguồn HIỆN TẠI ở trên, tuyệt đối không phân tích theo mã khởi tạo ban đầu (initial code/template) và không lặp lại nhận xét cũ nếu tôi đã sửa mã.
- KHÔNG cung cấp lời giải trực tiếp hay toàn bộ code giải. Hãy giải thích nguyên nhân và hướng dẫn từng bước để tôi tự sửa.
- Tuyệt đối KHÔNG đề xuất code sang editor hay bảo người dùng xem diff/bấm Accept hay Reject vì bạn đang ở chế độ phân tích (Analyze), không phải chế độ sửa code (Fix).`;
                      handleIntent(prompt, 'Analyze my code');
                    }}
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onMouseOver={(e) => { e.target.style.background = 'var(--bg-surface-highlight)'; e.target.style.color = 'var(--text-primary)'; }}
                    onMouseOut={(e) => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
                  >
                    Analyze my code
                  </button>
                  {(!testResults.length || !testResults.every(tr => tr.passed)) && (
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFixIntent();
                      }}
                      style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      onMouseOver={(e) => { e.target.style.background = 'var(--bg-surface-highlight)'; e.target.style.color = 'var(--text-primary)'; }}
                      onMouseOut={(e) => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                      Fix my code
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Input Area */}
          <div style={{ padding: '0 1rem 1rem 1rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.5rem', padding: '0.25rem 0.25rem 0.25rem 1rem' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={messages.length === 0 ? "Ask a question..." : "Follow up..."}
                disabled={isLoading}
                style={{
                  flex: '1',
                  padding: '0.5rem 0',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                style={{
                  backgroundColor: inputValue.trim() && !isLoading ? 'var(--accent-primary)' : 'transparent',
                  color: inputValue.trim() && !isLoading ? 'white' : 'var(--text-tertiary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={14} style={{ marginLeft: inputValue.trim() && !isLoading ? '2px' : '0' }} />
              </button>
            </form>
            
            {/* Disclaimer */}
            <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
              Powered by {currentProvider}. AI can make mistakes.
            </div>
          </div>
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
