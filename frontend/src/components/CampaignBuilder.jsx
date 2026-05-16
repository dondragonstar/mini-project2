import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, ChevronRight, Calendar, Zap } from 'lucide-react';
import api from '../api';

const CampaignBuilder = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [frameworks, setFrameworks] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', brand_name: '', start_date: '', template_type: 'custom' });
    const [selectedFramework, setSelectedFramework] = useState(null);

    useEffect(() => {
        api.get('/campaigns').then(setCampaigns).catch(() => { });
        api.get('/campaign-frameworks', false).then(setFrameworks).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        const postsData = selectedFramework ? JSON.stringify(frameworks[selectedFramework]?.posts || []) : '[]';
        try {
            await api.post('/campaigns', { ...form, template_type: selectedFramework || 'custom', posts_data: postsData });
            const updated = await api.get('/campaigns');
            setCampaigns(updated);
            setShowForm(false);
            setForm({ name: '', description: '', brand_name: '', start_date: '', template_type: 'custom' });
            setSelectedFramework(null);
        } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this campaign?')) return;
        await api.delete(`/campaigns/${id}`);
        setCampaigns(prev => prev.filter(c => c.id !== id));
    };

    const getFrameworkPosts = (campaign) => {
        try { return JSON.parse(campaign.posts_data || '[]'); } catch { return []; }
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><Target size={28} /> <span className="shiny-text">Campaign Builder</span></h2>
                        <p className="page-subtitle">Create multi-post campaign series for maximum impact</p>
                    </div>
                    <button onClick={() => setShowForm(true)} className="neon-button neon-button--small"><Plus size={16} /> New Campaign</button>
                </div>
            </motion.div>

            {/* Campaign Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
                        <motion.form className="modal glass-card" onClick={e => e.stopPropagation()} onSubmit={handleCreate}
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '20px' }}>Create Campaign</h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Campaign Name</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Diwali Week 2026" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand</label>
                                    <input className="form-input" value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="Brand name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input type="date" className="form-input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Campaign goal..." />
                                </div>

                                {/* Framework Templates */}
                                <div className="form-group">
                                    <label className="form-label">Campaign Framework</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        {Object.entries(frameworks).map(([key, fw]) => (
                                            <div key={key}
                                                onClick={() => setSelectedFramework(key === selectedFramework ? null : key)}
                                                className={`campaign-framework-card glass-card ${selectedFramework === key ? 'campaign-framework-card--active' : ''}`}
                                            >
                                                <h4 style={{ fontWeight: 600, fontSize: '0.85rem' }}>{fw.name}</h4>
                                                <p className="text-xs text-muted">{fw.posts?.length || 0} posts</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedFramework && (
                                    <div className="campaign-timeline-preview">
                                        <h4 className="text-xs text-muted" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Post Timeline</h4>
                                        {frameworks[selectedFramework]?.posts?.map((p, i) => (
                                            <div key={i} className="timeline-item">
                                                <div className="timeline-dot" />
                                                <div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>Day {p.day}: {p.type}</span>
                                                    <p className="text-xs text-muted">{p.prompt_hint}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                                <button type="submit" className="neon-button neon-button--small"><Zap size={14} /> Create Campaign</button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>

            {/* Campaigns List */}
            {campaigns.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">🎯</div>
                    <h3>No campaigns yet</h3>
                    <p>Create your first multi-post campaign series</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {campaigns.map(campaign => {
                        const posts = getFrameworkPosts(campaign);
                        return (
                            <motion.div key={campaign.id} className="glass-card campaign-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -2 }}>
                                <div className="campaign-card__header">
                                    <div>
                                        <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{campaign.name}</h3>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span className="badge badge--purple">{campaign.status}</span>
                                            {campaign.brand_name && <span className="badge badge--ghost">{campaign.brand_name}</span>}
                                            {campaign.start_date && <span className="text-xs text-muted"><Calendar size={12} /> {campaign.start_date}</span>}
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(campaign.id)} className="icon-btn icon-btn--danger"><Trash2 size={14} /></button>
                                </div>
                                {campaign.description && <p className="text-sm text-muted" style={{ marginTop: '8px' }}>{campaign.description}</p>}
                                {posts.length > 0 && (
                                    <div className="campaign-posts-mini">
                                        {posts.map((p, i) => (
                                            <div key={i} className="campaign-post-chip">
                                                <span className="text-xs" style={{ fontWeight: 600 }}>Day {p.day}</span>
                                                <span className="text-xs text-muted">{p.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CampaignBuilder;
