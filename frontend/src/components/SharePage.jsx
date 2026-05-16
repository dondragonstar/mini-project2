import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import api from '../api';

const SharePage = () => {
    const { shareId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        api.get(`/share/${shareId}`, false)
            .then(d => { setData(d); setLoading(false); })
            .catch(e => { setError(e.message); setLoading(false); });
    }, [shareId]);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="page-container"><div className="empty-state"><div className="spinner-lg" /></div></div>;
    if (error) return (
        <div className="page-container">
            <div className="empty-state">
                <div className="empty-state__icon">🔗</div>
                <h3>Content not found</h3>
                <p>This shared link may have expired or been deleted.</p>
            </div>
        </div>
    );

    return (
        <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ marginBottom: '24px' }}>
                    <span className="badge badge--purple" style={{ marginBottom: '8px', display: 'inline-block' }}>Shared Content</span>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{data.brand_name || 'Content Studio AI'}</h2>
                    <p className="text-muted text-sm">
                        {data.platform && <span className="badge badge--ghost">{data.platform}</span>}
                        {' '}Created {new Date(data.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                {/* Script */}
                <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: 600 }}>📝 Script</h3>
                        <button onClick={() => handleCopy(data.script)} className="icon-btn" title="Copy">
                            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                        {data.script?.split('\n').map((p, i) => (
                            p.trim() === '' ? <br key={i} /> : <p key={i} style={{ marginBottom: '8px' }}>{p}</p>
                        ))}
                    </div>
                </div>

                {/* Image */}
                {data.image_url && (
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>🎨 Generated Visual</h3>
                        <img src={data.image_url} alt="Generated" style={{ width: '100%', borderRadius: '12px' }} />
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                    <p className="text-muted text-sm">Made with ✨ Content Studio AI</p>
                </div>
            </motion.div>
        </div>
    );
};

export default SharePage;
