import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Wand2, Sparkles } from 'lucide-react';
import api from '../api';

const CATEGORIES = ['All', 'Festival', 'National', 'Business', 'Sports', 'Food', 'Trending'];

const TemplatesPage = () => {
    const [templates, setTemplates] = useState([]);
    const [category, setCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/templates', false).then(data => {
            setTemplates(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = category === 'All' ? templates : templates.filter(t => t.category === category);

    const handleUse = (template) => {
        navigate('/dashboard', { state: { templateData: template.data } });
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title">
                            <Bookmark size={28} className="text-orange-400" />
                            <span className="shiny-text">Content Templates</span>
                        </h2>
                        <p className="page-subtitle">Pre-built templates for Indian marketing — just click and generate!</p>
                    </div>
                </div>

                <div className="filter-bar" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`badge badge--clickable ${category === cat ? 'badge--active' : 'badge--ghost'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="templates-grid"
                initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
            >
                {filtered.map(template => (
                    <motion.div
                        key={template.id}
                        variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
                        className="template-card glass-card"
                        whileHover={{ scale: 1.02, y: -4 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className="template-card__header">
                            <span style={{ fontSize: '2rem' }}>{template.name.split(' ')[0]}</span>
                            <span className="badge badge--purple">{template.category}</span>
                        </div>
                        <h3 className="template-card__name">{template.name.split(' ').slice(1).join(' ')}</h3>
                        <p className="template-card__desc">{template.description}</p>
                        <div className="template-card__tags">
                            <span className="badge badge--ghost">{template.data.platform}</span>
                            <span className="badge badge--ghost">{template.data.tone}</span>
                        </div>
                        <button onClick={() => handleUse(template)} className="neon-button neon-button--small">
                            <Wand2 size={14} /> Use Template
                        </button>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
};

export default TemplatesPage;
