import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Result from './components/Result';
import ImageGenerator from './components/ImageGenerator';
import PageTransition from './components/PageTransition';


// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

// Wrapper to handle Navigation after generation correctly
const DashboardWrapper = ({ onGenerate }) => {
    const navigate = useNavigate();
    const handleGen = async (data) => {
        try {
            const response = await fetch('http://localhost:8000/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error("API Error");
            const resData = await response.json();
            onGenerate(resData);
            navigate('/result');
        } catch (e) {
            alert("Generation failed: " + e.message);
        }
    }

    return (
        <PageTransition className="app">
            <header className="header" style={{ marginBottom: '20px', paddingTop: '20px' }}>
                <div className="header__logo">
                    <h1 className="header__title text-2xl">
                        <span className="shiny-text">Content Studio AI</span>
                    </h1>
                </div>
                <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                    <button onClick={() => {
                        localStorage.clear();
                        navigate('/login');
                    }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
                </div>
            </header>
            <Dashboard onGenerate={handleGen} />
            <footer className="footer">Content Studio AI</footer>
        </PageTransition>
    );
};

const ResultWrapper = ({ data }) => {
    // Safety check - if user reloads on result page, they lose data, so send back to dashboard
    if (!data) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <PageTransition className="app">
            <header className="header" style={{ marginBottom: '20px', paddingTop: '20px' }}>
                <h1 className="header__title text-2xl"><span className="shiny-text">Content Studio AI</span></h1>
            </header>
            <Result data={data} />
        </PageTransition>
    );
};

const AuthWrapper = () => {
    return (
        <PageTransition>
            <Auth />
        </PageTransition>
    );
}

const AnimatedRoutes = () => {
    const location = useLocation();
    const [generatedData, setGeneratedData] = useState(null);

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<AuthWrapper />} />
                <Route path="/register" element={<AuthWrapper />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashboardWrapper onGenerate={setGeneratedData} />
                    </ProtectedRoute>
                } />

                <Route path="/result" element={
                    <ProtectedRoute>
                        <ResultWrapper data={generatedData} />
                    </ProtectedRoute>
                } />

                <Route path="/image-generator" element={
                    <ProtectedRoute>
                        <PageTransition>
                            <ImageGenerator />
                        </PageTransition>
                    </ProtectedRoute>
                } />


                <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default App;
