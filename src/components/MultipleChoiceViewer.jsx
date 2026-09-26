import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { GripVertical, ArrowUp, ArrowDown, RotateCcw, ListOrdered } from 'lucide-react';

// Error Boundary to prevent ordering question crashes from taking down the entire page
class OrderingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('OrderingQuestion render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          ⚠️ Không thể hiển thị câu hỏi sắp xếp. Vui lòng tải lại trang (F5).
        </div>
      );
    }
    return this.props.children;
  }
}

export function isOrderingQuestion(q) {
  try {
    if (!q) return false;
    if (q.type === 'ordering' || q.type === 'sort') return true;
    const text = (q.text || q.question || '').toLowerCase();
    const opts = (q.options || []).join(' ');
    return (
      text.includes('sắp xếp các bước') || 
      text.includes('hãy sắp xếp') || 
      text.includes('quy trình hợp lý để một doanh nghiệp f&b') ||
      /\(1\)\s*→\s*\(2\)/.test(opts) ||
      /\(1\)\s*->\s*\(2\)/.test(opts)
    );
  } catch {
    return false;
  }
}

export function getOrderingItems(q) {
  if (q.items && q.items.length > 0) return q.items;
  if (q.options && q.options.length > 0) {
    const hasArrow = q.options.some(opt => /→|->/.test(opt));
    if (!hasArrow) {
      return q.options;
    }
  }
  return [
    "Thu thập dữ liệu từ các nguồn liên quan *(Collect data from relevant sources)*",
    "Sử dụng các mô hình thống kê và thuật toán học máy để phân tích dữ liệu *(Apply statistical models and machine learning algorithms to analyze the data)*",
    "Xác định vấn đề và loại dữ liệu cần thu thập *(Define the problem and determine data)*",
    "Làm sạch và tiền xử lý dữ liệu *(Clean and preprocess the data)*"
  ];
}

export function getOrderingCorrectOrder(q, expected) {
  if (Array.isArray(expected) && expected.length > 1) return expected;
  if (Array.isArray(q.correctOrder) && q.correctOrder.length > 1) return q.correctOrder;
  const items = getOrderingItems(q);
  const orderWeights = [
    'xác định vấn đề',
    'thu thập dữ liệu',
    'làm sạch',
    'sử dụng các mô hình'
  ];
  return [...items].sort((a, b) => {
    const aStr = String(typeof a === 'object' ? a.text : a).toLowerCase();
    const bStr = String(typeof b === 'object' ? b.text : b).toLowerCase();
    const aIdx = orderWeights.findIndex(w => aStr.includes(w));
    const bIdx = orderWeights.findIndex(w => bStr.includes(w));
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  });
}

function OrderingQuestion({ q, userAnswer, onReorder, onReset }) {
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const initialItems = useMemo(() => {
    return getOrderingItems(q);
  }, [q]);

  const currentItems = useMemo(() => {
    if (Array.isArray(userAnswer) && userAnswer.length > 0) {
      return userAnswer;
    }
    return initialItems;
  }, [userAnswer, initialItems]);

  const isAnswered = Array.isArray(userAnswer) && userAnswer.length > 0;

  const handleMove = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= currentItems.length || fromIdx === toIdx) return;
    const next = [...currentItems];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onReorder(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: '0.5rem',
        fontSize: '0.8rem', 
        color: 'var(--text-tertiary)',
        marginBottom: '0.25rem',
        flexWrap: 'wrap'
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          💡 Kéo thả hoặc dùng các nút mũi tên ▲ / ▼ để sắp xếp các bước theo thứ tự chính xác:
        </span>
        {isAnswered && (
          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.55rem',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Khôi phục về vị trí ban đầu"
          >
            <RotateCcw size={12} />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        {currentItems.map((item, idx) => {
          const isDraggingThis = draggedIdx === idx;
          const isDragOverThis = dragOverIdx === idx;

          return (
            <div
              key={typeof item === 'object' ? item.id || idx : `${idx}_${String(item).substring(0, 20)}`}
              draggable
              onDragStart={(e) => {
                setDraggedIdx(idx);
                e.dataTransfer.effectAllowed = 'move';
                try {
                  e.dataTransfer.setData('text/plain', String(idx));
                } catch {}
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverIdx !== idx) setDragOverIdx(idx);
              }}
              onDragLeave={() => {
                if (dragOverIdx === idx) setDragOverIdx(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIdx(null);
                if (draggedIdx !== null && draggedIdx !== idx) {
                  handleMove(draggedIdx, idx);
                }
                setDraggedIdx(null);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: isDragOverThis 
                  ? '2px dashed var(--accent-primary)' 
                  : isAnswered 
                    ? '1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-color))' 
                    : '1px solid var(--border-color)',
                backgroundColor: isDragOverThis 
                  ? 'color-mix(in srgb, var(--accent-primary) 12%, var(--bg-surface-elevated))' 
                  : isAnswered 
                    ? 'color-mix(in srgb, var(--accent-primary) 4%, var(--bg-surface-elevated))' 
                    : 'var(--bg-surface-elevated)',
                opacity: isDraggingThis ? 0.35 : 1,
                cursor: 'grab',
                transition: 'border 0.2s, background-color 0.2s, opacity 0.2s',
                boxShadow: isDragOverThis ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                userSelect: 'none'
              }}
            >
              {/* Grip icon */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: 'var(--text-tertiary)',
                  cursor: 'grab',
                  flexShrink: 0
                }}
                title="Kéo thả để thay đổi vị trí"
              >
                <GripVertical size={18} />
              </div>

              {/* Step indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '4.5rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  fontSize: '0.76rem',
                  letterSpacing: '0.02em',
                  flexShrink: 0,
                  border: '1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)'
                }}
              >
                Bước {idx + 1}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: '1.55', userSelect: 'text' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{ p: ({node, ...props}) => <span {...props} /> }}
                >
                  {typeof item === 'object' ? item.text || JSON.stringify(item) : String(item)}
                </ReactMarkdown>
              </div>

              {/* Action buttons (Up/Down) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMove(idx, idx - 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: idx === 0 ? 'transparent' : 'var(--bg-base)',
                    color: idx === 0 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    opacity: idx === 0 ? 0.35 : 1,
                    transition: 'all 0.15s',
                    padding: 0
                  }}
                  onMouseOver={(e) => {
                    if (idx > 0) {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = 'var(--accent-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (idx > 0) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                    }
                  }}
                  title="Di chuyển lên trên"
                >
                  <ArrowUp size={15} />
                </button>

                <button
                  type="button"
                  disabled={idx === currentItems.length - 1}
                  onClick={() => handleMove(idx, idx + 1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '30px',
                    height: '30px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: idx === currentItems.length - 1 ? 'transparent' : 'var(--bg-base)',
                    color: idx === currentItems.length - 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: idx === currentItems.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: idx === currentItems.length - 1 ? 0.35 : 1,
                    transition: 'all 0.15s',
                    padding: 0
                  }}
                  onMouseOver={(e) => {
                    if (idx < currentItems.length - 1) {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = 'var(--accent-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (idx < currentItems.length - 1) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-base)';
                    }
                  }}
                  title="Di chuyển xuống dưới"
                >
                  <ArrowDown size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MultipleChoiceViewer({ problem, value, onChange }) {
  const answers = useMemo(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  }, [value]);

  const handleSelect = (qIndex, optionLetter) => {
    let newAnswers = { ...answers };
    let current = newAnswers[qIndex] || [];
    if (!Array.isArray(current)) current = [current];
    if (current.includes(optionLetter)) {
      current = current.filter(l => l !== optionLetter);
    } else {
      current = [...current, optionLetter].sort();
    }
    if (current.length === 0) delete newAnswers[qIndex];
    else newAnswers[qIndex] = current;
    onChange(JSON.stringify(newAnswers));
  };

  const handleOrderingReorder = (qIndex, newOrder) => {
    const newAnswers = { ...answers, [qIndex]: newOrder };
    onChange(JSON.stringify(newAnswers));
  };

  const handleOrderingReset = (qIndex) => {
    const newAnswers = { ...answers };
    delete newAnswers[qIndex];
    onChange(JSON.stringify(newAnswers));
  };

  if (!problem || !problem.questions) return null;

  return (
    <div style={{ padding: '2rem', overflowY: 'auto', height: '100%', backgroundColor: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem' }}>{problem.title || 'Trắc nghiệm lý thuyết'}</h2>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Lựa chọn đáp án hoặc sắp xếp các bước theo yêu cầu. Nhấn <strong>Submit</strong> để nộp bài và chấm điểm.
          </p>
        </div>
        {Object.keys(answers).length > 0 && (
          <button
            onClick={() => onChange('{}')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Clear Answers
          </button>
        )}
      </div>

      {problem.questions.map((q, qIndex) => {
        const isOrdering = isOrderingQuestion(q);
        const selected = answers[qIndex];
        const isAnswered = isOrdering 
          ? (Array.isArray(selected) && selected.length > 0)
          : (Array.isArray(selected) ? selected.length > 0 : !!selected);
        const selectedCount = Array.isArray(selected) ? selected.length : (selected ? 1 : 0);

        let qDisplay = q.text || '';
        if (isOrdering) {
          if (qDisplay.includes('Các bước gồm:')) {
            qDisplay = qDisplay.split('Các bước gồm:')[0].trim();
          }
          if (!qDisplay.toLowerCase().includes('sắp xếp')) {
            qDisplay += '\n\n*Hãy sắp xếp các bước sau theo đúng quy trình từ bước đầu tiên đến bước cuối cùng:*';
          }
        }
        
        return (
          <div key={qIndex} style={{ marginBottom: '1.75rem', padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Câu {qIndex + 1} / {problem.questions.length}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isOrdering ? (
                  <>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: isAnswered ? 'var(--accent-primary)' : 'var(--text-tertiary)', 
                      backgroundColor: isAnswered ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'var(--bg-base)', 
                      padding: '0.15rem 0.55rem', 
                      borderRadius: '1rem', 
                      fontWeight: 500,
                      border: isAnswered ? '1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent)' : '1px solid var(--border-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <ListOrdered size={13} />
                      {isAnswered ? 'Đã sắp xếp' : 'Chưa sắp xếp'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', backgroundColor: 'var(--bg-base)', padding: '0.15rem 0.55rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      Sắp xếp thứ tự
                    </span>
                  </>
                ) : (
                  <>
                    {selectedCount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)', padding: '0.15rem 0.5rem', borderRadius: '1rem', fontWeight: 500 }}>
                        Đã chọn: {Array.isArray(selected) ? selected.join(', ') : selected}
                      </span>
                    )}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-base)', padding: '0.15rem 0.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      Chọn nhiều đáp án
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.02rem', lineHeight: '1.6' }}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeKatex]}
              >
                {qDisplay}
              </ReactMarkdown>
            </div>

            {isOrdering ? (
              <OrderingErrorBoundary>
                <OrderingQuestion
                  q={q}
                  userAnswer={selected}
                  onReorder={(newOrder) => handleOrderingReorder(qIndex, newOrder)}
                  onReset={() => handleOrderingReset(qIndex)}
                />
              </OrderingErrorBoundary>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(q.options || []).map((opt, oIndex) => {
                  const match = opt.match(/^([A-Z])\./);
                  const letter = match ? match[1] : String.fromCharCode(65 + oIndex);
                  const isSelected = (Array.isArray(selected) && selected.includes(letter)) || selected === letter;
                  
                  return (
                    <label 
                      key={oIndex} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.75rem', 
                        padding: '0.75rem 1rem', 
                        borderRadius: 'var(--radius-sm)', 
                        border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-primary) 10%, transparent)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        name={`q_${qIndex}`} 
                        value={letter} 
                        checked={isSelected}
                        onChange={() => handleSelect(qIndex, letter)}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[rehypeRaw, rehypeKatex]}
                          components={{ p: ({node, ...props}) => <span {...props} /> }}
                        >
                          {opt}
                        </ReactMarkdown>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
