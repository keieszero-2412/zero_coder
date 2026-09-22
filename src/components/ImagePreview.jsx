import React, { useState } from 'react';
import { Maximize, Download, X } from 'lucide-react';

export default function ImagePreview({ src, alt, style }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const defaultStyle = {
    maxWidth: '100%',
    maxHeight: '500px', // Ensures image fits vertically in the viewport
    objectFit: 'contain',
    display: 'block',
    margin: '0.5rem 0',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    ...style
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = alt ? `${alt.replace(/\s+/g, '_')}.png` : 'plot_output.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div 
        style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={src} 
          alt={alt || "output image"} 
          style={defaultStyle}
          onClick={() => setIsFullscreen(true)}
        />
        {isHovered && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            opacity: 0.9
          }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              style={{
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
              title="Phóng to (Full Screen)"
            >
              <Maximize size={16} />
            </button>
            <button 
              onClick={handleDownload}
              style={{
                background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}
              title="Tải xuống (Download)"
            >
              <Download size={16} />
            </button>
          </div>
        )}
      </div>

      {isFullscreen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <img 
            src={src} 
            alt={alt || "output image"} 
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()} // don't close when clicking image itself
          />
          
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '15px'
          }}>
            <button
              onClick={handleDownload}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer',
                transition: 'background 0.2s, transform 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Tải xuống"
            >
              <Download size={22} />
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                width: '44px', height: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer',
                transition: 'background 0.2s, transform 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Đóng"
            >
              <X size={22} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
