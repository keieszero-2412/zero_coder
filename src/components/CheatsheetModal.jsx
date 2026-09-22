import { useState, useMemo, useEffect } from 'react';
import { CHEATSHEETS, MIDTERM_CHEATSHEETS, getAllCheatsheetItems } from '../data/cheatsheets';
import { Copy, Check } from 'lucide-react';

const LECTURE_COLORS = {
  // Mid-term Topics
  Topic1: '#3b82f6', // Blue
  Topic2: '#10b981', // Emerald
  Topic3: '#8b5cf6', // Purple
  Topic4: '#f59e0b', // Amber
  Topic5: '#06b6d4', // Cyan
  // Last-term Lectures
  Lecture5: '#3b82f6', // Blue
  Lecture6: '#10b981', // Emerald
  Lecture7: '#f59e0b', // Amber
  Lecture8: '#8b5cf6', // Purple
  Lecture9: '#06b6d4', // Cyan
  Lecture10: '#ec4899', // Pink
  Lecture11: '#f97316', // Orange
  Lecture12: '#14b8a6', // Teal
};

export const TOPIC_SHORT_NAMES = {
  // Mid-term Topics
  Topic1: 'Topic 1: Types & Strings',
  Topic2: 'Topic 2: Lists',
  Topic3: 'Topic 3: Dicts & Sets',
  Topic4: 'Topic 4: Loops & Functions',
  Topic5: 'Topic 5: Math & Algorithms',
  // Last-term Lectures
  Lecture5: 'Lec 5: Data I/O & SQL',
  Lecture6: 'Lec 6: Data Wrangling',
  Lecture7: 'Lec 7: EDA & Stats',
  Lecture8: 'Lec 8: Visualization',
  Lecture9: 'Lec 9: Linear Regression',
  Lecture10: 'Lec 10: Polynomial & Pipeline',
  Lecture11: 'Lec 11: Model Evaluation',
  Lecture12: 'Lec 12: Classification',
};

export function CheatsheetModal({ 
  isOpen, 
  onClose, 
  initialLectureId = null, 
  mode = 'single', // 'master' | 'single'
  term = 'last' // 'mid' | 'last'
}) {
  const isMidterm = term === 'mid';
  const currentSource = isMidterm ? MIDTERM_CHEATSHEETS : CHEATSHEETS;
  const defaultInitialId = isMidterm ? 'Topic1' : 'Lecture5';
  const effectiveInitialId = initialLectureId && currentSource[initialLectureId] ? initialLectureId : defaultInitialId;

  const [selectedLectureFilter, setSelectedLectureFilter] = useState('all');
  const [singleLectureId, setSingleLectureId] = useState(effectiveInitialId);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (effectiveInitialId && currentSource[effectiveInitialId]) {
      setSingleLectureId(effectiveInitialId);
    }
  }, [effectiveInitialId, term]);

  useEffect(() => {
    setSelectedCategory('all');
    setSearchQuery('');
    if (mode === 'master') {
      setSelectedLectureFilter('all');
    }
  }, [mode, singleLectureId, term]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const isMaster = mode === 'master';
  const currentSingleLecture = currentSource[singleLectureId] || currentSource[defaultInitialId];

  // Categories available for filtering
  const availableCategories = useMemo(() => {
    if (!isMaster) {
      return currentSingleLecture?.categories || [];
    }
    if (selectedLectureFilter !== 'all' && currentSource[selectedLectureFilter]) {
      return currentSource[selectedLectureFilter].categories;
    }
    // All unique categories across all groups in current source
    const seen = new Set();
    const cats = [];
    Object.values(currentSource).forEach(group => {
      group.categories.forEach(cat => {
        if (!seen.has(cat.id)) {
          seen.add(cat.id);
          cats.push(cat);
        }
      });
    });
    return cats;
  }, [isMaster, selectedLectureFilter, currentSingleLecture, currentSource]);

  // Compute filtered items
  const filteredItems = useMemo(() => {
    let items = [];

    if (isMaster) {
      items = getAllCheatsheetItems(term);
      if (selectedLectureFilter !== 'all') {
        items = items.filter(item => item.lectureId === selectedLectureFilter);
      }
    } else if (currentSingleLecture) {
      currentSingleLecture.categories.forEach(cat => {
        cat.items.forEach(item => {
          items.push({
            ...item,
            lectureId: currentSingleLecture.lectureId,
            lectureTitle: currentSingleLecture.title,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        });
      });
    }

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.syntax.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    }

    return items;
  }, [isMaster, term, selectedLectureFilter, currentSingleLecture, selectedCategory, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    filteredItems.forEach(item => {
      const catKey = item.categoryId || item.categoryName || 'General';
      if (!groupMap.has(catKey)) {
        const groupObj = {
          id: catKey,
          name: item.categoryName || item.categoryId || 'General',
          lectureId: item.lectureId,
          lectureTitle: item.lectureTitle,
          items: []
        };
        groupMap.set(catKey, groupObj);
        groups.push(groupObj);
      }
      groupMap.get(catKey).items.push(item);
    });

    return groups;
  }, [filteredItems]);

  const handleCopy = (code, key) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const exportToCSV = () => {
    const headers = ['Lecture', 'Category', 'Command', 'Description', 'Example'];
    const rows = filteredItems.map(item => [
      item.lectureTitle || item.lectureId,
      item.categoryName,
      item.syntax,
      item.description + (item.note ? ` Note: ${item.note}` : ''),
      item.code
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          const formatted = String(cell || '').replace(/"/g, '""');
          return `"${formatted}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cheatsheet_${isMaster ? (isMidterm ? 'midterm' : 'lastterm') : currentSingleLecture.lectureId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? '0' : '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: isFullscreen ? '100vw' : '1320px',
          maxHeight: isFullscreen ? '100vh' : '92vh',
          height: isFullscreen ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          border: isFullscreen ? 'none' : '1px solid var(--border-color)',
          borderRadius: isFullscreen ? '0' : 'var(--radius-lg, 12px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          animation: 'scaleUp 0.2s ease-out',
          transition: 'all 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {isMaster 
                    ? (isMidterm ? 'Mid-term Python Cheatsheet' : 'Data Science Cheatsheet') 
                    : `Cheatsheet: ${currentSingleLecture?.title || ''}`}
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px',
                  backgroundColor: isMaster 
                    ? 'color-mix(in srgb, var(--accent-secondary, #6366f1) 18%, transparent)' 
                    : 'color-mix(in srgb, var(--accent-primary) 15%, transparent)',
                  color: isMaster ? 'var(--accent-secondary, #6366f1)' : 'var(--accent-primary)',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {isMaster ? (isMidterm ? 'Mid-term' : 'Last-term') : 'Syntax'}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {isMaster 
                  ? (selectedLectureFilter !== 'all' && currentSource[selectedLectureFilter]
                      ? `${currentSource[selectedLectureFilter].title}: ${currentSource[selectedLectureFilter].subtitle}`
                      : (isMidterm 
                          ? 'Python Mid-term Reference: 1. Types & Strings, 2. Lists, 3. Dicts & Sets, 4. Functions & Loops, 5. Math & Algorithms' 
                          : 'Data Science Reference: Data I/O, SQL, Wrangling, EDA, Visualization, Machine Learning')) 
                  : currentSingleLecture?.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Lecture switcher tab only when in Master mode */}
            {isMaster && (
              <div style={{
                display: 'flex',
                gap: '0.25rem',
                backgroundColor: 'var(--bg-surface)',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => {
                    setSelectedLectureFilter('all');
                    setSelectedCategory('all');
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedLectureFilter === 'all' ? 'var(--accent-secondary, #6366f1)' : 'transparent',
                    color: selectedLectureFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All
                </button>
                {Object.keys(currentSource).map(id => (
                  <button
                    key={id}
                    onClick={() => {
                      setSelectedLectureFilter(id);
                      setSelectedCategory('all');
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedLectureFilter === id ? 'var(--accent-secondary, #6366f1)' : 'transparent',
                      color: selectedLectureFilter === id ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {TOPIC_SHORT_NAMES[id] || (isMidterm ? id.replace('Topic', 'Topic ') : id.replace('Lecture', 'Lec '))}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={exportToCSV}
              style={{
                width: 'auto',
                padding: '0 0.8rem',
                height: '34px',
                fontSize: '0.82rem',
                fontWeight: 500,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title="Export to CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              )}
            </button>

            <button
              onClick={onClose}
              style={{
                width: 'auto',
                padding: '0 0.8rem',
                height: '34px',
                fontSize: '0.82rem',
                fontWeight: 500,
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
              title="Close (Esc)"
            >
              Close
            </button>
          </div>
        </div>


        {/* Search & Category Filter Bar */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-surface)',
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
          }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isMaster 
                ? (isMidterm ? "Search commands (e.g. split, dict, math.gcd, prime)..." : "Search commands across all lectures (e.g. read_excel, dropna)...") 
                : `Search commands in ${currentSingleLecture?.title || ''}...`}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border-color)'; }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  padding: '0.2rem',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, flexShrink: 0 }}>
              Categories:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '0.25rem 0.75rem',
                fontSize: '0.78rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--border-color)',
                backgroundColor: selectedCategory === 'all' ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'var(--bg-surface-elevated)',
                color: selectedCategory === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: selectedCategory === 'all' ? 600 : 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              All ({filteredItems.length})
            </button>
            {availableCategories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.78rem',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'color-mix(in srgb, var(--accent-primary) 12%, transparent)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 600 : 500,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categorized Content in Table Format (1 row = 1 command) */}
        <div className="smooth-scroll" style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
        }}>
          {groupedByCategory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              color: 'var(--text-tertiary)',
            }}>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>
                No commands found matching "<strong>{searchQuery}</strong>".
              </p>
            </div>
          ) : (
            groupedByCategory.map((categoryGroup) => {
              const catColor = LECTURE_COLORS[categoryGroup.lectureId] || 'var(--accent-primary)';
              return (
                <div key={categoryGroup.id} className="cheatsheet-category-section">
                  {/* Category Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '0.55rem',
                    marginBottom: '0.75rem',
                    borderBottom: '2px solid var(--border-color)',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: catColor,
                        display: 'inline-block',
                        boxShadow: `0 0 8px ${catColor}`
                      }} />
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}>
                        {categoryGroup.name}
                      </h3>
                      {isMaster && categoryGroup.lectureId && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: catColor,
                          backgroundColor: `color-mix(in srgb, ${catColor} 12%, transparent)`,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px'
                        }}>
                          {TOPIC_SHORT_NAMES[categoryGroup.lectureId] || categoryGroup.lectureId}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {categoryGroup.items.length} {categoryGroup.items.length === 1 ? 'command' : 'commands'}
                    </span>
                  </div>

                    {/* 1 Row = 1 Command Table */}
                    <div style={{
                      overflowX: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                    }}>
                      <table style={{
                        width: '100%',
                        minWidth: '940px',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                      }}>
                        <thead>
                          <tr style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.74rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            fontWeight: 700
                          }}>
                            <th style={{ padding: '0.75rem 1rem', width: '17%' }}>Command</th>
                            <th style={{ padding: '0.75rem 1rem', width: '23%' }}>Syntax</th>
                            <th style={{ padding: '0.75rem 1rem', width: '26%' }}>What it does</th>
                            <th style={{ padding: '0.75rem 1rem', width: '29%' }}>Example</th>
                            <th style={{ padding: '0.75rem 0.75rem', width: '5%', textAlign: 'center' }}>Copy</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryGroup.items.map((item, itemIdx) => {
                            const copyId = `${categoryGroup.id}_${itemIdx}`;
                            const isCopied = copiedKey === copyId;
                            const isSynCopied = copiedKey === `${copyId}_syn`;
                            return (
                              <tr 
                                key={itemIdx}
                                style={{
                                  borderBottom: itemIdx === categoryGroup.items.length - 1 ? 'none' : '1px solid var(--border-color)',
                                  transition: 'background-color 0.15s ease'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-primary) 4%, transparent)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                {/* Col 1: Command */}
                                <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.86rem', lineHeight: 1.35 }}>
                                    {item.title}
                                  </div>
                                </td>

                                {/* Col 2: Syntax */}
                                <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                                  <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '100%' }}>
                                    <code 
                                      onClick={() => handleCopy(item.syntax, `${copyId}_syn`)}
                                      title="Click to copy syntax"
                                      style={{
                                        fontFamily: 'var(--font-mono, monospace)',
                                        fontSize: '0.78rem',
                                        color: 'var(--accent-primary)',
                                        backgroundColor: 'var(--bg-base)',
                                        padding: '0.3rem 0.55rem',
                                        borderRadius: '5px',
                                        border: '1px solid var(--border-color)',
                                        wordBreak: 'break-word',
                                        display: 'inline-block',
                                        fontWeight: 600,
                                        lineHeight: 1.4,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {item.syntax}
                                    </code>
                                    {isSynCopied && (
                                      <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>✓ Syntax copied</span>
                                    )}
                                  </div>
                                </td>

                                {/* Col 3: What it does */}
                                <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                                  <div style={{ color: 'var(--text-primary)', fontSize: '0.83rem', lineHeight: 1.45 }}>
                                    {item.description}
                                  </div>
                                  {item.note && (
                                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                      💡 {item.note}
                                    </div>
                                  )}
                                </td>

                                {/* Col 4: Example */}
                                <td style={{ padding: '0.85rem 1rem', verticalAlign: 'top' }}>
                                  <pre style={{
                                    margin: 0,
                                    backgroundColor: 'var(--bg-base)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    padding: '0.45rem 0.65rem',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontSize: '0.76rem',
                                    lineHeight: 1.45,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'pre',
                                    overflowX: 'auto'
                                  }}>
                                    <code>{item.code}</code>
                                  </pre>
                                </td>

                                {/* Col 5: Copy button */}
                                <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleCopy(item.code, copyId)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color)',
                                      backgroundColor: isCopied ? 'var(--accent-primary)' : 'var(--bg-surface)',
                                      color: isCopied ? '#ffffff' : 'var(--text-secondary)',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title={isCopied ? "Copied!" : "Copy example code"}
                                  >
                                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.85rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface-elevated)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-tertiary)',
        }}>
          <span>
            ZeroCoder • {isMaster ? (isMidterm ? 'Mid-term Cheatsheet' : 'Data Science Cheatsheet') : `${isMidterm ? 'Topic' : 'Lecture'} Cheatsheet (${currentSingleLecture?.lectureId || ''})`}
          </span>
          <span>Press <strong>Esc</strong> or click outside to close</span>
        </div>
      </div>
    </div>
  );
}
