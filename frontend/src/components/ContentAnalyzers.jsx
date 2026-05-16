import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

const ToneAnalyzer = ({ text }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!text || text.length < 10) { setData(null); return; }
        const timer = setTimeout(() => {
            api.post('/analyze/tone', { text }, false).then(setData).catch(() => { });
        }, 600);
        return () => clearTimeout(timer);
    }, [text]);

    if (!data) return null;

    const tones = Object.entries(data.scores || {});
    const maxScore = Math.max(...tones.map(([, v]) => v), 1);

    return (
        <motion.div className="tone-analyzer" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                💬 Tone Analysis
            </h4>
            <div className="tone-dominant">
                Dominant: <strong style={{ color: 'var(--neon-purple)' }}>{data.dominant_tone}</strong>
            </div>
            <div className="tone-bars">
                {tones.map(([tone, score]) => (
                    <div key={tone} className="tone-bar-row">
                        <span className="text-xs" style={{ minWidth: '90px' }}>{tone}</span>
                        <div className="tone-bar-track">
                            <motion.div className="tone-bar-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${(score / maxScore) * 100}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                        </div>
                        <span className="text-xs text-muted" style={{ minWidth: '30px', textAlign: 'right' }}>{score}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const ReadabilityWidget = ({ text }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!text || text.length < 20) { setData(null); return; }
        const timer = setTimeout(() => {
            api.post('/analyze/readability', { text }, false).then(setData).catch(() => { });
        }, 600);
        return () => clearTimeout(timer);
    }, [text]);

    if (!data || !data.metrics) return null;

    const gradeColor = { 'Very Easy': '#22c55e', 'Easy': '#4ade80', 'Moderate': '#f59e0b', 'Difficult': '#ef4444', 'Very Difficult': '#dc2626' };

    return (
        <motion.div className="readability-widget" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                📖 Readability
            </h4>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div className="readability-score" style={{ borderColor: gradeColor[data.grade] || '#888' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data.flesch_score}</span>
                    <span className="text-xs" style={{ color: gradeColor[data.grade] }}>{data.grade}</span>
                </div>
                <div className="readability-metrics">
                    <div className="readability-metric"><span className="text-xs text-muted">Words</span><strong>{data.metrics.words}</strong></div>
                    <div className="readability-metric"><span className="text-xs text-muted">Sentences</span><strong>{data.metrics.sentences}</strong></div>
                    <div className="readability-metric"><span className="text-xs text-muted">Avg Length</span><strong>{data.metrics.avg_sentence_length}</strong></div>
                    <div className="readability-metric"><span className="text-xs text-muted">Read Time</span><strong>{data.metrics.reading_time_seconds}s</strong></div>
                    <div className="readability-metric"><span className="text-xs text-muted">Passive %</span><strong>{data.metrics.passive_voice_pct}%</strong></div>
                    <div className="readability-metric"><span className="text-xs text-muted">Grade Level</span><strong>{data.fk_grade_level}</strong></div>
                </div>
            </div>
        </motion.div>
    );
};

const EngagementPredictor = ({ text, platform }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!text || text.length < 10) { setData(null); return; }
        const timer = setTimeout(() => {
            api.post('/analyze/engagement', { text, platform: platform || 'Instagram' }, false).then(setData).catch(() => { });
        }, 600);
        return () => clearTimeout(timer);
    }, [text, platform]);

    if (!data) return null;

    const scoreColor = data.score >= 80 ? '#22c55e' : data.score >= 60 ? '#4ade80' : data.score >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <motion.div className="engagement-predictor" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                📊 Engagement Score
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div className="engagement-score-circle" style={{ borderColor: scoreColor }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{data.score}</span>
                    <span className="text-xs" style={{ color: scoreColor }}>{data.grade}</span>
                </div>
                <div style={{ flex: 1 }}>
                    {data.factors?.map((f, i) => (
                        <div key={i} className="engagement-factor" style={{ color: f.type === 'positive' ? '#22c55e' : '#ef4444' }}>
                            <span className="text-xs">{f.type === 'positive' ? '✅' : '⚠️'} {f.name}</span>
                            <span className="text-xs" style={{ fontWeight: 600 }}>{f.impact}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export { ToneAnalyzer, ReadabilityWidget, EngagementPredictor };
