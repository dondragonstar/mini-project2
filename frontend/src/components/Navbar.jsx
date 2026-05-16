import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeContext';
import { Sun, Moon, Menu, X, LogOut, Home, History, LayoutTemplate, BarChart3, Calendar, Palette, Image, CalendarRange, Target, Trophy, Lightbulb, ClipboardCheck, Recycle } from 'lucide-react';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Studio', icon: Home, id: 'nav-dashboard', primary: true },
    { path: '/content-calendar', label: 'Calendar', icon: CalendarRange, id: 'nav-content-cal', primary: true },
    { path: '/campaigns', label: 'Campaigns', icon: Target, id: 'nav-campaigns', primary: true },
    { path: '/history', label: 'History', icon: History, id: 'nav-history', primary: true },
    { path: '/templates', label: 'Templates', icon: LayoutTemplate, id: 'nav-templates', primary: true },
    { path: '/approvals', label: 'Review', icon: ClipboardCheck, id: 'nav-approvals', primary: true },
    { path: '/inspiration', label: 'Ideas', icon: Lightbulb, id: 'nav-inspiration' },
    { path: '/brands', label: 'Brands', icon: Palette, id: 'nav-brands' },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, id: 'nav-analytics' },
    { path: '/progress', label: 'XP', icon: Trophy, id: 'nav-progress' },
    { path: '/smart-queue', label: 'Queue', icon: Recycle, id: 'nav-queue' },
    { path: '/image-gen', label: 'Image AI', icon: Image, id: 'nav-image' },
    { path: '/calendar', label: 'Festivals', icon: Calendar, id: 'nav-calendar' },
];

const Navbar = () => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('username'); navigate('/auth'); };

    return (
        <>
            <nav className="navbar" id="main-navbar">
                <Link to="/dashboard" className="navbar__logo shiny-text">Content Studio AI</Link>
                <div className="navbar__links">
                    {NAV_ITEMS.filter(i => i.primary).map(item => (
                        <Link key={item.path} to={item.path} id={item.id}
                            className={`navbar__link ${location.pathname === item.path ? 'navbar__link--active' : ''}`}>
                            <item.icon size={15} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
                <div className="navbar__actions">
                    <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button onClick={handleLogout} className="icon-btn icon-btn--danger" title="Logout"><LogOut size={18} /></button>
                    <button onClick={() => setMobileOpen(!mobileOpen)} className="navbar__hamburger">
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div className="mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
                        <motion.div className="mobile-sidebar" initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25 }}>
                            <div className="mobile-sidebar__header">
                                <span className="shiny-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>Content Studio AI</span>
                            </div>
                            <div className="mobile-sidebar__links">
                                {NAV_ITEMS.map(item => (
                                    <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                                        className={`mobile-sidebar__link ${location.pathname === item.path ? 'mobile-sidebar__link--active' : ''}`}>
                                        <item.icon size={18} /> {item.label}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
