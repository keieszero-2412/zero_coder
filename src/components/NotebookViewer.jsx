import React, { useState, useEffect, useMemo, useRef, useCallback, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { getCodeTheme } from '../theme/CodeTheme';
import { useSettings } from '../context/SettingsContext';
import rehypeRaw from 'rehype-raw';
import { Play, Loader2, Check, List, AlertTriangle, Lightbulb, PlayCircle, Copy } from 'lucide-react';
import { usePython } from '../hooks/usePython';
import { preprocessMarkdown } from '../utils/latexHelper';
import ImagePreview from './ImagePreview';

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
      <div style={{ position: 'relative', margin: '0.75rem 0', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)', padding: '0.3rem 0.75rem', fontSize: '0.7rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{match[1]}</span>
          <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: copied ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', transition: 'color 0.2s' }} title="Copy code">
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        <pre style={{ margin: 0, padding: '0.75rem', backgroundColor: 'var(--bg-base)', overflowX: 'auto' }} {...props}>
          <code className={className} style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            {children}
          </code>
        </pre>
      </div>
    );
  }
  return <code className={className} style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.15rem 0.35rem', borderRadius: '0.2rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)' }} {...props}>{children}</code>;
};

const notebookCache = new Map();

export const NotebookViewer = React.forwardRef(function NotebookViewer(
  { notebookUrl, datasetsDir, datasetFiles, onCellSelect, onRunningChange },
  ref
) {
  const { settings } = useSettings();
  const [notebook, setNotebook] = useState(() => notebookCache.get(notebookUrl) || null);
  const [loading, setLoading] = useState(!notebookCache.has(notebookUrl));
  const [error, setError] = useState(null);
  const { isLoaded, runCode, output, clearOutput, mountFiles, preloadPackages } = usePython();
  
  const [activeCellIndex, setActiveCellIndex] = useState(null);
  const [cellOutputs, setCellOutputs] = useState({});
  const [cellCodes, setCellCodes] = useState(() => {
    const cached = notebookCache.get(notebookUrl);
    if (!cached) return {};
    const codes = {};
    cached.cells.forEach((cell, i) => {
      if (cell.cell_type === 'code') {
        let source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
        if (source.trim() === '') {
          source = '# Viết code của bạn vào đây...\n';
        }
        codes[i] = source;
      }
    });
    return codes;
  });
  const [isRunning, setIsRunning] = useState(false);
  const [runCells, setRunCells] = useState(new Set()); // Track which cells have been run
  const [showTOC, setShowTOC] = useState(false);
  const [showHints, setShowHints] = useState(true); // Show beginner hints initially
  const cellRefs = useRef({});
  const contentRef = useRef(null);

  useEffect(() => {
    async function fetchNotebook() {
      if (!notebookUrl) return;
      if (notebookCache.has(notebookUrl)) {
        const data = notebookCache.get(notebookUrl);
        setNotebook(data);
        setLoading(false);
        const codes = {};
        data.cells.forEach((cell, i) => {
          if (cell.cell_type === 'code') {
            let source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
            if (source.trim() === '') {
              source = '# Viết code của bạn vào đây...\n';
            }
            codes[i] = source;
          }
        });
        setCellCodes(codes);
        setCellOutputs({});
        setRunCells(new Set());
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(notebookUrl);
        if (!res.ok) throw new Error('Failed to load notebook');
        const data = await res.json();
        notebookCache.set(notebookUrl, data);
        setNotebook(data);
        
        // Initialize codes state from ALL cells
        const codes = {};
        data.cells.forEach((cell, i) => {
          if (cell.cell_type === 'code') {
            let source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
            if (source.trim() === '') {
              source = '# Viết code của bạn vào đây...\n';
            }
            codes[i] = source;
          }
        });
        setCellCodes(codes);
        setCellOutputs({});
        setRunCells(new Set());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotebook();
  }, [notebookUrl]);

  useEffect(() => {
    if (isLoaded && datasetFiles && datasetFiles.length > 0) {
      const filesToMount = [];
      datasetFiles.forEach(f => {
        const originalPath = f.replace(/^\/lectures\/[^\/]+\//, '');
        const aliasPath = f.replace(/^\/lectures\/[^\/]+\/[^\/]+\//, 'datasets/');
        const fileName = f.split('/').pop();
        
        filesToMount.push({ url: f, path: originalPath });
        if (originalPath !== aliasPath) {
          filesToMount.push({ url: f, path: aliasPath });
        }
        if (fileName && fileName !== originalPath && fileName !== aliasPath) {
          filesToMount.push({ url: f, path: fileName });
        }
      });
      mountFiles(filesToMount).catch(console.error);
    }
  }, [isLoaded, datasetFiles, mountFiles]);

  // Preload/pre-warm all wheels used in this notebook in background once loaded
  useEffect(() => {
    if (!isLoaded || !notebook?.cells || !preloadPackages) return;
    const allCode = notebook.cells
      .filter(c => c.cell_type === 'code')
      .map(c => (Array.isArray(c.source) ? c.source.join('') : (c.source || '')))
      .join('\n');
    if (allCode.trim()) {
      preloadPackages(allCode).catch(console.error);
    }
  }, [isLoaded, notebook, preloadPackages]);

  // Sync live output to the active cell's output while streaming
  useEffect(() => {
    if (activeCellIndex !== null && output && output.length > 0) {
      setCellOutputs(prev => ({
        ...prev,
        [activeCellIndex]: output
      }));
    }
  }, [output, activeCellIndex]);

  // Build TOC from markdown headings
  const tocItems = useMemo(() => {
    if (!notebook) return [];
    const items = [];
    notebook.cells.forEach((cell, index) => {
      if (cell.cell_type === 'markdown') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
        const lines = source.split('\n');
        for (const line of lines) {
          const match = line.match(/^(#{1,3})\s+(.+)/);
          if (match) {
            items.push({
              level: match[1].length,
              text: match[2].trim(),
              cellIndex: index,
            });
          }
        }
      }
    });
    return items;
  }, [notebook]);

  // Count code cells and completed
  const codeCellStats = useMemo(() => {
    if (!notebook) return { total: 0, run: 0 };
    const codeCellIndices = notebook.cells
      .map((c, i) => c.cell_type === 'code' ? i : -1)
      .filter(i => i >= 0);
    return {
      total: codeCellIndices.length,
      run: codeCellIndices.filter(i => runCells.has(i)).length,
    };
  }, [notebook, runCells]);

  const handleRunCell = useCallback(async (index) => {
    if (!isLoaded || isRunning) return;
    setActiveCellIndex(index);
    clearOutput();
    setCellOutputs(prev => ({ ...prev, [index]: [] }));
    setIsRunning(true);
    if (onRunningChange) onRunningChange(true);
    
    // Notify parent about active cell
    if (onCellSelect) {
      onCellSelect(index, cellCodes[index], []);
    }
    
    try {
      const resultOutputs = await runCode(cellCodes[index]);
      if (Array.isArray(resultOutputs)) {
        setCellOutputs(prev => ({ ...prev, [index]: resultOutputs }));
      }
      setRunCells(prev => new Set([...prev, index]));
    } catch (err) {
      // Error handled by usePython
    } finally {
      setIsRunning(false);
      if (onRunningChange) onRunningChange(false);
    }
  }, [isLoaded, isRunning, clearOutput, runCode, cellCodes, onCellSelect, onRunningChange]);

  const handleRunAll = useCallback(async () => {
    if (!isLoaded || isRunning || !notebook) return;
    setIsRunning(true);
    if (onRunningChange) onRunningChange(true);

    const codeCells = notebook.cells
      .map((c, i) => ({ cell: c, index: i }))
      .filter(({ cell }) => cell.cell_type === 'code');

    // Preload packages for the whole notebook in one quick pass if not already loaded
    const fullCode = codeCells.map(({ index }) => cellCodes[index] || '').join('\n');
    if (preloadPackages && fullCode.trim()) {
      await preloadPackages(fullCode);
    }

    for (const { index } of codeCells) {
      const code = cellCodes[index] || '';
      if (!code.trim()) continue;

      setActiveCellIndex(index);
      clearOutput();

      if (onCellSelect) {
        onCellSelect(index, code, []);
      }

      // Fast scroll into view without animation lag
      cellRefs.current[index]?.scrollIntoView({ behavior: 'auto', block: 'nearest' });

      try {
        const resultOutputs = await runCode(code);
        if (Array.isArray(resultOutputs)) {
          setCellOutputs(prev => ({ ...prev, [index]: resultOutputs }));
        }
        setRunCells(prev => new Set([...prev, index]));
      } catch (err) {
        console.error("Error running cell during Run All", index, err);
        break;
      }
    }

    setIsRunning(false);
    if (onRunningChange) onRunningChange(false);
  }, [isLoaded, isRunning, notebook, cellCodes, clearOutput, runCode, preloadPackages, onCellSelect, onRunningChange]);

  const handleRunAllAbove = useCallback(async (targetIndex) => {
    if (!isLoaded || isRunning || !notebook) return;
    setIsRunning(true);
    if (onRunningChange) onRunningChange(true);
    
    const codeCellsAbove = notebook.cells
      .map((c, i) => ({ cell: c, index: i }))
      .filter(({ cell, index }) => cell.cell_type === 'code' && index <= targetIndex);

    const notebookCode = codeCellsAbove
      .map(({ index }) => cellCodes[index] || '')
      .filter(source => source.trim())
      .join('\n\n');

    setActiveCellIndex(targetIndex);
    clearOutput();
    setCellOutputs(prev => ({ ...prev, [targetIndex]: [] }));
    try {
      if (preloadPackages && notebookCode.trim()) {
        await preloadPackages(notebookCode);
      }
      const resultOutputs = await runCode(notebookCode);
      if (Array.isArray(resultOutputs)) {
        setCellOutputs(prev => ({ ...prev, [targetIndex]: resultOutputs }));
      }
      setRunCells(prev => new Set([...prev, ...codeCellsAbove.map(({ index }) => index)]));
    } finally {
      setIsRunning(false);
      if (onRunningChange) onRunningChange(false);
    }
  }, [isLoaded, isRunning, notebook, clearOutput, runCode, preloadPackages, cellCodes, onRunningChange]);

  useImperativeHandle(ref, () => ({
    runAll: handleRunAll,
    isRunning: isRunning,
  }), [handleRunAll, isRunning]);

  const handleCodeChange = (index, val) => {
    setCellCodes(prev => ({ ...prev, [index]: val }));
  };

  const handleCellClick = (index) => {
    if (onCellSelect) {
      onCellSelect(index, cellCodes[index], cellOutputs[index]);
    }
  };

  const scrollToCell = (cellIndex) => {
    const el = cellRefs.current[cellIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowTOC(false);
  };

  // Render output with DataFrame detection
  const renderOutput = (outputArr) => {
    if (!outputArr || outputArr.length === 0) return null;
    
    return outputArr.map((out, i) => {
      const text = out.text || '';
      const isStderr = out.type === 'stderr';
      const isWarning = isStderr && /(UserWarning|DeprecationWarning|FutureWarning|RuntimeWarning|SyntaxWarning|ImportWarning):/i.test(text) && !/Traceback \(most recent call last\):/i.test(text);
      const isError = isStderr && !isWarning;
      
      // Detect DataFrame-like table output (has header separator like ---+---)
      const lines = text.split('\n').filter(l => l.trim());
      const looksLikeTable = lines.length >= 2 && lines.some(l => /^\s*[\d\s]+/.test(l)) && lines[0].includes('  ');

      if (isError) {
        return (
          <div key={i} style={{
            fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap',
            color: 'var(--error)', marginBottom: '0.25rem',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{text}</span>
          </div>
        );
      }

      if (isWarning) {
        return (
          <div key={i} style={{
            fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap',
            color: 'var(--warning, #eab308)', marginBottom: '0.25rem',
            display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{text}</span>
          </div>
        );
      }

      // Parse __IMAGE_BASE64__ blocks
      const renderTextWithImages = (content) => {
        if (!content.includes('__IMAGE_BASE64__')) return content;
        const parts = content.split('__IMAGE_BASE64__');
        return parts.map((part, idx) => {
          if (idx === 0) return part; // text before first image
          if (part.includes('__IMAGE_END__')) {
            const [base64, rest] = part.split('__IMAGE_END__');
            return (
              <React.Fragment key={idx}>
                <ImagePreview 
                  src={`data:image/png;base64,${base64.replace(/\s+/g, '')}`} 
                  alt="plot output" 
                />
                {rest}
              </React.Fragment>
            );
          }
          return '__IMAGE_BASE64__' + part; // malformed output
        });
      };

      return (
        <div key={i} style={{
          fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'pre-wrap',
          color: 'var(--text-primary)', marginBottom: '0.25rem',
          overflowX: 'auto',
        }}>
          {renderTextWithImages(text)}
        </div>
      );
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
      <div className="loading-spinner" style={{ marginBottom: '1rem', width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ color: 'var(--text-secondary)' }}>Đang tải notebook...</p>
    </div>
  );
  
  if (error) return <div style={{ color: 'var(--error)', padding: '2rem', textAlign: 'center' }}>Error: {error}</div>;
  if (!notebook) return null;

  // Number code cells sequentially
  let codeCounter = 0;

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* TOC Sidebar */}
      {showTOC && tocItems.length > 0 && (
        <div className="notebook-toc" style={{
          width: '260px', minWidth: '220px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          overflowY: 'auto',
          padding: '1rem',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
            Mục lục
          </div>
          {tocItems.map((item, i) => (
            <button
              key={i}
              className="toc-item"
              onClick={() => scrollToCell(item.cellIndex)}
              style={{
                paddingLeft: `${(item.level - 1) * 0.75 + 0.5}rem`,
                fontSize: item.level === 1 ? '0.85rem' : '0.8rem',
                fontWeight: item.level === 1 ? 600 : 400,
                textAlign: 'left'
              }}
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeRaw, rehypeKatex]}
                components={{
                  p: ({node, ...props}) => <span {...props} />,
                  code: ({inline, className, children, ...props}) => {
                    return <code style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.1rem 0.2rem', borderRadius: '0.2rem', fontSize: '0.9em', fontFamily: 'monospace', color: 'var(--text-primary)' }} {...props}>{children}</code>;
                  }
                }}
              >
                {preprocessMarkdown(item.text)}
              </ReactMarkdown>
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {/* Progress Bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.5rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="button-secondary"
            style={{ padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            title="Mục lục"
          >
            <List size={14} />
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              flex: 1, height: '6px',
              backgroundColor: 'var(--bg-base)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: codeCellStats.total > 0 ? `${(codeCellStats.run / codeCellStats.total) * 100}%` : '0%',
                backgroundColor: 'var(--accent-primary)',
                borderRadius: '3px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {codeCellStats.run}/{codeCellStats.total} cells
            </span>
          </div>

          {!isLoaded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              <Loader2 size={12} className="spin" />
              Python...
            </div>
          )}
        </div>

        {/* Beginner Hint Banner */}
        {showHints && (
          <div style={{
            margin: '1rem 1.5rem 0',
            padding: '0.75rem 1rem',
            backgroundColor: 'color-mix(in srgb, var(--accent-primary) 10%, var(--bg-surface))',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 25%, var(--border-color))',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            <Lightbulb size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Hướng dẫn:</strong>{' '}
              Đọc phần giải thích, rồi nhấn <strong>▶ Run</strong> để chạy từng block code theo thứ tự. Bạn có thể sửa code trước khi chạy. Nếu gặp lỗi, hãy nhấn <strong>Ask AI</strong> ở góc trên.<br/>
              <span style={{ color: 'var(--accent-primary)' }}>💡 Mẹo:</span> Các file dữ liệu đính kèm (csv, ảnh, v.v) nằm ở biểu tượng 📁 bên trái.
            </div>
            <button onClick={() => setShowHints(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
              Ẩn
            </button>
          </div>
        )}

        {/* Notebook Cells - ALL cells rendered in order */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
          {notebook.cells.map((cell, index) => {
            if (cell.cell_type === 'markdown') {
              let source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
              // Build attachment lookup map — resolve data URLs in img component,
              // NOT in the markdown source, to avoid parser corruption of long base64 strings
              const attachmentMap = {};
              if (cell.attachments) {
                Object.keys(cell.attachments).forEach(filename => {
                  const mimeType = Object.keys(cell.attachments[filename])[0];
                  let base64Data = cell.attachments[filename][mimeType];
                  if (Array.isArray(base64Data)) {
                    base64Data = base64Data.join('');
                  }
                  base64Data = base64Data.replace(/\s+/g, '');
                  attachmentMap[`attachment:${filename}`] = `data:${mimeType};base64,${base64Data}`;
                });
              }
              return (
                <div
                  key={index}
                  ref={el => cellRefs.current[index] = el}
                  className="notebook-cell markdown-cell"
                  style={{ scrollMarginTop: '60px', marginBottom: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.7 }}
                >
                  <ReactMarkdown 
                    urlTransform={(value) => value}
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                    components={{ 
                      code: CodeBlock,
                      img: ({node, src, ...props}) => {
                        const resolvedSrc = attachmentMap[src] || src;
                        return <ImagePreview src={resolvedSrc} {...props} />;
                      }
                    }}
                  >
                    {preprocessMarkdown(source)}
                  </ReactMarkdown>
                </div>
              );
            } else if (cell.cell_type === 'code') {
              codeCounter++;
              const cellNum = codeCounter;
              const isThisCellRunning = isRunning && activeCellIndex === index;
              const currentOutput = cellOutputs[index] || [];
              const hasRun = runCells.has(index);
              const hasError = currentOutput.some(o => o.type === 'stderr' && !/(UserWarning|DeprecationWarning|FutureWarning|RuntimeWarning|SyntaxWarning|ImportWarning):/i.test(o.text || ''));
              const hasWarning = !hasError && currentOutput.some(o => o.type === 'stderr');
              
              return (
                <div
                  key={index}
                  ref={el => cellRefs.current[index] = el}
                  className="notebook-cell code-cell"
                  onClick={() => handleCellClick(index)}
                  style={{ 
                    marginBottom: '1.5rem', 
                    border: `1px solid ${hasError ? 'color-mix(in srgb, var(--error) 40%, var(--border-color))' : (hasWarning ? 'color-mix(in srgb, var(--warning, #eab308) 40%, var(--border-color))' : 'var(--border-color)')}`,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-surface)',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer',
                    scrollMarginTop: '60px'
                  }}
                >
                  {/* Cell Header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderBottom: '1px solid var(--border-color)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        color: hasRun ? (hasError ? 'var(--error)' : (hasWarning ? 'var(--warning, #eab308)' : 'var(--accent-primary)')) : 'var(--text-tertiary)',
                        fontFamily: 'monospace',
                      }}>
                        [{cellNum}]
                      </span>
                      {hasRun && !hasError && !hasWarning && (
                        <Check size={12} color="var(--accent-primary)" />
                      )}
                      {hasRun && hasWarning && !hasError && (
                        <AlertTriangle size={12} color="var(--warning, #eab308)" />
                      )}
                      {hasError && (
                        <AlertTriangle size={12} color="var(--error)" />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {cellNum > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRunAllAbove(index); }}
                          disabled={!isLoaded || isRunning}
                          className="button-secondary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          title="Chạy tất cả cells từ đầu đến cell này"
                        >
                          <PlayCircle size={11} />
                          Run All Above
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRunCell(index); }}
                        disabled={!isLoaded || isRunning}
                        className="button-primary"
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        {isThisCellRunning ? <Loader2 size={13} className="spin" /> : <Play size={13} />}
                        Run
                      </button>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <CodeMirror
                    value={cellCodes[index] || ''}
                    height="auto"
                    theme={getCodeTheme(settings?.theme)}
                    extensions={[python()]}
                    onChange={(val) => handleCodeChange(index, val)}
                    basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
                  />
                  
                  {/* Output */}
                  {currentOutput.length > 0 && (
                    <div className="cell-output" style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--bg-base)',
                      borderTop: '1px solid var(--border-color)',
                      maxHeight: '400px',
                      overflowY: 'auto',
                    }}>
                      {renderOutput(currentOutput)}
                    </div>
                  )}
                </div>
              );
            }
            // Render raw cells too (rare but keep all content)
            if (cell.cell_type === 'raw') {
              const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
              return (
                <div key={index} ref={el => cellRefs.current[index] = el} style={{
                  marginBottom: '1rem', padding: '1rem', scrollMarginTop: '60px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace', fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap', color: 'var(--text-secondary)',
                }}>
                  {source}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
});
