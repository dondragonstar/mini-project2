import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const steps = [
    {
        target: '.navbar__link[href="/dashboard"]',
        title: 'Welcome to Content Studio AI! 🎨',
        content: 'Create AI-powered marketing content tailored for the Indian audience. Start here on the Studio page.',
        position: 'bottom'
    },
    {
        target: '.level-tab',
        title: 'Choose Your Control Level',
        content: 'Quick Gen for rapid content, Studio Mode for strategic control, or Director Mode for full creative control.',
        position: 'bottom'
    },
    {
        target: '.navbar__link[href="/templates"]',
        title: 'Pre-Built Templates 📋',
        content: 'Browse 15+ Indian marketing templates — Diwali, IPL, Hiring posts and more. One click to auto-fill!',
        position: 'bottom'
    },
    {
        target: '.navbar__link[href="/history"]',
        title: 'Content History 📜',
        content: 'All your generated content is saved here. Search, filter, share, and re-download anytime.',
        position: 'bottom'
    },
    {
        target: '.navbar__link[href="/brands"]',
        title: 'Brand Profiles 🏢',
        content: 'Save multiple brand profiles with default settings. Switch between brands instantly.',
        position: 'bottom'
    },
    {
        target: '.navbar__link[href="/calendar"]',
        title: 'Indian Calendar 📅',
        content: 'Never miss a marketing moment! See upcoming festivals and events with one-click content creation.',
        position: 'bottom'
    },
    {
        target: '.navbar__link[href="/analytics"]',
        title: 'Analytics Dashboard 📊',
        content: 'Track your content generation stats — by platform, tone, brand, and over time.',
        position: 'bottom'
    },
    {
        title: 'Keyboard Shortcuts ⌨️',
        content: 'Use Ctrl+Enter to generate, Ctrl+Shift+T for templates, Ctrl+Shift+H for history. Press ? anytime for help.',
        position: 'center'
    }
];

const OnboardingTour = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [visible, setVisible] = useState(() => localStorage.getItem('onboarding_complete') !== 'true');
    const [position, setPosition] = useState({ top: '50%', left: '50%' });

    useEffect(() => {
        const target = steps[step]?.target;
        if (target) {
            const el = document.querySelector(target);
            if (el) {
                const rect = el.getBoundingClientRect();
                setPosition({
                    top: `${rect.bottom + 12}px`,
                    left: `${Math.max(16, Math.min(rect.left, window.innerWidth - 360))}px`
                });
                el.style.position = 'relative';
                el.style.zIndex = '10001';
                el.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.4)';
                el.style.borderRadius = '8px';
                return () => {
                    el.style.zIndex = '';
                    el.style.boxShadow = '';
                };
            }
        }
        setPosition({ top: '50%', left: '50%' });
    }, [step]);

    const handleNext = () => {
        if (step < steps.length - 1) setStep(s => s + 1);
        else handleComplete();
    };
    const handlePrev = () => { if (step > 0) setStep(s => s - 1); };
    const handleComplete = () => {
        setVisible(false);
        localStorage.setItem('onboarding_complete', 'true');
        if (onComplete) onComplete();
    };

    if (!visible) return null;

    const isCenter = steps[step]?.position === 'center';

    return (
        <>
            <div className="tour-overlay" onClick={handleComplete} />
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    className="tour-tooltip glass-card"
                    style={isCenter ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } : { top: position.top, left: position.left }}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{steps[step].title}</h4>
                        <button onClick={handleComplete} className="icon-btn" style={{ padding: '4px' }}><X size={14} /></button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                        {steps[step].content}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="text-muted text-xs">{step + 1} / {steps.length}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {step > 0 && <button onClick={handlePrev} className="btn-ghost" style={{ fontSize: '0.8rem' }}><ChevronLeft size={14} /> Back</button>}
                            <button onClick={handleNext} className="neon-button neon-button--small" style={{ fontSize: '0.8rem' }}>
                                {step === steps.length - 1 ? <><Sparkles size={14} /> Get Started</> : <>Next <ChevronRight size={14} /></>}
                            </button>
                        </div>
                    </div>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px' }}>
                        {steps.map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === step ? 'var(--neon-purple)' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s' }} />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    );
};

export default OnboardingTour;
