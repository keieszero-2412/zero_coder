import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Loader2, X, Send, Cpu, Check, Copy, Wand2 } from 'lucide-react';
import { askAIForHelp } from '../config/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const getShortModel = (model) => {
  if (!model) return 'AI';
  const m = model.toLowerCase();
  if (m.includes('llama')) return 'Llama';
  if (m.includes('gemini')) return 'Gemini';
  if (m.includes('mistral')) return 'Mistral';
  return model.split('-')[0] || 'AI';
};

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

export function AIAssistant({ problem, userCode, testResults, onClose, onProposeFix }) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [currentProvider, setCurrentProvider] = useState('Gemini');
  
  const chatContainerRef = useRef(null);

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

  const handleIntent = async (intentPrompt) => {
    setIsLoading(true);
    setError('');
    
    const intentMessage = { role: 'user', content: intentPrompt };
    setMessages([intentMessage]);
    
    try {
      const { text, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, [intentMessage]);
      setCurrentProvider(getShortModel(modelName));
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixIntent = async () => {
    setIsLoading(true);
    setError('');
    
    // Explicitly tell the AI not to return code if it's already correct.
    const intentMessage = { role: 'user', content: 'Fix my code. If there are no errors, return exactly "No error to fix". Otherwise, return ONLY the fully fixed code wrapped in a python code block, no other text.' };
    
    try {
      const { text: response, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, [intentMessage], true);
      setCurrentProvider(getShortModel(modelName));
      
      // Extract python code from response
      const codeMatch = response.match(/```(?:python|py)?\n([\s\S]*?)```/);
      let extractedCode = codeMatch ? codeMatch[1].trim() : response.replace(/```python|```py|```/g, '').trim();
      
      if (
        extractedCode.toLowerCase().includes("no error to fix") || 
        response.toLowerCase().includes("no error to fix") ||
        extractedCode.trim() === userCode.trim()
      ) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Your code is correct. There are no errors to fix." }]);
        return;
      }
      
      onProposeFix(extractedCode);
      // Đã xoá if (onClose) onClose(); để cửa sổ không bị tắt
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskAI = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // For initial request, we don't send any user text, the AI will use the system prompt
      const { text, providerName, modelName } = await askAIForHelp(problem, userCode, testResults, []);
      setCurrentProvider(getShortModel(modelName));
      setMessages([{ role: 'assistant', content: text }]);
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
      setCurrentProvider(getShortModel(modelName));
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with the AI.');
      // Remove the user message if it failed so they can try again
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Markdown rendering with CSS taking care of styling
  return (
    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', flex: '1', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
            <Bot size={18} />
            AI Assistant
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            <Cpu size={12} /> Powered by {currentProvider}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onClose && (
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
              title="Close AI Assistant"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '0.5rem', minHeight: '150px' }}>
        
        {messages.length === 0 && !isLoading && !error && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
            <Bot size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>How can I help you with this problem?</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>You can ask a question or use the suggestions below.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`ai-chat-bubble ${msg.role}`}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkMath]} 
              rehypePlugins={[rehypeKatex]}
              components={{ code: (props) => <CodeBlock {...props} onProposeFix={onProposeFix} /> }}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
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
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 0', overflowX: 'auto', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
          <button 
            onClick={() => handleIntent('Analyze my code and explain where I might be wrong. Do NOT give me the direct answer or the full code, just guide me.')}
            style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '0.4rem 1rem', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseOut={(e) => { e.target.style.background = 'var(--bg-surface-elevated)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            Analyze my code
          </button>
          {(!testResults.length || !testResults.every(tr => tr.passed)) && (
            <button 
              onClick={handleFixIntent}
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem', padding: '0.4rem 1rem', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.12)'; e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseOut={(e) => { e.target.style.background = 'var(--bg-surface-elevated)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              Fix my code
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={messages.length === 0 ? "Ask a question about your code..." : "Ask a follow-up question..."}
          disabled={isLoading}
          style={{
            flex: '1',
            padding: '0.75rem 1rem',
            borderRadius: '20px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-base)',
            color: 'var(--text-primary)',
            outline: 'none'
          }}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isLoading}
          style={{
            backgroundColor: inputValue.trim() && !isLoading ? 'var(--accent-primary)' : 'var(--bg-surface-highlight)',
            color: inputValue.trim() && !isLoading ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputValue.trim() && !isLoading ? 'pointer' : 'default',
            transition: 'background-color 0.2s'
          }}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </form>
      
      {/* Disclaimer */}
      <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
        AI can make mistakes. Please review the code carefully.
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
