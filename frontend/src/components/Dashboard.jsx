import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Layers, Video, Palette, Type, Globe, Users, Target, Layout, Play } from 'lucide-react';
import Magnet from './reactbits/Magnet';
import ColorPaletteGenerator from './ColorPaletteGenerator';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

const Dashboard = ({ onGenerate }) => {
    const [level, setLevel] = useState(1);
    const [formData, setFormData] = useState({
        // Level 1
        brand_name: '',
        topic: '',
        // Level 2
        objective: 'Engagement',
        target_audience: '',
        platform: 'Instagram',
        tone: 'Modern',
        // Level 3
        art_style: 'Photorealistic',
        indian_context: '',
        color_palette: '',
        text_structure: 'Short Caption'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleColorSelect = (paletteString) => {
        setFormData(prev => ({ ...prev, color_palette: paletteString }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onGenerate({ ...formData, level });
    };

    const LevelTab = ({ lvl, icon: Icon, label, desc }) => (
        <button
            type="button"
            onClick={() => setLevel(lvl)}
            className={`level-tab ${level === lvl ? 'active' : ''}`}
            style={{
                flex: 1,
                padding: '16px',
                background: level === lvl ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255,255,255,0.03)',
                border: level === lvl ? '1px solid var(--neon-purple)' : '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: level === lvl ? 'var(--neon-purple)' : 'var(--text-secondary)' }}>
                <Icon size={20} />
                <span style={{ fontWeight: 600 }}>{label}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</span>
        </button>
    );

    return (
        <div className="dashboard-container max-w-4xl mx-auto p-4">
            <header className="mb-8 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-bold mb-2"
                >
                    Create New Content
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-400"
                >
                    Choose your control level and let AI do the rest.
                </motion.p>
            </header>

            <motion.form
                onSubmit={handleSubmit}
                className="glass-card"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                layout
            >
                {/* Level Tabs */}
                <motion.div variants={itemVariants} style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <LevelTab lvl={1} icon={Wand2} label="Quick Gen" desc="Fast & Simple" />
                    <LevelTab lvl={2} icon={Layers} label="Studio Mode" desc="Strategic Control" />
                    <LevelTab lvl={3} icon={Video} label="Director Mode" desc="Full Art Control" />
                </motion.div>

                {/* Inputs Container */}
                <div style={{ display: 'grid', gap: '24px' }}>

                    {/* Level 1 Inputs (Always Visible) */}
                    <motion.div variants={itemVariants} className="form-section">
                        <h3 className="section-title flex items-center gap-2 mb-4">
                            <Target size={16} /> Core Identity
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Brand / Profile Name</label>
                                <input
                                    type="text"
                                    name="brand_name"
                                    className="form-input"
                                    placeholder="e.g., Cafe Coffee Day, TechStart Inc."
                                    value={formData.brand_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Topic / Context</label>
                                <input
                                    type="text"
                                    name="topic"
                                    className="form-input"
                                    placeholder="e.g., Hiring interns, Diwali Greetings"
                                    value={formData.topic}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Level 2 Inputs */}
                    <AnimatePresence>
                        {level >= 2 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="form-section overflow-hidden"
                            >
                                <div className="divider" />
                                <h3 className="section-title flex items-center gap-2 mb-4">
                                    <Users size={16} /> Strategy & Tone
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Objective</label>
                                        <select name="objective" className="form-select" value={formData.objective} onChange={handleChange}>
                                            <option>Engagement</option>
                                            <option>Drive Sales/Action</option>
                                            <option>Brand Awareness</option>
                                            <option>Educate/Inform</option>
                                            <option>Festive Greeting</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Target Audience</label>
                                        <input
                                            type="text"
                                            name="target_audience"
                                            className="form-input"
                                            placeholder="e.g., College Students, Professionals"
                                            value={formData.target_audience}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Platform</label>
                                        {/* Changed to Text Input as requested */}
                                        <input
                                            type="text"
                                            name="platform"
                                            className="form-input"
                                            placeholder="e.g., Instagram, Poster, BillBoard..."
                                            value={formData.platform}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Tone (Vibe)</label>
                                        <select name="tone" className="form-select" value={formData.tone} onChange={handleChange}>
                                            <option>Modern</option>
                                            <option>Professional</option>
                                            <option>Witty/Fun</option>
                                            <option>Emotional</option>
                                            <option>Bold/Loud</option>
                                            <option>Minimalist</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Level 3 Inputs */}
                    <AnimatePresence>
                        {level >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="form-section overflow-hidden"
                            >
                                <div className="divider" />
                                <h3 className="section-title flex items-center gap-2 mb-4">
                                    <Palette size={16} /> Creative Direction
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Visual Art Style</label>
                                        <select name="art_style" className="form-select" value={formData.art_style} onChange={handleChange}>
                                            <option>Photorealistic</option>
                                            <option>3D Render (Blender)</option>
                                            <option>Flat Vector</option>
                                            <option>Vintage Indian Poster</option>
                                            <option>Cyberpunk/Neon</option>
                                            <option>Minimalist Line Art</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Details / Color Palette</label>
                                        <input
                                            type="text"
                                            name="color_palette"
                                            className="form-input"
                                            placeholder="e.g., Pastel, Golden Hour, #FF5733"
                                            value={formData.color_palette}
                                            onChange={handleChange}
                                        />
                                        <ColorPaletteGenerator onSelect={handleColorSelect} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Indian Context (Optional)</label>
                                        <input
                                            type="text"
                                            name="indian_context"
                                            className="form-input"
                                            placeholder="e.g., Mumbai Rain, Rajasthani colors"
                                            value={formData.indian_context}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Text Structure</label>
                                        {/* Changed to Text Input as requested */}
                                        <input
                                            type="text"
                                            name="text_structure"
                                            className="form-input"
                                            placeholder="e.g., Short caption, Bullet points, Poem..."
                                            value={formData.text_structure}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="flex justify-center mt-4" layout>
                        <Magnet strength={30}>
                            <button type="submit" className="neon-button w-full flex justify-center items-center gap-2 px-8">
                                <Play size={20} fill="currentColor" /> Generate Content
                            </button>
                        </Magnet>
                    </motion.div>
                </div>
            </motion.form>
        </div>
    );
};

export default Dashboard;
