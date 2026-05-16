import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import api from '../api';

const BrandsPage = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', industry: '', default_tone: 'Modern', default_audience: 'General', default_platform: 'Instagram', color_palette: '' });

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const data = await api.get('/brands');
            setBrands(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBrands(); }, []);

    const resetForm = () => {
        setForm({ name: '', industry: '', default_tone: 'Modern', default_audience: 'General', default_platform: 'Instagram', color_palette: '' });
        setEditId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/brands/${editId}`, form);
            } else {
                await api.post('/brands', form);
            }
            resetForm();
            fetchBrands();
        } catch (e) { alert(e.message); }
    };

    const handleEdit = (brand) => {
        setForm({ name: brand.name, industry: brand.industry, default_tone: brand.default_tone, default_audience: brand.default_audience, default_platform: brand.default_platform, color_palette: brand.color_palette || '' });
        setEditId(brand.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this brand profile?')) return;
        await api.delete(`/brands/${id}`);
        fetchBrands();
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title">
                            <Layers size={28} className="text-blue-400" />
                            <span className="shiny-text">Brand Profiles</span>
                        </h2>
                        <p className="page-subtitle">Save your brand settings for quick content generation</p>
                    </div>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="neon-button neon-button--small">
                        <Plus size={16} /> Add Brand
                    </button>
                </div>
            </motion.div>

            {/* Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => resetForm()}>
                        <motion.form
                            className="modal glass-card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            onSubmit={handleSubmit}
                        >
                            <h3 style={{
                                marginBottom: '20px', fontWeight: 700
                            }}>{editId ? 'Edit Brand' : 'New Brand Profile'}</h3>
                            <div style={{ display: 'grid', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Brand Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Cafe Coffee Day" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Industry</label>
                                    <input className="form-input" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="e.g., Food & Beverage" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Default Tone</label>
                                        <select className="form-select" value={form.default_tone} onChange={e => setForm({ ...form, default_tone: e.target.value })}>
                                            <option>Modern</option><option>Professional</option><option>Witty/Fun</option>
                                            <option>Emotional</option><option>Bold/Loud</option><option>Minimalist</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Default Platform</label>
                                        <input className="form-input" value={form.default_platform} onChange={e => setForm({ ...form, default_platform: e.target.value })} placeholder="Instagram" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Target Audience</label>
                                    <input className="form-input" value={form.default_audience} onChange={e => setForm({ ...form, default_audience: e.target.value })} placeholder="e.g., Young Adults" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Brand Colors</label>
                                    <input className="form-input" value={form.color_palette} onChange={e => setForm({ ...form, color_palette: e.target.value })} placeholder="e.g., #FF5733, #6C63FF" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={resetForm} className="btn-ghost"><X size={16} /> Cancel</button>
                                <button type="submit" className="neon-button neon-button--small"><Check size={16} /> {editId ? 'Update' : 'Create'}</button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Brand Cards */}
            {loading ? (
                <div className="empty-state"><div className="spinner-lg" /></div>
            ) : brands.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
                    <div className="empty-state__icon">🏢</div>
                    <h3>No brand profiles yet</h3>
                    <p>Create brand profiles to save your brand settings</p>
                </motion.div>
            ) : (
                <motion.div className="brands-grid" initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                >
                    {brands.map(brand => (
                        <motion.div key={brand.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            className="brand-profile-card glass-card"
                            whileHover={{ y: -4 }}
                        >
                            <div className="brand-profile-card__header">
                                <div className="brand-profile-card__avatar">{brand.name[0]?.toUpperCase()}</div>
                                <div>
                                    <h3 className="brand-profile-card__name">{brand.name}</h3>
                                    <span className="text-muted text-xs">{brand.industry || 'No industry set'}</span>
                                </div>
                            </div>
                            <div className="brand-profile-card__details">
                                <span className="badge badge--ghost">{brand.default_platform}</span>
                                <span className="badge badge--ghost">{brand.default_tone}</span>
                            </div>
                            {brand.color_palette && (
                                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                    {brand.color_palette.split(',').slice(0, 5).map((c, i) => (
                                        <div key={i} style={{ width: '20px', height: '20px', borderRadius: '4px', background: c.trim() }} />
                                    ))}
                                </div>
                            )}
                            <div className="brand-profile-card__actions">
                                <button onClick={() => handleEdit(brand)} className="icon-btn" title="Edit"><Edit3 size={14} /></button>
                                <button onClick={() => handleDelete(brand.id)} className="icon-btn icon-btn--danger" title="Delete"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default BrandsPage;
