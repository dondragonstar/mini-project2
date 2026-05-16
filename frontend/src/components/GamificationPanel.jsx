import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Star, Zap, Award } from 'lucide-react';
import api from '../api';

const GamificationPanel = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/gamification').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><div className="empty-state"><div className="spinner-lg" /></div></div>;
    if (!data) return null;

    const xpProgress = data.next_level_xp > 0 ? ((data.xp % 100) / 100) * 100 : 0;

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><Trophy size={28} /> <span className="shiny-text">Your Progress</span></h2>
                        <p className="page-subtitle">Track your content creation journey</p>
                    </div>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
                <motion.div className="stat-card glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}><Star size={24} /></div>
                    <div>
                        <p className="stat-card__label">Level</p>
                        <h3 className="stat-card__value">{data.level}</h3>
                    </div>
                </motion.div>
                <motion.div className="stat-card glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}><Zap size={24} /></div>
                    <div>
                        <p className="stat-card__label">Total XP</p>
                        <h3 className="stat-card__value">{data.xp}</h3>
                    </div>
                </motion.div>
                <motion.div className="stat-card glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}><Flame size={24} /></div>
                    <div>
                        <p className="stat-card__label">Current Streak</p>
                        <h3 className="stat-card__value">{data.streak_current} 🔥</h3>
                    </div>
                </motion.div>
                <motion.div className="stat-card glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="stat-card__icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}><Award size={24} /></div>
                    <div>
                        <p className="stat-card__label">Content Created</p>
                        <h3 className="stat-card__value">{data.gen_count}</h3>
                    </div>
                </motion.div>
            </div>

            {/* XP Progress Bar */}
            <motion.div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>Level {data.level} → Level {data.level + 1}</span>
                    <span className="text-sm text-muted">{data.xp_to_next_level} XP to go</span>
                </div>
                <div className="xp-bar">
                    <motion.div className="xp-bar__fill" initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
                <p className="text-xs text-muted" style={{ marginTop: '8px' }}>💡 Earn XP: Generate content (+25), Create campaign (+50), Use template (+15)</p>
            </motion.div>

            {/* Best Streak */}
            {data.streak_best > 0 && (
                <motion.div className="glass-card" style={{ padding: '20px', marginBottom: '24px', textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <p className="text-muted text-sm">🏆 Best Streak Ever</p>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.streak_best} Days</h2>
                </motion.div>
            )}

            {/* Badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>🏅 Achievements</h3>
                <div className="badges-grid">
                    {data.badges?.map((badge, i) => (
                        <motion.div key={badge.id}
                            className={`badge-card glass-card ${badge.earned ? 'badge-card--earned' : 'badge-card--locked'}`}
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
                            whileHover={badge.earned ? { scale: 1.05, y: -4 } : {}}
                        >
                            <div className="badge-card__emoji" style={{ fontSize: '2rem', filter: badge.earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>{badge.emoji}</div>
                            <h4 className="badge-card__name" style={{ opacity: badge.earned ? 1 : 0.4 }}>{badge.name}</h4>
                            <p className="text-xs text-muted">{badge.description}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default GamificationPanel;
