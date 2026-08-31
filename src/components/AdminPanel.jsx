import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { X, Check, Trash2, Mail, Plus, MessageSquare, ImageIcon, Settings, Key, Shield } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import '../index.css';

const TabButton = ({ label, icon: Icon, active, badge, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1.5rem',
      backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
      border: 'none',
      borderRight: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontWeight: active ? 600 : 500
    }}
    onMouseOver={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }
    }}
    onMouseOut={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <Icon size={18} />
      <span>{label}</span>
    </div>
    {badge > 0 && (
      <span style={{ 
        backgroundColor: active ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)', 
        color: active ? 'var(--text-on-accent)' : 'var(--text-primary)', 
        fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px', fontWeight: 600
      }}>
        {badge}
      </span>
    )}
  </button>
);

export function AdminPanel({ onClose }) {
  const { showToast, showConfirm } = useNotification();
  const [activeTab, setActiveTab] = useState('requests');
  const [accessRequests, setAccessRequests] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualEmail, setManualEmail] = useState('');
  const [bypassAuth, setBypassAuth] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});

  const handleSendReply = async (feedbackId) => {
    const replyText = replyDrafts[feedbackId]?.trim();
    if (!replyText) return;
    try {
      await setDoc(doc(db, 'feedbacks', feedbackId), {
        adminReply: replyText,
        repliedAt: new Date(),
        status: 'replied'
      }, { merge: true });
      setReplyDrafts(prev => {
        const next = { ...prev };
        delete next[feedbackId];
        return next;
      });
      showToast("Reply sent successfully!", "success");
    } catch (err) {
      console.error("Failed to send reply:", err);
      showToast("Error sending reply.", "error");
    }
  };

  useEffect(() => {
    const qAccess = query(collection(db, 'access_requests'), where('status', '==', 'pending'));
    const unsubscribeAccess = onSnapshot(qAccess, (snapshot) => {
      const reqs = [];
      snapshot.forEach((doc) => {
        reqs.push({ id: doc.id, ...doc.data() });
      });
      reqs.sort((a, b) => {
        if (!a.requestedAt) return 1;
        if (!b.requestedAt) return -1;
        return b.requestedAt.toMillis() - a.requestedAt.toMillis();
      });
      setAccessRequests(reqs);
    });

    const qReset = query(collection(db, 'password_reset_requests'), where('status', '==', 'pending'));
    const unsubscribeReset = onSnapshot(qReset, (snapshot) => {
      const rReqs = [];
      snapshot.forEach((doc) => {
        rReqs.push({ id: doc.id, ...doc.data() });
      });
      rReqs.sort((a, b) => {
        if (!a.requestedAt) return 1;
        if (!b.requestedAt) return -1;
        return b.requestedAt.toMillis() - a.requestedAt.toMillis();
      });
      setResetRequests(rReqs);
    });

    const qFeedback = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
    const unsubscribeFeedback = onSnapshot(qFeedback, (snapshot) => {
      const fbList = [];
      snapshot.forEach((doc) => {
        fbList.push({ id: doc.id, ...doc.data() });
      });
      setFeedbacks(fbList);
      setLoading(false);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'authorized_emails', 'bypass@zerocoder.admin'), (docSnap) => {
      if (docSnap.exists()) {
        setBypassAuth(docSnap.data().bypassBlueCode || false);
      } else {
        setBypassAuth(false);
      }
    });

    return () => {
      unsubscribeAccess();
      unsubscribeReset();
      unsubscribeFeedback();
      unsubscribeSettings();
    };
  }, []);

  const handleApprove = async (email, requestId) => {
    try {
      await setDoc(doc(db, 'authorized_emails', email), {
        addedAt: new Date(),
        addedBy: 'Admin'
      });
      await deleteDoc(doc(db, 'access_requests', requestId));
      showToast("Request approved.", "success");
    } catch (err) {
      console.error("Failed to approve:", err);
      showToast("Error approving request.", "error");
    }
  };

  const handleReject = (requestId) => {
    showConfirm("Are you sure you want to reject and delete this request?", async () => {
      try {
        await deleteDoc(doc(db, 'access_requests', requestId));
        showToast("Request rejected.", "info");
      } catch (err) {
        console.error("Failed to reject:", err);
        showToast("Error rejecting request.", "error");
      }
    });
  };

  const handleResolveReset = (requestId) => {
    showConfirm("Did you manually change their password in Firebase Authentication? Click Confirm to clear this request.", async () => {
      try {
        await deleteDoc(doc(db, 'password_reset_requests', requestId));
        showToast("Request resolved.", "success");
      } catch (err) {
        console.error("Failed to resolve:", err);
        showToast("Error resolving request.", "error");
      }
    });
  };

  const handleRejectReset = (requestId) => {
    showConfirm("Are you sure you want to deny and delete this password reset request?", async () => {
      try {
        await deleteDoc(doc(db, 'password_reset_requests', requestId));
        showToast("Reset request denied.", "info");
      } catch (err) {
        console.error("Failed to reject reset:", err);
        showToast("Error rejecting reset.", "error");
      }
    });
  };

  const handleDeleteFeedback = (feedbackId) => {
    showConfirm("Delete this feedback?", async () => {
      try {
        await deleteDoc(doc(db, 'feedbacks', feedbackId));
        showToast("Feedback deleted.", "info");
      } catch (err) {
        console.error("Failed to delete feedback:", err);
        showToast("Error deleting feedback.", "error");
      }
    });
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    try {
      await setDoc(doc(db, 'authorized_emails', manualEmail.trim().toLowerCase()), {
        addedAt: new Date(),
        addedBy: 'Admin (Manual)'
      });
      setManualEmail('');
      showToast("Email authorized successfully!", "success");
    } catch (err) {
      console.error("Failed to authorize email:", err);
      showToast("Error authorizing email.", "error");
    }
  };

  const toggleBypass = async () => {
    try {
      await setDoc(doc(db, 'authorized_emails', 'bypass@zerocoder.admin'), { bypassBlueCode: !bypassAuth }, { merge: true });
      showToast(bypassAuth ? "Bypass disabled." : "Bypass enabled.", "info");
    } catch (err) {
      console.error("Failed to toggle bypass:", err);
      showToast("Error toggling bypass: " + err.message, "error");
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '900px',
        height: '85vh',
        display: 'flex',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '240px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: 'var(--text-primary)'
          }}>
            <Shield size={22} color="var(--accent-primary)" />
            Admin Panel
          </div>
          <div style={{ padding: '1rem 0', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <TabButton 
              label="Access Requests" icon={Mail} 
              active={activeTab === 'requests'} badge={accessRequests.length}
              onClick={() => setActiveTab('requests')}
            />
            <TabButton 
              label="Password Resets" icon={Key} 
              active={activeTab === 'resets'} badge={resetRequests.length}
              onClick={() => setActiveTab('resets')}
            />
            <TabButton 
              label="User Feedbacks" icon={MessageSquare} 
              active={activeTab === 'feedbacks'} badge={feedbacks.length}
              onClick={() => setActiveTab('feedbacks')}
            />
            <TabButton 
              label="Global Settings" icon={Settings} 
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
          {/* Header */}
          <div style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeTab === 'requests' && 'Access Requests'}
              {activeTab === 'resets' && 'Password Resets'}
              {activeTab === 'feedbacks' && 'User Feedbacks'}
              {activeTab === 'settings' && 'Global Settings'}
            </h2>
            <button 
              onClick={onClose}
              style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
              </div>
            ) : (
              <div className="tab-content-anim" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                
                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Global Access Control</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Control whether users need manual approval to access the platform.</p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Bypass Request Access</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>Auto accept all emails without requesting access</div>
                        </div>
                        <button 
                          onClick={toggleBypass}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: bypassAuth ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: bypassAuth ? '#22c55e' : 'var(--error)',
                            border: '1px solid',
                            borderColor: bypassAuth ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            width: '80px',
                            textAlign: 'center'
                          }}
                        >
                          {bypassAuth ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Manual Authorization</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Directly grant access to a specific email address.</p>
                      
                      <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="email" 
                          value={manualEmail}
                          onChange={(e) => setManualEmail(e.target.value)}
                          placeholder="Enter email address..."
                          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                          required
                        />
                        <button type="submit" className="button-primary" style={{ padding: '0.75rem 1.5rem' }}>
                          <Plus size={18} />
                          Authorize
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* ACCESS REQUESTS TAB */}
                {activeTab === 'requests' && (
                  <div>
                    {accessRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0' }}>
                        <Check size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <p style={{ fontSize: '1rem' }}>No pending access requests.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {accessRequests.map(req => (
                          <div key={req.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.25rem', backgroundColor: 'var(--bg-surface-elevated)',
                            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.email}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                {req.requestedAt ? new Date(req.requestedAt.toMillis()).toLocaleString() : 'Just now'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => handleReject(req.id)}
                                style={{
                                  padding: '0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)',
                                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Reject"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleApprove(req.email, req.id)}
                                className="button-primary"
                                style={{ padding: '0.6rem 1.25rem' }}
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PASSWORD RESETS TAB */}
                {activeTab === 'resets' && (
                  <div>
                    {resetRequests.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0' }}>
                        <Check size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <p style={{ fontSize: '1rem' }}>No pending password resets.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {resetRequests.map(req => (
                          <div key={req.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)'
                          }}>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.email}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                {req.requestedAt ? new Date(req.requestedAt.toMillis()).toLocaleString() : 'Just now'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => handleRejectReset(req.id)}
                                style={{
                                  padding: '0.6rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)',
                                  border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                }}
                                title="Deny / Reject"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleResolveReset(req.id)}
                                className="button-primary"
                                style={{ padding: '0.6rem 1.25rem' }}
                                title="Mark as resolved"
                              >
                                <Check size={16} style={{ marginRight: '0.4rem' }} />
                                Resolved
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* FEEDBACKS TAB */}
                {activeTab === 'feedbacks' && (
                  <div>
                    {feedbacks.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 0' }}>
                        <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                        <p style={{ fontSize: '1rem' }}>No feedback received yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {feedbacks.map(fb => (
                          <div key={fb.id} style={{
                            display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem',
                            backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{fb.username || fb.email}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                  {fb.createdAt ? new Date(fb.createdAt.toMillis()).toLocaleString() : 'Just now'}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDeleteFeedback(fb.id)}
                                style={{ padding: '0.5rem', backgroundColor: 'transparent', color: 'var(--text-tertiary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                title="Delete Feedback"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                            
                            <div style={{ 
                              fontSize: '0.9rem', color: 'var(--text-primary)', backgroundColor: 'var(--bg-base)', 
                              padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                              whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6
                            }}>
                              {fb.description}
                            </div>

                            {(fb.imageUrls && fb.imageUrls.length > 0) ? (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {fb.imageUrls.map((url, i) => (
                                  <button key={i} onClick={() => setSelectedImage(url)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', cursor: 'pointer', padding: '0.4rem 0.75rem', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <ImageIcon size={16} /> Screenshot {i + 1}
                                  </button>
                                ))}
                              </div>
                            ) : fb.imageUrl ? (
                              <div>
                                <button onClick={() => setSelectedImage(fb.imageUrl)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', cursor: 'pointer', padding: '0.4rem 0.75rem', backgroundColor: 'transparent', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                  <ImageIcon size={16} /> View Screenshot
                                </button>
                              </div>
                            ) : null}

                            {fb.adminReply ? (
                              <div style={{ 
                                padding: '1rem', backgroundColor: 'var(--bg-surface)', borderLeft: '4px solid var(--accent-primary)',
                                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', border: '1px solid var(--border-color)'
                              }}>
                                <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Reply</div>
                                <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                  {fb.adminReply}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                                  {fb.repliedAt ? (fb.repliedAt.toDate ? fb.repliedAt.toDate().toLocaleString() : new Date(fb.repliedAt).toLocaleString()) : 'Unknown'}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <textarea
                                  placeholder="Type a reply to the user..."
                                  value={replyDrafts[fb.id] || ''}
                                  onChange={(e) => setReplyDrafts(prev => ({ ...prev, [fb.id]: e.target.value }))}
                                  style={{
                                    width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)',
                                    resize: 'vertical', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none'
                                  }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  <button
                                    onClick={() => handleSendReply(fb.id)}
                                    disabled={!replyDrafts[fb.id]?.trim()}
                                    className="button-primary"
                                    style={{ padding: '0.5rem 1rem' }}
                                  >
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Image View Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 11000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }} onClick={() => setSelectedImage(null)}>
          <img 
            src={selectedImage} 
            alt="Feedback Screenshot" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} 
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            onClick={() => setSelectedImage(null)}
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface-highlight)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
          >
            <X size={28} />
          </button>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
