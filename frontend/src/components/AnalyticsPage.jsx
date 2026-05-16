import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Hash, Layers } from 'lucide-react';
import api from '../api';

const AnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/analytics').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><div className="empty-state"><div className="spinner-lg" /></div></div>;
    if (!data) return null;

    const maxTimelineCount = Math.max(...(data.timeline?.map(d => d.count) || [1]), 1);

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title">
                            <BarChart3 size={28} className="text-green-400" />
                            <span className="shiny-text">Analytics</span>
                        </h2>
                        <p className="page-subtitle">Your content generation insights</p>
                    </div>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div className="stats-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="stat-card glass-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}><Layers size={24} /></div>
                    <div><p className="stat-card__label">Total Generations</p><h3 className="stat-card__value">{data.total_generations}</h3></div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><Hash size={24} /></div>
                    <div><p className="stat-card__label">Platforms Used</p><h3 className="stat-card__value">{data.by_platform?.length || 0}</h3></div>
                </div>
                <div className="stat-card glass-card">
                    <div className="stat-card__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}><TrendingUp size={24} /></div>
                    <div><p className="stat-card__label">Brands Created</p><h3 className="stat-card__value">{data.by_brand?.length || 0}</h3></div>
                </div>
            </motion.div>

            {/* Timeline Chart */}
            {data.timeline?.length > 0 && (
                <motion.div className="glass-card" style={{ padding: '24px', marginTop: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Generation Activity (Last 30 Days)</h3>
                    <div className="chart-bars">
                        {data.timeline.map((d, i) => (
                            <div key={i} className="chart-bar-group" title={`${d.day}: ${d.count} generation(s)`}>
                                <div className="chart-bar" style={{ height: `${Math.max((d.count / maxTimelineCount) * 120, 4)}px` }} />
                                <span className="chart-bar-label">{new Date(d.day).getDate()}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                {/* By Platform */}
                <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>By Platform</h3>
                    {data.by_platform?.map((p, i) => (
                        <div key={i} className="analytics-row">
                            <span>{p.platform || 'Unknown'}</span>
                            <div className="analytics-bar-wrap">
                                <div className="analytics-bar" style={{ width: `${(p.count / data.total_generations) * 100}%` }} />
                            </div>
                            <span className="text-muted">{p.count}</span>
                        </div>
                    ))}
                </motion.div>

                {/* By Tone */}
                <motion.div className="glass-card" style={{ padding: '24px' }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>By Tone</h3>
                    {data.by_tone?.map((t, i) => (
                        <div key={i} className="analytics-row">
                            <span>{t.tone || 'Default'}</span>
                            <div className="analytics-bar-wrap">
                                <div className="analytics-bar analytics-bar--orange" style={{ width: `${(t.count / data.total_generations) * 100}%` }} />
                            </div>
                            <span className="text-muted">{t.count}</span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Top Brands */}
            {data.by_brand?.length > 0 && (
                <motion.div className="glass-card" style={{ padding: '24px', marginTop: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Top Brands</h3>
                    <div className="brand-chips">
                        {data.by_brand.map((b, i) => (
                            <div key={i} className="brand-chip glass-card">
                                <span className="brand-chip__name">{b.brand_name}</span>
                                <span className="brand-chip__count">{b.count} posts</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AnalyticsPage;
