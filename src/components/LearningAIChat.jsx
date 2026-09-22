import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, Send, Check, Copy, BookOpen, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { preprocessMarkdown } from '../utils/latexHelper';

const CodeBlock = ({ inline, className, children, ...props }) => {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.4rem 1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{match[1]}</span>
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }} title="Copy code">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <pre style={{ margin: 0, padding: '1rem', backgroundColor: 'var(--bg-base)', overflowX: 'auto' }} {...props}>
          <code className={className} style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={className} style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontFamily: 'monospace' }} {...props}>{children}</code>;
};

const MessageBubble = React.memo(({ msg }) => {
  const [displayedContent, setDisplayedContent] = useState(msg.isNew ? '' : msg.content);

  useEffect(() => {
    if (!msg.isNew) {
      setDisplayedContent(msg.content);
      return;
    }

    let i = 0;
    const charsPerTick = Math.max(1, Math.floor(msg.content.length / 100));
    const interval = setInterval(() => {
      setDisplayedContent(msg.content.slice(0, i));
      i += charsPerTick;
      
      const container = document.querySelector('.learning-ai-chat-messages');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      
      if (i > msg.content.length) {
        setDisplayedContent(msg.content);
        clearInterval(interval);
        msg.isNew = false;
      }
    }, 15);

    return () => clearInterval(interval);
  }, [msg.content, msg.isNew]);

  return (
    <div className={`ai-chat-bubble ${msg.role}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{ code: CodeBlock }}
      >
        {preprocessMarkdown(displayedContent)}
      </ReactMarkdown>
    </div>
  );
});

export function LearningAIChat({ isOpen, onClose, notebookTitle, activeCellCode, activeCellOutput, activeCellIndex }) {
  const sessionKey = `ai_learning_chat_${notebookTitle}`;
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      if (!notebookTitle) return [];
      const saved = sessionStorage.getItem(sessionKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [currentProvider, setCurrentProvider] = useState('AI');
  
  const chatContainerRef = useRef(null);

  // Persist chat to sessionStorage
  useEffect(() => {
    if (notebookTitle) {
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save learning chat to sessionStorage', e);
      }
    }
  }, [messages, notebookTitle, sessionKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, isLoading]);

  // Reset conversation when notebook changes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`ai_learning_chat_${notebookTitle}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setMessages([]);
    }
    setError('');
  }, [notebookTitle]);

  const handleIntent = async (intentPrompt) => {
    setIsLoading(true);
    setError('');
    
    const intentMessage = { role: 'user', content: intentPrompt };
    // Do not add the intent prompt to the UI

    
    try {
      const { askAIForLearning } = await import('../config/aiService');
      const { text, providerName } = await askAIForLearning(
        notebookTitle,
        activeCellCode || '',
        activeCellOutput || [],
        activeCellIndex,
        [intentMessage]
      );
      setCurrentProvider(providerName || 'AI');
      setMessages(prev => [...prev, { role: 'assistant', content: text, isNew: true }]);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi kết nối AI.');
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
      const { askAIForLearning } = await import('../config/aiService');
      const { text, providerName } = await askAIForLearning(
        notebookTitle,
        activeCellCode || '',
        activeCellOutput || [],
        activeCellIndex,
        updatedMessages
      );
      setCurrentProvider(providerName || 'AI');
      setMessages(prev => [...prev, { role: 'assistant', content: text, isNew: true }]);
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi kết nối AI.');
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="learning-ai-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      width: '380px',
      minWidth: '320px',
      height: '100%',
      backgroundColor: 'var(--bg-surface-elevated)',
      borderLeft: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="section-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        height: '40px', padding: '0 1rem',
      }}>
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close AI Assistant"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatContainerRef} className="learning-ai-chat-messages" style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        
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
          <MessageBubble key={index} msg={msg} />
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

      {/* Cell Context Indicator */}
      {activeCellCode && (
        <div style={{
          padding: '0.4rem 1rem',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-base)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <BookOpen size={11} />
          Đang xem Cell [{activeCellIndex !== null ? activeCellIndex + 1 : '?'}]
        </div>
      )}

      {/* Persistent Suggestion Buttons */}
      {!isLoading && (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', overflowX: 'auto', borderTop: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
          <button 
            onClick={() => handleIntent('Giải thích chi tiết code và logic trong cell hiện tại cho mình hiểu. Nếu không có cell nào đang chọn, hãy tóm tắt nội dung chính của notebook.')}
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseOver={(e) => { e.target.style.background = 'var(--bg-surface-highlight)'; e.target.style.color = 'var(--text-primary)'; }}
            onMouseOut={(e) => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            Explain this code
          </button>
          <button 
            onClick={() => handleIntent('Mình chạy code bị lỗi. Hãy phân tích output và chỉ ra lỗi ở đâu, hướng dẫn cách sửa.')}
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '0.35rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseOver={(e) => { e.target.style.background = 'var(--bg-surface-highlight)'; e.target.style.color = 'var(--text-primary)'; }}
            onMouseOut={(e) => { e.target.style.background = 'var(--bg-base)'; e.target.style.color = 'var(--text-secondary)'; }}
          >
            Debug error
          </button>
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
