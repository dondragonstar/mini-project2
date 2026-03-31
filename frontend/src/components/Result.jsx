import { motion } from 'framer-motion';
import { Copy, ArrowLeft, Check, Sparkles, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import BlurText from './reactbits/BlurText';
import StarBorder from './reactbits/StarBorder';

const Result = ({ data }) => {
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedPrompt, setCopiedPrompt] = useState(false);

    if (!data) return null;

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'script') {
            setCopiedScript(true);
            setTimeout(() => setCopiedScript(false), 2000);
        } else {
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000);
        }
    };

    return (
        <div className="result-container max-w-6xl mx-auto p-4 md:p-8">
            <Link to="/dashboard" className="group flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors w-fit">
                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-all">
                    <ArrowLeft size={18} />
                </div>
                <span>Back to Studio</span>
            </Link>

            <header className="mb-12 text-center">
                <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-5xl font-bold mb-4"
                >
                    <span className="shiny-text">Content Generated</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-gray-400"
                >
                    Here is your tailored content, ready for the world.
                </motion.p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* Script Section */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                    className="relative h-full"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl opacity-20 blur-xl"></div>
                    <div className="relative glass-card h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                            <div className="flex items-center gap-3 text-pink-400">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="text-xl font-bold">Marketing Script</h3>
                            </div>
                            <button
                                onClick={() => handleCopy(data.script, 'script')}
                                className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-300 hover:text-white"
                            >
                                {copiedScript ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                {copiedScript ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="flex-grow font-medium leading-relaxed text-lg bg-black/20 p-6 rounded-xl border border-white/5 shadow-inner overflow-y-auto">
                            <div className="text-gray-200">
                                {data.script.split('\n').map((paragraph, i) => (
                                    paragraph.trim() === '' ? <br key={i} /> :
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * i, duration: 0.5 }}
                                            key={i}
                                            className="mb-4 last:mb-0"
                                        >
                                            {paragraph}
                                        </motion.p>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Visual Prompt Section */}
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.3 }}
                    className="relative h-full"
                >
                    <StarBorder as="div" className="h-full relative glass-card group overflow-hidden" speed="6s" color="#ff6b35">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                                <div className="flex items-center gap-3 text-orange-400">
                                    <div className="p-2 bg-orange-500/10 rounded-lg">
                                        <ImageIcon size={20} />
                                    </div>
                                    <h3 className="text-xl font-bold">Visual Output</h3>
                                </div>
                                <button
                                    onClick={() => handleCopy(data.visual_prompt, 'visual')}
                                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-gray-300 hover:text-white"
                                >
                                    {copiedPrompt ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                    {copiedPrompt ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            <div className="flex-grow flex flex-col gap-4">
                                {data.image_url ? (
                                    <div className="w-full aspect-square bg-black/40 rounded-xl border border-white/10 shadow-[0_0_40px_-10px_rgba(255,107,53,0.2)] overflow-hidden flex items-center justify-center relative transition-all hover:shadow-[0_0_50px_-5px_rgba(255,107,53,0.4)]">
                                        <img
                                            src={data.image_url}
                                            alt="Generated Visual"
                                            className="w-full h-full object-cover transition-opacity duration-500"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                                    </div>
                                ) : (
                                    <div className="w-full aspect-square bg-black/40 rounded-xl border border-white/10 flex items-center justify-center text-gray-500">
                                        <span>No Preview Available</span>
                                    </div>
                                )}

                                <div className="p-4 bg-gradient-to-br from-orange-500/5 to-purple-500/5 rounded-xl border border-white/10 relative overflow-hidden group-hover:border-orange-500/30 transition-colors">
                                    <div className="absolute top-2 left-2 text-orange-500/20 text-4xl font-serif">"</div>
                                    <div className="relative z-10 italic text-gray-300 leading-relaxed text-sm px-2">
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>{data.visual_prompt}</motion.span>
                                    </div>
                                    <div className="absolute bottom-2 right-4 text-orange-500/20 text-4xl font-serif">"</div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-widest">Optimized for</p>
                                <div className="flex justify-center gap-4 mt-2">
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400">Midjourney</span>
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400">DALL-E 3</span>
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400">Stable Diffusion</span>
                                </div>
                            </div>
                        </div>
                    </StarBorder>
                </motion.div>
            </div>
        </div>
    );
};

export default Result;
