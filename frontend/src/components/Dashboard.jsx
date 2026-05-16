import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Layers, Video, Palette, Users, Target, Play, Zap, Hash } from 'lucide-react';
import Magnet from './reactbits/Magnet';
import ColorPaletteGenerator from './ColorPaletteGenerator';
import api from '../api';

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const templateData = location.state?.templateData || null;
    const calendarData = location.state?.calendarData || null;

    const [level, setLevel] = useState(1);
    const [variations, setVariations] = useState(1);
    const [loading, setLoading] = useState(false);
    const [brands, setBrands] = useState([]);
    const [hashtags, setHashtags] = useState([]);

    const [formData, setFormData] = useState({
        brand_name: '', topic: '',
        objective: 'Engagement', target_audience: '', platform: 'Instagram', tone: 'Modern',
        art_style: 'Photorealistic', indian_context: '', color_palette: '', text_structure: 'Short Caption'
    });

    // Load brands
    useEffect(() => {
        api.get('/brands').then(setBrands).catch(() => { });
    }, []);

    // Apply template data
    useEffect(() => {
        if (templateData) {
            setFormData(prev => ({ ...prev, ...templateData }));
            setLevel(3);
        }
    }, [templateData]);

    // Apply calendar data
    useEffect(() => {
        if (calendarData) {
            setFormData(prev => ({ ...prev, ...calendarData }));
        }
    }, [calendarData]);

    // Fetch hashtags on topic/brand/platform change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.topic || formData.brand_name) {
                api.get(`/hashtags?brand=${encodeURIComponent(formData.brand_name)}&topic=${encodeURIComponent(formData.topic)}&platform=${encodeURIComponent(formData.platform)}`, false)
                    .then(d => setHashtags(d.hashtags || []))
                    .catch(() => { });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.topic, formData.brand_name, formData.platform]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleColorSelect = (paletteString) => setFormData(prev => ({ ...prev, color_palette: paletteString }));

    const handleBrandSelect = (e) => {
        const brand = brands.find(b => b.id === e.target.value);
        if (brand) {
            setFormData(prev => ({
                ...prev,
                brand_name: brand.name,
                tone: brand.default_tone || prev.tone,
                target_audience: brand.default_audience || prev.target_audience,
                platform: brand.default_platform || prev.platform,
                color_palette: brand.color_palette || prev.color_palette
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await api.post('/generate', { ...formData, level, variations });
            navigate('/result', { state: { data } });
        } catch (err) {
            console.error(err);
            alert(err.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const LevelTab = ({ lvl, icon: Icon, label, desc }) => (
        <button
            type="button" onClick={() => setLevel(lvl)}
            className={`level-tab ${level === lvl ? 'active' : ''}`}
            style={{
                flex: 1, padding: '16px',
                background: level === lvl ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                border: level === lvl ? '1px solid var(--neon-purple)' : '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '8px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: level === lvl ? 'var(--neon-purple)' : 'var(--text-secondary)' }}>
                <Icon size={20} /><span style={{ fontWeight: 600 }}>{label}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</span>
        </button>
    );

    return (
        <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <header className="mb-8 text-center">
                <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold mb-2">
                    Create New Content
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400">
                    Choose your control level and let AI do the rest.
                </motion.p>
            </header>

            <motion.form onSubmit={handleSubmit} className="glass-card" variants={containerVariants} initial="hidden" animate="show" layout>
                {/* Level Tabs */}
                <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <LevelTab lvl={1} icon={Wand2} label="Quick Gen" desc="Fast & Simple" />
                    <LevelTab lvl={2} icon={Layers} label="Studio Mode" desc="Strategic Control" />
                    <LevelTab lvl={3} icon={Video} label="Director Mode" desc="Full Art Control" />
                </motion.div>

                <div style={{ display: 'grid', gap: '24px' }}>
                    {/* Level 1 */}
                    <motion.div variants={itemVariants} className="form-section">
                        <h3 className="section-title flex items-center gap-2 mb-4"><Target size={16} /> Core Identity</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Brand / Profile Name</label>
                                {brands.length > 0 && (
                                    <select onChange={handleBrandSelect} className="form-select" style={{ marginBottom: '8px' }}>
                                        <option value="">— Load from saved brand —</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                )}
                                <input type="text" name="brand_name" className="form-input" placeholder="e.g., Cafe Coffee Day" value={formData.brand_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Topic / Context</label>
                                <input type="text" name="topic" className="form-input" placeholder="e.g., Hiring interns, Diwali Greetings" value={formData.topic} onChange={handleChange} required />
                            </div>
                        </div>
                    </motion.div>

                    {/* Hashtag Preview */}
                    {hashtags.length > 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hashtag-preview">
                            <Hash size={14} className="text-purple-400" />
                            <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>Suggested:</span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {hashtags.slice(0, 8).map((h, i) => (
                                    <span key={i} className="hashtag-chip">{h}</span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Level 2 */}
                    <AnimatePresence>
                        {level >= 2 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="form-section overflow-hidden">
                                <div className="divider" />
                                <h3 className="section-title flex items-center gap-2 mb-4"><Users size={16} /> Strategy & Tone</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Objective</label>
                                        <select name="objective" className="form-select" value={formData.objective} onChange={handleChange}>
                                            <option>Engagement</option><option>Drive Sales/Action</option><option>Brand Awareness</option><option>Educate/Inform</option><option>Festive Greeting</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Target Audience</label>
                                        <input type="text" name="target_audience" className="form-input" placeholder="e.g., College Students" value={formData.target_audience} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Platform</label>
                                        <input type="text" name="platform" className="form-input" placeholder="e.g., Instagram, Poster" value={formData.platform} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tone (Vibe)</label>
                                        <select name="tone" className="form-select" value={formData.tone} onChange={handleChange}>
                                            <option>Modern</option><option>Professional</option><option>Witty/Fun</option><option>Emotional</option><option>Bold/Loud</option><option>Minimalist</option>
                                        </select>
                                    </div>
                                </div>

                                {/* A/B Variations */}
                                <div className="form-group" style={{ marginTop: '16px' }}>
                                    <label className="form-label flex items-center gap-2"><Zap size={14} className="text-yellow-400" /> A/B Variations</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1, 2, 3].map(v => (
                                            <button key={v} type="button" onClick={() => setVariations(v)}
                                                className={`badge badge--clickable ${variations === v ? 'badge--active' : 'badge--ghost'}`}
                                            >
                                                {v === 1 ? 'Single' : `${v} Variations`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Level 3 */}
                    <AnimatePresence>
                        {level >= 3 && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="form-section overflow-hidden">
                                <div className="divider" />
                                <h3 className="section-title flex items-center gap-2 mb-4"><Palette size={16} /> Creative Direction</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Visual Art Style</label>
                                        <select name="art_style" className="form-select" value={formData.art_style} onChange={handleChange}>
                                            <option>Photorealistic</option><option>3D Render (Blender)</option><option>Flat Vector</option><option>Vintage Indian Poster</option><option>Cyberpunk/Neon</option><option>Minimalist Line Art</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Details / Color Palette</label>
                                        <input type="text" name="color_palette" className="form-input" placeholder="e.g., Pastel, #FF5733" value={formData.color_palette} onChange={handleChange} />
                                        <ColorPaletteGenerator onSelect={handleColorSelect} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Indian Context (Optional)</label>
                                        <input type="text" name="indian_context" className="form-input" placeholder="e.g., Mumbai Rain" value={formData.indian_context} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Text Structure</label>
                                        <input type="text" name="text_structure" className="form-input" placeholder="e.g., Short caption, Poem" value={formData.text_structure} onChange={handleChange} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="flex justify-center mt-4" layout>
                        <Magnet strength={30}>
                            <button type="submit" className="neon-button w-full flex justify-center items-center gap-2 px-8" disabled={loading}>
                                {loading ? (
                                    <span className="flex items-center gap-2"><span className="spinner" /> Generating...</span>
                                ) : (
                                    <><Play size={20} fill="currentColor" /> Generate Content</>
                                )}
                            </button>
                        </Magnet>
                    </motion.div>
                </div>
            </motion.form>
        </div>
    );
};

export default Dashboard;
