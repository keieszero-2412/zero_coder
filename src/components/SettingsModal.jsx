import React from 'react';
import { createPortal } from 'react-dom';
import { X, Moon, Sun, Monitor, Type, Code } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function SettingsModal({ onClose }) {
  const { settings, updateSetting } = useSettings();

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Settings
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Theme */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <Monitor size={16} /> Theme
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
              {[
                { id: 'midnight', name: 'Midnight', isLight: false },
                { id: 'daylight', name: 'Daylight', isLight: true },
                { id: 'blush', name: 'Blush', isLight: true },
                { id: 'oceanic', name: 'Oceanic', isLight: false },
                { id: 'carbon', name: 'Carbon', isLight: false },
                { id: 'amber', name: 'Amber', isLight: true }
              ].map(t => (
                <button 
                  key={t.id}
                  className={`button-secondary ${settings.theme === t.id ? 'active-setting' : ''}`}
                  onClick={() => updateSetting('theme', t.id)}
                  style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    borderColor: settings.theme === t.id ? 'var(--accent-primary)' : '',
                    padding: '0.5rem'
                  }}
                >
                  {t.isLight ? <Sun size={14} /> : <Moon size={14} />}
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Font Size */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <Type size={16} /> Editor Font Size
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['12px', '14px', '16px'].map(size => (
                <button 
                  key={size}
                  className={`button-secondary ${settings.editorFontSize === size ? 'active-setting' : ''}`}
                  onClick={() => updateSetting('editorFontSize', size)}
                  style={{ flex: 1, borderColor: settings.editorFontSize === size ? 'var(--accent-primary)' : '' }}
                >
                  {size === '12px' ? 'Small' : size === '14px' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          {/* Vim Mode */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              <Code size={16} /> Editor Keymap
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`button-secondary ${!settings.vimMode ? 'active-setting' : ''}`}
                onClick={() => updateSetting('vimMode', false)}
                style={{ flex: 1, borderColor: !settings.vimMode ? 'var(--accent-primary)' : '' }}
              >
                Standard
              </button>
              <button 
                className={`button-secondary ${settings.vimMode ? 'active-setting' : ''}`}
                onClick={() => updateSetting('vimMode', true)}
                style={{ flex: 1, borderColor: settings.vimMode ? 'var(--accent-primary)' : '' }}
              >
                Vim
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
