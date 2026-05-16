import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, Send, CheckCircle, XCircle, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import api from '../api';

const STATUS_CONFIG = {
    draft: { label: 'Draft', color: '#6b7280', icon: Clock, bg: 'rgba(107,114,128,0.1)' },
    pending: { label: 'Pending Review', color: '#f59e0b', icon: Clock, bg: 'rgba(245,158,11,0.1)' },
    in_review: { label: 'In Review', color: '#3b82f6', icon: ClipboardCheck, bg: 'rgba(59,130,246,0.1)' },
    approved: { label: 'Approved', color: '#22c55e', icon: CheckCircle, bg: 'rgba(34,197,94,0.1)' },
    rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle, bg: 'rgba(239,68,68,0.1)' },
    revision_needed: { label: 'Revision Needed', color: '#f97316', icon: AlertTriangle, bg: 'rgba(249,115,22,0.1)' },
};

const ApprovalWorkflow = () => {
    const [approvals, setApprovals] = useState([]);
    const [reviewForm, setReviewForm] = useState({ id: null, status: '', notes: '' });

    useEffect(() => {
        api.get('/approvals').then(setApprovals).catch(() => { });
    }, []);

    const handleReview = async (approvalId) => {
        try {
            await api.put(`/approvals/${approvalId}`, { status: reviewForm.status, reviewer_notes: reviewForm.notes });
            const updated = await api.get('/approvals');
            setApprovals(updated);
            setReviewForm({ id: null, status: '', notes: '' });
        } catch (e) { alert(e.message); }
    };

    const statusCounts = approvals.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><ClipboardCheck size={28} /> <span className="shiny-text">Approval Workflow</span></h2>
                        <p className="page-subtitle">Review, approve, and manage content through your pipeline</p>
                    </div>
                </div>

                {/* Pipeline Overview */}
                <div className="approval-pipeline">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                        <div key={key} className="pipeline-stage" style={{ borderColor: cfg.color }}>
                            <cfg.icon size={16} style={{ color: cfg.color }} />
                            <span className="text-xs" style={{ fontWeight: 600 }}>{cfg.label}</span>
                            <span className="pipeline-count" style={{ background: cfg.bg, color: cfg.color }}>{statusCounts[key] || 0}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Approval Items */}
            {approvals.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">📋</div>
                    <h3>No items in workflow</h3>
                    <p>Submit content for review from the Results page</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {approvals.map(approval => {
                        const cfg = STATUS_CONFIG[approval.status] || STATUS_CONFIG.draft;
                        const Icon = cfg.icon;
                        return (
                            <motion.div key={approval.id} className="glass-card approval-card"
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
                                <div className="approval-card__header">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                            <span className="badge" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
                                                <Icon size={12} /> {cfg.label}
                                            </span>
                                            {approval.platform && <span className="badge badge--ghost">{approval.platform}</span>}
                                            {approval.brand_name && <span className="badge badge--ghost">{approval.brand_name}</span>}
                                        </div>
                                        <p className="text-sm" style={{ lineHeight: 1.5 }}>{approval.script?.substring(0, 150)}...</p>
                                    </div>
                                </div>

                                {approval.reviewer_notes && (
                                    <div className="approval-notes">
                                        <MessageSquare size={12} /> <span className="text-xs">{approval.reviewer_notes}</span>
                                    </div>
                                )}

                                {/* Review Actions */}
                                {reviewForm.id === approval.id ? (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="review-form">
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                            {['approved', 'revision_needed', 'rejected'].map(s => (
                                                <button key={s} onClick={() => setReviewForm(f => ({ ...f, status: s }))}
                                                    className={`badge badge--clickable ${reviewForm.status === s ? 'badge--active' : 'badge--ghost'}`}
                                                    style={{ borderColor: STATUS_CONFIG[s]?.color }}>
                                                    {STATUS_CONFIG[s]?.label}
                                                </button>
                                            ))}
                                        </div>
                                        <textarea className="form-input" rows={2} placeholder="Add review notes..."
                                            value={reviewForm.notes} onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))} />
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                            <button onClick={() => handleReview(approval.id)} className="neon-button neon-button--small" disabled={!reviewForm.status}>
                                                <Send size={12} /> Submit Review
                                            </button>
                                            <button onClick={() => setReviewForm({ id: null, status: '', notes: '' })} className="btn-ghost btn-ghost--small">Cancel</button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <button onClick={() => setReviewForm({ id: approval.id, status: '', notes: '' })}
                                        className="btn-ghost btn-ghost--small" style={{ marginTop: '8px' }}>
                                        <ClipboardCheck size={12} /> Review
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ApprovalWorkflow;
