import React, { useState } from 'react';
import { Folder, FileText, FileSpreadsheet, FileImage, File, ChevronRight, ChevronDown, Download, Eye, X, Maximize2, Minimize2 } from 'lucide-react';
import '../index.css';

const getFileIcon = (filename) => {
  if (filename.endsWith('.csv') || filename.endsWith('.xlsx')) return <FileSpreadsheet size={16} color="#10b981" />;
  if (filename.endsWith('.png') || filename.endsWith('.jpg')) return <FileImage size={16} color="#3b82f6" />;
  if (filename.endsWith('.txt') || filename.endsWith('.json')) return <FileText size={16} color="#f59e0b" />;
  return <File size={16} color="var(--text-secondary)" />;
};

export function FileBrowser({ lectureId, datasetFiles = [] }) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!datasetFiles || datasetFiles.length === 0) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center' }}>
        No dataset files found.
      </div>
    );
  }

  const tree = {};
  datasetFiles.forEach(originalPath => {
    // Visually replace specific dataset folder names with generic 'datasets'
    const displayPath = originalPath.replace(/^L\d+_datasets(\/|$)/i, 'datasets$2');
    const parts = displayPath.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = { _isFile: true, originalPath };
      } else {
        if (!current[part]) {
          current[part] = { _isFile: false, children: {} };
        }
        current = current[part].children;
      }
    }
  });

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handlePreview = async (fullPath, name) => {
    const fileUrl = `/lectures/${lectureId}/${fullPath}`;
    const type = name.endsWith('.png') || name.endsWith('.jpg') ? 'image' : 'text';
    
    setPreviewFile({ url: fileUrl, name, type, content: null });
    setIsPreviewExpanded(false);
    
    if (type === 'text') {
      setIsLoading(true);
      try {
        const res = await fetch(fileUrl);
        const text = await res.text();
        setPreviewFile(prev => ({ ...prev, content: text }));
      } catch (e) {
        setPreviewFile(prev => ({ ...prev, content: 'Error loading file content.' }));
      }
      setIsLoading(false);
    }
  };

  const renderTree = (node, path = '', level = 0) => {
    return Object.keys(node).sort().map(key => {
      const item = node[key];
      const fullPath = path ? `${path}/${key}` : key;
      const isExpanded = expandedFolders[fullPath] !== false;

      if (item._isFile) {
        const fileUrl = `/lectures/${lectureId}/${item.originalPath}`;
        return (
          <div 
            key={fullPath} 
            style={{ 
              paddingLeft: `${level * 12}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '0.4rem 0.5rem', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' 
            }} 
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            className="file-item"
            onClick={() => handlePreview(item.originalPath, key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              {getFileIcon(key)}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={key}>{key}</span>
            </div>
            <div className="file-actions" style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => handlePreview(item.originalPath, key)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.2rem', borderRadius: '4px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.color = 'var(--accent-primary)'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }} title="View Dataset">
                <Eye size={14} />
              </button>
              <a href={fileUrl} download style={{ color: 'var(--text-tertiary)', padding: '0.2rem', borderRadius: '4px' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; e.currentTarget.style.color = '#10b981'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }} title="Download">
                <Download size={14} />
              </a>
            </div>
          </div>
        );
      }

      return (
        <div key={fullPath}>
          <div 
            onClick={() => toggleFolder(fullPath)}
            style={{ 
              paddingLeft: `${level * 12}px`, display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.4rem 0.5rem', cursor: 'pointer', borderRadius: '4px', transition: 'background-color 0.2s' 
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            className="folder-item"
          >
            {isExpanded ? <ChevronDown size={14} color="var(--text-tertiary)" /> : <ChevronRight size={14} color="var(--text-tertiary)" />}
            <Folder size={16} color="#fbbf24" fill={isExpanded ? "#fef3c7" : "transparent"} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{key}</span>
          </div>
          {isExpanded && (
            <div>
              {renderTree(item.children, fullPath, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderDataContent = (content, filename) => {
    if (!content) return null;

    if (filename.endsWith('.csv')) {
      const lines = content.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) return <div>Empty CSV</div>;
      
      const parseRow = (row) => {
        const cells = [];
        let inQuotes = false;
        let cell = '';
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
          if (char === '"' && row[i + 1] === '"') {
            cell += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            cells.push(cell.trim());
            cell = '';
          } else if (char !== '\r') {
            cell += char;
          }
        }
        cells.push(cell.trim());
        return cells;
      };

      const header = parseRow(lines[0]);
      const rows = lines.slice(1, 101).map(parseRow);

      return (
        <div style={{ overflowX: 'auto', maxWidth: '100%', height: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                {header.map((h, i) => (
                  <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rowIndex % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-surface)', transition: 'background-color 0.1s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'} onMouseOut={e => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-surface)'}>
                  {header.map((_, colIndex) => (
                    <td key={colIndex} style={{ padding: '0.5rem 1rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      {row[colIndex] !== undefined ? row[colIndex] : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {lines.length > 101 && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic', backgroundColor: 'var(--bg-base)' }}>
              Showing first 100 rows. (Total: {lines.length - 1} rows)
            </div>
          )}
        </div>
      );
    }
    
    if (filename.endsWith('.json')) {
      try {
        const data = JSON.parse(content);
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          const header = Object.keys(data[0]);
          const rows = data.slice(0, 100);
          return (
            <div style={{ overflowX: 'auto', maxWidth: '100%', height: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ backgroundColor: 'var(--bg-surface-elevated)' }}>
                    {header.map((h, i) => (
                      <th key={i} style={{ padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '2px solid var(--border-color)', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: rowIndex % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-surface)', transition: 'background-color 0.1s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'} onMouseOut={e => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-surface)'}>
                      {header.map((h, colIndex) => (
                        <td key={colIndex} style={{ padding: '0.5rem 1rem', borderRight: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 100 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontStyle: 'italic', backgroundColor: 'var(--bg-base)' }}>
                  Showing first 100 rows. (Total: {data.length} rows)
                </div>
              )}
            </div>
          );
        }
      } catch (e) {
      }
    }

    return (
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
        {content}
      </pre>
    );
  };

  return (
    <>
      <div className="file-browser" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ 
          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', 
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--bg-surface-elevated)'
        }}>
          <Folder size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Dataset Files
          </span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
          <div style={{ 
            backgroundColor: 'var(--bg-base)', padding: '0.5rem', borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)', minHeight: '200px'
          }}>
            {renderTree(tree)}
          </div>
        </div>
      </div>

      {previewFile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setPreviewFile(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            width: isPreviewExpanded ? '95vw' : '700px',
            height: isPreviewExpanded ? '95vh' : '80vh',
            maxWidth: '100%',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {getFileIcon(previewFile.name)}
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{previewFile.name}</h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsPreviewExpanded(!isPreviewExpanded)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-primary)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {isPreviewExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={() => setPreviewFile(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = 'var(--error)'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', padding: '0', backgroundColor: 'var(--bg-base)' }}>
              {previewFile.type === 'image' ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '1.5rem' }}>
                  <img src={previewFile.url} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }} />
                </div>
              ) : (
                isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                    <div className="loading-spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <div style={{ padding: previewFile.name.endsWith('.csv') || previewFile.name.endsWith('.json') ? '0' : '1.5rem', height: '100%' }}>
                    {renderDataContent(previewFile.content, previewFile.name)}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
