import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronRight, Clock } from 'lucide-react';
import api from '../api';

const CalendarPage = ({ onSelectEvent }) => {
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/indian-calendar', false).then(setEvents).catch(console.error);
    }, []);

    const today = new Date().toISOString().split('T')[0];
    const upcoming = events.filter(e => e.date >= today);
    const filtered = filter === 'All' ? upcoming : upcoming.filter(e => e.category === filter);

    const daysUntil = (dateStr) => {
        const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today!';
        if (diff === 1) return 'Tomorrow';
        if (diff < 0) return 'Passed';
        return `${diff} days`;
    };

    const handleCreateContent = (event) => {
        navigate('/dashboard', {
            state: {
                calendarData: {
                    topic: `${event.name} Campaign`,
                    indian_context: event.name
                }
            }
        });
    };

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title">
                            <CalendarIcon size={28} className="text-yellow-400" />
                            <span className="shiny-text">Indian Calendar</span>
                        </h2>
                        <p className="page-subtitle">Upcoming festivals & events — never miss a marketing moment!</p>
                    </div>
                </div>

                <div className="filter-bar" style={{ gap: '8px', flexWrap: 'wrap' }}>
                    {['All', 'Festival', 'National', 'Trending'].map(cat => (
                        <button key={cat} onClick={() => setFilter(cat)}
                            className={`badge badge--clickable ${filter === cat ? 'badge--active' : 'badge--ghost'}`}
                        >{cat}</button>
                    ))}
                </div>
            </motion.div>

            <motion.div className="calendar-list" initial="hidden" animate="show"
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }}>
                {filtered.map((event, i) => {
                    const days = daysUntil(event.date);
                    const isClose = parseInt(days) <= 7 && days !== 'Today!' && !days.includes('Passed');
                    const isToday = days === 'Today!';

                    return (
                        <motion.div key={`${event.date}-${i}`}
                            variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
                            className={`calendar-item glass-card ${isToday ? 'calendar-item--today' : ''} ${isClose ? 'calendar-item--soon' : ''}`}
                        >
                            <div className="calendar-item__date">
                                <span className="calendar-item__day">{new Date(event.date).getDate()}</span>
                                <span className="calendar-item__month">{new Date(event.date).toLocaleString('en-IN', { month: 'short' })}</span>
                            </div>
                            <div className="calendar-item__info">
                                <span style={{ fontSize: '1.5rem' }}>{event.emoji}</span>
                                <div>
                                    <h4 className="calendar-item__name">{event.name}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="badge badge--ghost">{event.category}</span>
                                        <span className={`calendar-item__countdown ${isToday ? 'text-green' : isClose ? 'text-orange' : ''}`}>
                                            <Clock size={12} /> {days}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleCreateContent(event)} className="icon-btn icon-btn--accent" title="Create content for this event">
                                <ChevronRight size={18} />
                            </button>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default CalendarPage;
