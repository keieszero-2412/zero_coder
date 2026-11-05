import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Terminal } from 'lucide-react';

export function AboutModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Keyboard navigation & body scroll locking
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      }
    }, 50);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="zc-about-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="zc-about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zc-about-title"
      >
        {/* Terminal Header */}
        <div className="zc-about-header">
          <div className="zc-about-brand-wrapper">
            <span className="zc-about-prompt-icon" aria-hidden="true">
              <Terminal size={15} />
            </span>
            <div className="zc-about-title-group">
              <h2 id="zc-about-title" className="zc-about-title">
                About ZeroCoder
              </h2>
              <span className="zc-about-path">~/system/about</span>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="zc-about-close-btn"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="zc-about-body">
          {/* 01 / Overview */}
          <section className="zc-about-section">
            <div className="zc-about-section-header">
              <span className="zc-about-section-tag">01</span>
              <span className="zc-about-section-sep">/</span>
              <h3 className="zc-about-section-heading">Overview</h3>
            </div>
            <p className="zc-about-desc">
              ZeroCoder is a coding workspace for learning, practicing, and preparing for exams.
            </p>
            <div className="zc-about-courses-list">
              <div className="zc-about-course-item available">
                <span className="zc-about-course-status-dot available" />
                <span className="zc-about-course-name">Programming</span>
                <span className="zc-about-course-sep">—</span>
                <span className="zc-about-course-badge available">Available</span>
              </div>
              <div className="zc-about-course-item dev">
                <span className="zc-about-course-status-dot dev" />
                <span className="zc-about-course-name">Database</span>
                <span className="zc-about-course-sep">—</span>
                <span className="zc-about-course-badge dev">In Development</span>
              </div>
            </div>
          </section>

          {/* 02 / Quick Guide */}
          <section className="zc-about-section">
            <div className="zc-about-section-header">
              <span className="zc-about-section-tag">02</span>
              <span className="zc-about-section-sep">/</span>
              <h3 className="zc-about-section-heading">Quick Guide</h3>
            </div>
            <ol className="zc-about-guide-list">
              <li className="zc-about-guide-item">
                <span className="zc-about-guide-num">1</span>
                <div className="zc-about-guide-content">
                  <strong>Select Course</strong> <span className="zc-about-guide-sep">—</span> Choose Programming or Database.
                </div>
              </li>
              <li className="zc-about-guide-item">
                <span className="zc-about-guide-num">2</span>
                <div className="zc-about-guide-content">
                  <strong>Choose Term</strong> <span className="zc-about-guide-sep">—</span> Select Mid-term or Final-term.
                </div>
              </li>
              <li className="zc-about-guide-item">
                <span className="zc-about-guide-num">3</span>
                <div className="zc-about-guide-content">
                  <strong>Open Tools</strong> <span className="zc-about-guide-sep">—</span> Access Cheatsheet, Tests, or Interactive Learning.
                </div>
              </li>
              <li className="zc-about-guide-item">
                <span className="zc-about-guide-num">4</span>
                <div className="zc-about-guide-content">
                  <strong>Quick Search</strong> <span className="zc-about-guide-sep">—</span> Find resources directly by path.
                </div>
              </li>
            </ol>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="zc-about-footer">
          <a
            href="https://github.com/keieszero-2412/zero_coder"
            target="_blank"
            rel="noopener noreferrer"
            className="zc-about-github-btn"
            title="View ZeroCoder repository on GitHub"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>View on GitHub</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="zc-about-dismiss-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AboutModal;
