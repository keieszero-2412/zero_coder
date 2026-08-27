import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FeedbackWidget() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!currentUser) return null;

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Each image must be less than 5MB');
          return false;
        }
        return true;
      });
      setImageFiles(prev => [...prev, ...validFiles]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrls = [];

      if (imageFiles.length > 0) {
        // Tối đa 3 ảnh để tránh vượt quá dung lượng document 1MB của Firestore
        if (imageFiles.length > 3) {
          setError('You can only upload up to 3 images at once.');
          setIsSubmitting(false);
          return;
        }
        
        const uploadPromises = imageFiles.map(async (file) => {
          return await compressImage(file);
        });

        imageUrls = await Promise.all(uploadPromises);
      }

      await addDoc(collection(db, 'feedbacks'), {
        userId: currentUser.uid,
        username: currentUser.username,
        email: currentUser.email,
        description: description,
        imageUrls: imageUrls,
        status: 'new', // new, reviewed, resolved
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setDescription('');
        setImageFiles([]);
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="button-secondary"
        style={{ padding: '0.5rem 0.75rem' }}
        title="Send Feedback / Report Bug"
      >
        <MessageSquare size={16} />
        <span className="hide-on-mobile">Feedback</span>
      </button>

      {isOpen && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem 1rem',
            overflowY: 'auto'
          }}
          onPaste={(e) => {
            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
              const files = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
              const validFiles = files.filter(f => {
                if (f.size > 5 * 1024 * 1024) {
                  setError('Each image must be less than 5MB');
                  return false;
                }
                return true;
              });
              if (validFiles.length > 0) {
                setImageFiles(prev => [...prev, ...validFiles]);
                setError('');
              }
            }
          }}
        >
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '500px',
            margin: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            position: 'relative'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                top: '1rem', right: '1rem',
                background: 'none', border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
              Send Feedback to Admin
            </h2>

            {isSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', color: 'var(--success)' }}>
                <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                <p style={{ margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>Feedback sent successfully!</p>
                <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>Thank you for your help.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Description <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue or your suggestion in detail..."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Attach Screenshot (Optional)
                  </label>
                  <div style={{
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => document.getElementById('feedback-image-upload').click()}
                  >
                    <input 
                      type="file" 
                      id="feedback-image-upload"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    
                    {imageFiles.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '1rem' }}>
                        {imageFiles.map((file, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageFiles(prev => prev.filter((_, i) => i !== idx));
                                document.getElementById('feedback-image-upload').value = '';
                              }}
                              style={{
                                position: 'absolute',
                                top: '-0.5rem', right: '-0.5rem',
                                backgroundColor: 'var(--error)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px', height: '24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                              title="Remove Image"
                            >
                              <X size={14} />
                            </button>
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${idx}`} 
                              style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Upload size={24} />
                      <span>Click to upload or Paste (Ctrl+V) image(s)</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="button-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="button-primary"
                    disabled={isSubmitting}
                    style={{ minWidth: '100px' }}
                  >
                    {isSubmitting ? <Loader2 size={18} className="spin" /> : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
