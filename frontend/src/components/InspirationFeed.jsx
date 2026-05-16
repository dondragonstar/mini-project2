import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import api from '../api';

const CATEGORIES = ['All', 'Hook', 'Format', 'Trending', 'Indian', 'Growth'];

const InspirationFeed = () => {
    const [items, setItems] = useState([]);
    const [category, setCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    const fetchFeed = () => {
        setLoading(true);
        api.get('/inspiration', false).then(d => { setItems(d); setLoading(false); }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchFeed(); }, []);

    const filtered = category === 'All' ? items : items.filter(i => i.category === category);

    const categoryColors = { Hook: '#a855f7', Format: '#3b82f6', Trending: '#ef4444', Indian: '#f59e0b', Growth: '#22c55e' };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><Lightbulb size={28} /> <span className="shiny-text">Content Inspiration</span></h2>
                        <p className="page-subtitle">Curated hooks, formats, and trending ideas for the Indian market</p>
                    </div>
                    <button onClick={fetchFeed} className="neon-button neon-button--small"><RefreshCw size={14} /> Refresh</button>
                </div>

                <div className="filter-bar" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)}
                            className={`badge badge--clickable ${category === cat ? 'badge--active' : 'badge--ghost'}`}
                        >{cat}</button>
                    ))}
                </div>
            </motion.div>

            {loading ? (
                <div className="empty-state"><div className="spinner-lg" /></div>
            ) : (
                <motion.div className="inspiration-grid" initial="hidden" animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
                    {filtered.map((item, i) => (
                        <motion.div key={i} className="inspiration-card glass-card"
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            whileHover={{ y: -4, scale: 1.01 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span className="badge" style={{ background: `${categoryColors[item.category]}20`, color: categoryColors[item.category], border: `1px solid ${categoryColors[item.category]}40` }}>{item.category}</span>
                                <span className="badge badge--ghost">{item.platform}</span>
                            </div>
                            <h4 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.95rem' }}>
                                <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', color: categoryColors[item.category] }} />
                                {item.tip}
                            </h4>
                            <div className="inspiration-card__example">
                                <p className="text-sm" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>"{item.example}"</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default InspirationFeed;
