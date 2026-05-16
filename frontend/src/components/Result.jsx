import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Check, Sparkles, Image as ImageIcon, MessageSquare, Send } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import BlurText from './reactbits/BlurText';
import StarBorder from './reactbits/StarBorder';
import ExportSuite from './ExportSuite';
import ContentEditor from './ContentEditor';
import PlatformPreview from './PlatformPreview';
import ContentRepurposer from './ContentRepurposer';
import QRCodeWidget from './QRCodeWidget';
import { ToneAnalyzer, ReadabilityWidget, EngagementPredictor } from './ContentAnalyzers';
import api from '../api';

const Result = () => {
    const location = useLocation();
    const data = location.state?.data || null;

    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [editedScript, setEditedScript] = useState('');
    const [activeVariation, setActiveVariation] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    if (!data) return (
        <div className="page-container" style={{ textAlign: 'center', marginTop: '10vh' }}>
            <h2>No content found</h2>
            <Link to="/dashboard" className="neon-button neon-button--small" style={{ marginTop: '16px' }}>Go to Studio</Link>
        </div>
    );

    const isVariations = data.variations && data.variations.length > 0;
    const currentData = isVariations ? data.variations[activeVariation] : data;
    const script = editedScript || currentData.script || '';
    const visualPrompt = currentData.visual_prompt || '';
    const imageUrl = currentData.image_url || '';
    const shareId = currentData.share_id || '';
    const genId = currentData.id || '';

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'script') { setCopiedScript(true); setTimeout(() => setCopiedScript(false), 2000); }
        else { setCopiedPrompt(true); setTimeout(() => setCopiedPrompt(false), 2000); }
    };

    const handleEditorSave = (newContent) => { setEditedScript(newContent); setShowEditor(false); };

    const handleSubmitForReview = async () => {
        if (!genId) return;
        try {
            await api.post('/approvals/submit', { generation_id: genId });
            setSubmitted(true);
        } catch (e) { console.error(e); }
    };

    const shareUrl = shareId ? `${window.location.origin}/share/${shareId}` : '';

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Link to="/dashboard" className="back-link">
                <div className="icon-btn"><ArrowLeft size={18} /></div>
                <span>Back to Studio</span>
            </Link>

            <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
                    <span className="shiny-text">Content Generated</span>
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-muted">
                    {isVariations ? `${data.variations.length} variations generated — pick your favorite!` : 'Here is your tailored content, ready for the world.'}
                </motion.p>
            </header>

            {/* Variation Tabs */}
            {isVariations && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                    {data.variations.map((_, i) => (
                        <button key={i} onClick={() => { setActiveVariation(i); setEditedScript(''); }}
                            className={`badge badge--clickable ${activeVariation === i ? 'badge--active' : 'badge--ghost'}`}
                            style={{ padding: '8px 24px', fontSize: '0.9rem' }}
                        >
                            Variation {String.fromCharCode(65 + i)}
                        </button>
                    ))}
                </div>
            )}

            <div className="result-grid">
                {/* Left Column — Script & Analyzers */}
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, type: "spring" }} className="result-left">
                    <div className="glass-card result-card">
                        <div className="result-card__header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--neon-purple)' }}>
                                <div className="result-icon-wrap"><MessageSquare size={20} /></div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Marketing Script</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setEditedScript(script); setShowEditor(true); }} className="btn-ghost btn-ghost--small">✏️ Edit</button>
                                <button onClick={() => handleCopy(script, 'script')} className="btn-ghost btn-ghost--small">
                                    {copiedScript ? <><Check size={14} className="text-green" /> Copied!</> : <><Copy size={14} /> Copy</>}
                                </button>
                            </div>
                        </div>

                        {showEditor ? (
                            <ContentEditor initialContent={script} onSave={handleEditorSave} />
                        ) : (
                            <div className="result-script-body">
                                {script.split('\n').map((para, i) => (
                                    para.trim() === '' ? <br key={i} /> :
                                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} key={i} style={{ marginBottom: '12px' }}>
                                            {para}
                                        </motion.p>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '16px' }}>
                            <ExportSuite script={script} imageUrl={imageUrl} brandName={currentData.brand_name || ''} visualPrompt={visualPrompt} />
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <PlatformPreview script={script} platform="Instagram" brandName={currentData.brand_name || ''} />
                        </div>

                        {/* Submit for Review */}
                        {genId && !submitted && (
                            <button onClick={handleSubmitForReview} className="btn-ghost" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                                <Send size={14} /> Submit for Review
                            </button>
                        )}
                        {submitted && <p className="text-xs text-muted" style={{ marginTop: '8px', textAlign: 'center' }}>✅ Submitted for review</p>}
                    </div>

                    {/* Analysis Widgets */}
                    <div className="glass-card analysis-panel">
                        <EngagementPredictor text={script} platform={currentData.platform} />
                        <ToneAnalyzer text={script} />
                        <ReadabilityWidget text={script} />
                    </div>

                    {/* Repurposer */}
                    <div className="glass-card" style={{ padding: '16px' }}>
                        <ContentRepurposer text={script} brandName={currentData.brand_name || ''} sourcePlatform={currentData.platform || 'Instagram'} />
                    </div>
                </motion.div>

                {/* Right Column — Visual */}
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2, type: "spring" }} className="result-right">
                    <div className="glass-card result-card">
                        <div className="result-card__header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fb923c' }}>
                                <div className="result-icon-wrap" style={{ background: 'rgba(251,146,60,0.1)' }}><ImageIcon size={20} /></div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Visual Output</h3>
                            </div>
                            <button onClick={() => handleCopy(visualPrompt, 'visual')} className="btn-ghost btn-ghost--small">
                                {copiedPrompt ? <><Check size={14} className="text-green" /> Copied!</> : <><Copy size={14} /> Copy</>}
                            </button>
                        </div>

                        {imageUrl ? (
                            <div className="result-image-wrap">
                                <img src={imageUrl} alt="Generated Visual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                <div className="result-image-overlay" />
                            </div>
                        ) : (
                            <div className="result-image-placeholder">No Preview Available</div>
                        )}

                        <div className="result-prompt-box">
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                                {visualPrompt}
                            </motion.span>
                        </div>

                        {shareId && (
                            <div className="result-share-row">
                                <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="btn-ghost btn-ghost--small" style={{ width: '100%', justifyContent: 'center' }}>
                                    🔗 Copy Share Link
                                </button>
                            </div>
                        )}
                    </div>

                    {/* QR Code */}
                    {shareUrl && (
                        <div className="glass-card" style={{ padding: '16px' }}>
                            <QRCodeWidget url={shareUrl} />
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                        <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Optimized for</p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <span className="badge badge--ghost">Midjourney</span>
                            <span className="badge badge--ghost">DALL-E 3</span>
                            <span className="badge badge--ghost">Stable Diffusion</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Result;
