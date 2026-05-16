import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

const PlatformPreview = ({ script, platform = 'Instagram', brandName = '' }) => {
    const [hashtags, setHashtags] = useState([]);

    useEffect(() => {
        api.get(`/hashtags?brand=${encodeURIComponent(brandName)}&platform=${encodeURIComponent(platform)}`, false)
            .then(d => setHashtags(d.hashtags?.slice(0, 5) || []))
            .catch(() => { });
    }, [brandName, platform]);

    const charLimits = {
        Instagram: 2200, Twitter: 280, LinkedIn: 3000, YouTube: 5000, WhatsApp: 65536
    };
    const limit = charLimits[platform] || 2200;
    const isOver = script.length > limit;

    const previewStyles = {
        Instagram: { bg: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)', radius: '12px' },
        Twitter: { bg: 'linear-gradient(135deg, #1DA1F2, #0d8bd9)', radius: '16px' },
        LinkedIn: { bg: 'linear-gradient(135deg, #0077B5, #004471)', radius: '8px' },
        YouTube: { bg: 'linear-gradient(135deg, #FF0000, #cc0000)', radius: '12px' },
        WhatsApp: { bg: 'linear-gradient(135deg, #25D366, #128C7E)', radius: '12px' },
    };
    const style = previewStyles[platform] || previewStyles.Instagram;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="platform-preview">
            <div className="platform-preview__header" style={{ background: style.bg, borderRadius: `${style.radius} ${style.radius} 0 0` }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{platform} Preview</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{script.length} / {limit} chars</span>
            </div>
            <div className="platform-preview__body">
                <div className="platform-preview__user">
                    <div className="platform-preview__avatar">{brandName[0]?.toUpperCase() || 'B'}</div>
                    <div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{brandName || 'Brand Name'}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}> • Just now</span>
                    </div>
                </div>
                <p className="platform-preview__text" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {script.substring(0, limit)}
                    {isOver && <span style={{ color: '#ef4444' }}>... (truncated)</span>}
                </p>
                {hashtags.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {hashtags.map((h, i) => (
                            <span key={i} style={{ fontSize: '0.75rem', color: 'var(--neon-purple)' }}>{h}</span>
                        ))}
                    </div>
                )}
            </div>
            {isOver && (
                <div className="platform-preview__warning">
                    ⚠️ Content exceeds {platform}'s {limit} character limit by {script.length - limit} characters
                </div>
            )}
        </motion.div>
    );
};

export default PlatformPreview;
