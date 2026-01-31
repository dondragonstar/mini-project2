import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${token}` // If backend required auth for this, but currently it doesn't in main.py, though it might be good practice. The backend endpoint code didn't add Depends(get_current_user) so it's public.
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Generation failed');
            }

            const data = await response.json();
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
        <div className="dashboard-container">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold shiny-text">AI Image Studio</h2>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Input */}
                    <div className="glass-card p-6">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">
                                    Describe your vision
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A futuristic cyberpunk city with neon lights and flying cars, high detailed, digital art..."
                                    className="w-full h-40 p-4 rounded-lg bg-black/40 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-white placeholder-gray-500 resize-none"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-[1.02] ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">✨</span> Generating Magic...
                                    </span>
                                ) : (
                                    'Generate Art'
                                )}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right Column: Result */}
                    <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-white/10">
                        {imageData ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative group w-full"
                            >
                                <img
                                    src={imageData}
                                    alt="Generated Art"
                                    className="w-full h-auto rounded-lg shadow-2xl"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                    <a
                                        href={imageData}
                                        download={`generated-art-${Date.now()}.jpg`}
                                        className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        Download Image
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <div className="text-6xl mb-4">🎨</div>
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
