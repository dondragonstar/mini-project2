import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const KeyboardShortcuts = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e) => {
            // Ctrl+Enter: Submit generate form
            if (e.ctrlKey && e.key === 'Enter') {
                const submitBtn = document.querySelector('.neon-button[type="submit"]');
                if (submitBtn) { e.preventDefault(); submitBtn.click(); }
            }
            // Ctrl+Shift+T: Templates
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault(); navigate('/templates');
            }
            // Ctrl+Shift+H: History
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault(); navigate('/history');
            }
            // Ctrl+Shift+A: Analytics
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault(); navigate('/analytics');
            }
            // Ctrl+Shift+D: Dashboard
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault(); navigate('/dashboard');
            }
            // Escape: Close modals
            if (e.key === 'Escape') {
                const overlay = document.querySelector('.modal-overlay');
                if (overlay) overlay.click();
            }
            // ? key: Show shortcuts (when not typing)
            if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
                e.preventDefault();
                const msg = `⌨️ Keyboard Shortcuts\n\nCtrl+Enter — Generate content\nCtrl+Shift+D — Dashboard\nCtrl+Shift+T — Templates\nCtrl+Shift+H — History\nCtrl+Shift+A — Analytics\nEsc — Close modals\n? — Show this help`;
                alert(msg);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [navigate]);

    return null;
};

export default KeyboardShortcuts;
