import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Clock, X } from 'lucide-react';
import api from '../api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ContentCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [scheduled, setScheduled] = useState([]);
    const [history, setHistory] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [unscheduledPosts, setUnscheduledPosts] = useState([]);

    useEffect(() => {
        api.get('/scheduled').then(setScheduled).catch(() => { });
        api.get('/history?limit=100&offset=0').then(d => setHistory(d.items || [])).catch(() => { });
        api.get('/indian-calendar', false).then(setEvents).catch(() => { });
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const getDateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const getPostsForDay = (day) => {
        const dateStr = getDateStr(day);
        return scheduled.filter(p => p.scheduled_date?.startsWith(dateStr));
    };

    const getEventsForDay = (day) => {
        const dateStr = getDateStr(day);
        return events.filter(e => e.date === dateStr);
    };

    const handleDayClick = (day) => {
        setSelectedDay(day);
        const usedIds = new Set(scheduled.map(s => s.id));
        setUnscheduledPosts(history.filter(h => !usedIds.has(h.id) && h.status !== 'scheduled'));
    };

    const handleSchedule = async (postId) => {
        const dateStr = getDateStr(selectedDay);
        try {
            await api.post('/schedule', { generation_id: postId, scheduled_date: dateStr });
            const updated = await api.get('/scheduled');
            setScheduled(updated);
            setShowScheduleModal(false);
        } catch (e) { console.error(e); }
    };

    const handleUnschedule = async (genId) => {
        try {
            await api.delete(`/schedule/${genId}`);
            setScheduled(prev => prev.filter(p => p.id !== genId));
        } catch (e) { console.error(e); }
    };

    const today = new Date();
    const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title"><CalIcon size={28} /> <span className="shiny-text">Content Calendar</span></h2>
                        <p className="page-subtitle">Plan, schedule, and visualize your content pipeline</p>
                    </div>
                </div>

                {/* Month Navigation */}
                <div className="calendar-nav">
                    <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={18} /></button>
                    <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{MONTHS[month]} {year}</h3>
                    <button onClick={nextMonth} className="icon-btn"><ChevronRight size={18} /></button>
                </div>
            </motion.div>

            {/* Calendar Grid */}
            <div className="cal-grid">
                {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
                {cells.map((day, i) => {
                    if (!day) return <div key={`e${i}`} className="cal-cell cal-cell--empty" />;
                    const posts = getPostsForDay(day);
                    const dayEvents = getEventsForDay(day);
                    return (
                        <motion.div
                            key={day}
                            className={`cal-cell ${isToday(day) ? 'cal-cell--today' : ''} ${selectedDay === day ? 'cal-cell--selected' : ''}`}
                            onClick={() => handleDayClick(day)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="cal-day-num">{day}</span>
                            <div className="cal-events">
                                {dayEvents.map((e, j) => (
                                    <div key={j} className="cal-event cal-event--festival" title={e.name}>{e.emoji}</div>
                                ))}
                                {posts.map((p, j) => (
                                    <div key={j} className="cal-event cal-event--post" title={p.brand_name}>
                                        {p.platform?.charAt(0) || '📝'}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Selected Day Panel */}
            {selectedDay && (
                <motion.div className="glass-card" style={{ marginTop: '24px', padding: '24px' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: 700 }}>
                            {MONTHS[month]} {selectedDay}, {year}
                            {isToday(selectedDay) && <span className="badge badge--purple" style={{ marginLeft: '8px' }}>Today</span>}
                        </h3>
                        <button onClick={() => { setShowScheduleModal(true); }} className="neon-button neon-button--small"><Plus size={14} /> Schedule Post</button>
                    </div>

                    {/* Festival Events */}
                    {getEventsForDay(selectedDay).map((e, i) => (
                        <div key={i} className="cal-day-event-row">{e.emoji} <strong>{e.name}</strong> <span className="badge badge--ghost">{e.category}</span></div>
                    ))}

                    {/* Scheduled Posts */}
                    {getPostsForDay(selectedDay).length > 0 ? getPostsForDay(selectedDay).map(p => (
                        <div key={p.id} className="cal-scheduled-card glass-card">
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                                    <span className="badge badge--purple">{p.platform}</span>
                                    <span className="badge badge--ghost">{p.brand_name}</span>
                                </div>
                                <p className="text-sm text-muted">{p.script?.substring(0, 100)}...</p>
                            </div>
                            <button onClick={() => handleUnschedule(p.id)} className="icon-btn icon-btn--danger" title="Unschedule"><X size={14} /></button>
                        </div>
                    )) : (
                        <p className="text-muted text-sm" style={{ marginTop: '12px' }}>No posts scheduled for this day</p>
                    )}
                </motion.div>
            )}

            {/* Schedule Modal */}
            {showScheduleModal && (
                <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
                    <motion.div className="modal glass-card" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Schedule a Post for {MONTHS[month]} {selectedDay}</h3>
                        {unscheduledPosts.length === 0 ? (
                            <p className="text-muted">No unscheduled posts available. Generate content first!</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                {unscheduledPosts.slice(0, 20).map(p => (
                                    <div key={p.id} className="cal-scheduled-card glass-card" onClick={() => handleSchedule(p.id)} style={{ cursor: 'pointer' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                <span className="badge badge--ghost">{p.platform}</span>
                                                <span className="badge badge--ghost">{p.brand_name}</span>
                                            </div>
                                            <p className="text-sm text-muted">{p.script?.substring(0, 80)}...</p>
                                        </div>
                                        <Clock size={16} className="text-muted" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowScheduleModal(false)} className="btn-ghost" style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}>Cancel</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ContentCalendar;
