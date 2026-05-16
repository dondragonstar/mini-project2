import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Recycle, Leaf, Trash2, Clock } from 'lucide-react';
import api from '../api';

const SmartQueue = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = () => {
        setLoading(true);
        api.get('/evergreen').then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchQueue(); }, []);

    const handleRemove = async (id) => {
        try {
            await api.delete(`/evergreen/${id}`);
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><Recycle size={28} /> <span className="shiny-text">Smart Queue</span></h2>
                        <p className="page-subtitle">Evergreen content that auto-recycles for continuous engagement</p>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="empty-state"><div className="spinner-lg" /></div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">♻️</div>
                    <h3>No evergreen content yet</h3>
                    <p>Mark content as evergreen from the History page to auto-recycle it</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map(item => (
                        <motion.div key={item.id} className="glass-card" style={{ padding: '16px' }}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="badge badge--purple"><Leaf size={10} /> Evergreen</span>
                                        <span className="badge badge--ghost">{item.platform}</span>
                                        {item.brand_name && <span className="badge badge--ghost">{item.brand_name}</span>}
                                    </div>
                                    <p className="text-sm" style={{ lineHeight: 1.5, marginBottom: '8px' }}>{item.script?.substring(0, 120)}...</p>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <span className="text-xs text-muted"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            Recycles every {item.recycle_days} days
                                        </span>
                                        <span className={`text-xs ${item.days_until_recycle <= 3 ? 'text-warning' : 'text-muted'}`}>
                                            {item.days_until_recycle <= 0 ? '🔄 Ready to repost!' : `${item.days_until_recycle} days until next recycle`}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleRemove(item.id)} className="icon-btn icon-btn--danger" title="Remove from evergreen">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartQueue;
