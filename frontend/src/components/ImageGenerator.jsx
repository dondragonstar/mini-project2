import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const ImageGenerator = () => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [imageData, setImageData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setImageData(null);

        try {
            const data = await api.post('/generate-image', { prompt });
            if (data.image_base64) {
                setImageData(`data:image/jpeg;base64,${data.image_base64}`);
            } else {
                throw new Error('No image data received');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><span className="shiny-text">AI Image Studio</span></h2>
                        <p className="page-subtitle">Generate stunning visuals from text prompts</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card p-6">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Describe your vision</label>
                                <textarea
                                    value={prompt} onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A futuristic cyberpunk city with neon lights and flying cars, high detailed, digital art..."
                                    className="content-editor__textarea"
                                    style={{ border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-sm)', minHeight: '160px' }}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="neon-button" style={{ width: '100%' }}>
                                {loading ? <span className="flex items-center justify-center gap-2"><span className="spinner" /> Generating Magic...</span> : 'Generate Art'}
                            </button>
                            {error && <div className="error-message">{error}</div>}
                        </form>
                    </div>

                    <div className="glass-card p-6 flex flex-col items-center justify-center" style={{ minHeight: '400px', borderStyle: 'dashed' }}>
                        {imageData ? (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group w-full">
                                <img src={imageData} alt="Generated Art" className="w-full h-auto rounded-lg" style={{ boxShadow: '0 8px 32px var(--glass-shadow)' }} />
                                <div style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                    opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 'var(--radius-md)', transition: 'opacity 0.3s'
                                }} className="group-hover:opacity-100">
                                    <a href={imageData} download={`generated-art-${Date.now()}.jpg`} className="neon-button neon-button--small">
                                        Download Image
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🎨</div>
                                <p>Your masterpiece will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ImageGenerator;
