import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Magnet from './reactbits/Magnet';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const endpoint = isLogin ? 'login' : 'register';
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : formData;

        try {
            const response = await fetch(`http://localhost:8000/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Authentication failed');
            }

            if (isLogin) {
                // Store user data mock
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', data.username);
                navigate('/dashboard');
            } else {
                // Auto switch to login after register
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '450px', overflow: 'hidden' }}
            >
                <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="shiny-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Content Studio AI</h1>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={isLogin ? "login" : "register"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {isLogin ? 'Welcome back, Creator.' : 'Start your journey.'}
                        </motion.p>
                    </AnimatePresence>
                </header>

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="popLayout">
                        {!isLogin && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                layout
                            >
                                <label className="form-label">Username</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        name="username"
                                        className="form-input"
                                        style={{ paddingLeft: '48px' }}
                                        placeholder="Create a username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div layout className="form-group">
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                style={{ paddingLeft: '48px' }}
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div layout className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                name="password"
                                className="form-input"
                                style={{ paddingLeft: '48px' }}
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </motion.div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="error-message"
                            style={{ marginBottom: '16px' }}
                        >
                            {error}
                        </motion.p>
                    )}

                    <motion.div layout style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
                        <Magnet strength={30}>
                            <button type="submit" className="neon-button" style={{ width: '100%', minWidth: '200px' }} disabled={isLoading}>
                                {isLoading ? <span className="spinner"></span> : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isLogin ? 'Login' : 'Create Account'} <ArrowRight size={18} />
                                    </span>
                                )}
                            </button>
                        </Magnet>
                    </motion.div>
                </form>

                <motion.div layout style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--neon-purple)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {isLogin ? 'Register' : 'Login'}
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Auth;
