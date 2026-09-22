import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Upload, Loader2, CheckCircle2, Plus, ArrowLeft, ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, serverTimestamp, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { Pencil } from 'lucide-react';

export default function FeedbackWidget({ iconOnly = false }) {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'form'
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Form states
  const [description, setDescription] = useState('');
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch user's feedbacks. Note: client-side sorting to avoid composite index requirement
    const q = query(collection(db, 'feedbacks'), where('userId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const fbs = [];
      let unread = 0;
      snapshot.forEach(document => {
        const data = document.data();
        fbs.push({ id: document.id, ...data });
        if (data.status === 'replied' || data.status === 'resolved') {
          unread++;
        }
      });
      fbs.sort((a, b) => {
        if (!a.createdAt) return -1;
        if (!b.createdAt) return 1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      setMyFeedbacks(fbs);
      setUnreadCount(unread);
      
      // Auto-switch to form view if they have no past feedbacks
      if (fbs.length === 0 && !isOpen) {
        setViewMode('form');
      }
    });
    return () => unsub();
  }, [currentUser, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (myFeedbacks.length > 0) {
      setViewMode('list');
      // Mark as read
      if (unreadCount > 0) {
        const batch = writeBatch(db);
        myFeedbacks.forEach(fb => {
          if (fb.status === 'replied' || fb.status === 'resolved') {
            const ref = doc(db, 'feedbacks', fb.id);
            batch.update(ref, { status: fb.status === 'resolved' ? 'resolved_read' : 'read' });
          }
        });
        batch.commit().catch(console.error);
      }
    } else {
      setEditingFeedbackId(null);
      setDescription('');
      setViewMode('form');
    }
  };

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

      if (editingFeedbackId) {
        const updateData = {
          description: description,
          status: 'new', // Reset status back to pending after edit
          updatedAt: serverTimestamp()
        };
        if (imageUrls.length > 0) {
          updateData.imageUrls = imageUrls;
        }
        await updateDoc(doc(db, 'feedbacks', editingFeedbackId), updateData);
      } else {
        await addDoc(collection(db, 'feedbacks'), {
          userId: currentUser.uid,
          username: currentUser.username,
          email: currentUser.email,
          description: description,
          imageUrls: imageUrls,
          status: 'new', // new, replied, read
          createdAt: serverTimestamp()
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription('');
        setEditingFeedbackId(null);
        setImageFiles([]);
        setViewMode('list');
      }, 1500);

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
        onClick={handleOpen}
        className={`button-secondary ${iconOnly ? '' : 'header-btn'}`}
        style={iconOnly ? { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0, position: 'relative', borderRadius: '9999px' } : { position: 'relative' }}
        title="Send Feedback / Report Bug"
      >
        <MessageSquare size={16} />
        {!iconOnly && <span className="header-btn-label">Feedback</span>}
        
        {/* Unread Notification Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: 'var(--error)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg-surface)'
          }}>
            {unreadCount}
          </span>
        )}
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
          className="smooth-scroll"
          onPaste={(e) => {
            if (viewMode === 'form' && e.clipboardData.files && e.clipboardData.files.length > 0) {
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
            maxWidth: '550px',
            margin: 'auto',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface-elevated)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {viewMode === 'form' && myFeedbacks.length > 0 && (
                  <button
                    onClick={() => { setViewMode('list'); setDescription(''); setEditingFeedbackId(null); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
                  {viewMode === 'list' ? 'My Feedbacks' : 'Send Feedback'}
                </h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="smooth-scroll" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              
              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <button
                    className="button-primary"
                    onClick={() => { setEditingFeedbackId(null); setDescription(''); setViewMode('form'); }}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
                  >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    Create New Feedback
                  </button>

                  {myFeedbacks.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem 0' }}>
                      No feedbacks yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {myFeedbacks.map(fb => (
                        <div key={fb.id} style={{
                          backgroundColor: 'var(--bg-base)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            <span>{fb.createdAt ? new Date(fb.createdAt.toMillis()).toLocaleString() : 'Just now'}</span>
                            {fb.status === 'new' && <span style={{ backgroundColor: 'color-mix(in srgb, #eab308 15%, transparent)', color: '#eab308', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>Pending</span>}
                            {fb.status === 'approved' && <span style={{ backgroundColor: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>Approved</span>}
                            {fb.status === 'rejected' && <span style={{ backgroundColor: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>Rejected</span>}
                            {fb.status === 'replied' && <span style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', color: 'var(--accent-primary)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>New Reply</span>}
                            {fb.status === 'read' && <span style={{ backgroundColor: 'color-mix(in srgb, var(--text-tertiary) 15%, transparent)', color: 'var(--text-tertiary)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>Replied (Read)</span>}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', flex: 1 }}>
                              {fb.description}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                              {(fb.status === 'new') && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>Pending</span>}
                              {(fb.status === 'replied' || fb.status === 'read') && <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-primary)' }}>Replied</span>}
                              {(fb.status === 'resolved' || fb.status === 'resolved_read') && <span style={{ color: '#10b981', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>Resolved</span>}
                              
                              {fb.status === 'new' && (
                                <button
                                  onClick={() => {
                                    setEditingFeedbackId(fb.id);
                                    setDescription(fb.description);
                                    setImageFiles([]); // Reset images to avoid accidental overwrite unless intended
                                    setViewMode('form');
                                  }}
                                  className="button-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Pencil size={12} /> Edit
                                </button>
                              )}
                            </div>
                          </div>

                          {(fb.imageUrls?.length > 0 || fb.imageUrl) && (
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                              {(fb.imageUrls || [fb.imageUrl]).map((url, i) => (
                                <button key={i} onClick={() => setSelectedImage(url)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', cursor: 'pointer', padding: '0.3rem 0.6rem', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <ImageIcon size={14} /> Image {i + 1}
                                </button>
                              ))}
                            </div>
                          )}

                          {fb.adminReply && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              padding: '0.75rem',
                              backgroundColor: (fb.status === 'resolved' || fb.status === 'resolved_read') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(20, 184, 166, 0.1)',
                              borderLeft: `3px solid ${(fb.status === 'resolved' || fb.status === 'resolved_read') ? '#10b981' : 'var(--accent-primary)'}`,
                              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                              fontSize: '0.875rem'
                            }}>
                              <div style={{ fontWeight: 600, color: (fb.status === 'resolved' || fb.status === 'resolved_read') ? '#10b981' : 'var(--accent-primary)', marginBottom: '0.25rem' }}>
                                {(fb.status === 'resolved' || fb.status === 'resolved_read') ? 'Resolved by Admin:' : 'Admin Reply:'}
                              </div>
                              <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {fb.adminReply}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FORM VIEW */}
              {viewMode === 'form' && (
                <>
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
                          {editingFeedbackId ? 'Edit Description' : 'Description'} <span style={{ color: 'var(--error)' }}>*</span>
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
                          {editingFeedbackId ? 'Replace Screenshot (Optional - overwrites old images)' : 'Attach Screenshot (Optional)'}
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
                          onClick={() => {
                            if (myFeedbacks.length > 0) setViewMode('list');
                            else setIsOpen(false);
                          }}
                          className="button-secondary"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !description.trim()}
                          className="button-primary"
                          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', marginTop: '0.5rem' }}
                        >
                          {isSubmitting ? <Loader2 size={18} className="spin" /> : (editingFeedbackId ? <Pencil size={18} /> : <Upload size={18} />)}
                          {isSubmitting ? (editingFeedbackId ? 'Updating...' : 'Sending...') : (editingFeedbackId ? 'Update Feedback' : 'Send Feedback')}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Image View Modal */}
      {selectedImage && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
        }} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Feedback Screenshot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setSelectedImage(null)} style={{
            position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-surface)', border: 'none',
            borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <X size={24} color="var(--text-primary)" />
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
