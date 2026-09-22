import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../index.css';

export function Learning() {
  return (
    <div className="app-container" style={{ overflow: 'auto', background: 'var(--bg-base)' }}>
      <header className="header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)',
        backdropFilter: 'blur(12px)',
        padding: '1rem 2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="button-secondary" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </Link>
          <div className="header-title" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Learning Materials
          </div>
        </div>
      </header>

      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', flexGrow: 1, position: 'relative' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Getting Started</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Welcome to the learning section! Here you will find resources and materials to prepare for exams.
          </p>
        </div>
      </main>
    </div>
  );
}
