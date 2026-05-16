import { useState } from 'react';
import { motion } from 'framer-motion';
import { Repeat, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';

const ContentRepurposer = ({ text, brandName, sourcePlatform = 'Instagram' }) => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState({});
    const [copied, setCopied] = useState('');

    const handleRepurpose = async () => {
        setLoading(true);
        try {
            const data = await api.post('/repurpose', { text, brand_name: brandName, source_platform: sourcePlatform }, false);
            setResults(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCopy = (platform, content) => {
        navigator.clipboard.writeText(content);
        setCopied(platform);
        setTimeout(() => setCopied(''), 2000);
    };

    const toggleExpand = (platform) => {
        setExpanded(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    const platformIcons = { Instagram: '📸', Twitter: '🐦', 'Twitter Thread': '🧵', LinkedIn: '💼', WhatsApp: '📱', Email: '✉️' };

    if (!text) return null;

    return (
        <div className="repurposer">
            {!results ? (
                <button onClick={handleRepurpose} disabled={loading} className="neon-button neon-button--small" style={{ width: '100%' }}>
                    {loading ? <><span className="spinner" /> Repurposing...</> : <><Repeat size={14} /> Repurpose for All Platforms</>}
                </button>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="repurpose-results">
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        <Repeat size={14} style={{ display: 'inline', marginRight: '6px' }} /> Repurposed Content
                    </h4>
                    {Object.entries(results).map(([platform, data]) => (
                        <div key={platform} className="repurpose-item glass-card">
                            <div className="repurpose-item__header" onClick={() => toggleExpand(platform)} style={{ cursor: 'pointer' }}>
                                <span style={{ fontSize: '1.2rem' }}>{platformIcons[platform] || '📝'}</span>
                                <span style={{ fontWeight: 600, flex: 1, fontSize: '0.9rem' }}>{platform}</span>
                                {data.char_limit && <span className="text-xs text-muted">{data.text?.length || 0}/{data.char_limit}</span>}
                                <button onClick={(e) => { e.stopPropagation(); handleCopy(platform, data.subject ? `Subject: ${data.subject}\n\n${data.text}` : data.text); }}
                                    className="icon-btn" style={{ width: '28px', height: '28px' }}>
                                    {copied === platform ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                </button>
                                {expanded[platform] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                            {expanded[platform] && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="repurpose-item__body">
                                    {data.subject && <p className="text-xs" style={{ marginBottom: '8px' }}><strong>Subject:</strong> {data.subject}</p>}
                                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{data.text}</p>
                                    {data.tip && <p className="text-xs text-muted" style={{ marginTop: '8px', fontStyle: 'italic' }}>💡 {data.tip}</p>}
                                </motion.div>
                            )}
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default ContentRepurposer;
