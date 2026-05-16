import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Search, Trash2, ExternalLink, Image, MessageSquare, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';
import { GridSkeleton } from './Skeleton';

const HistoryPage = () => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [page, setPage] = useState(0);
    const navigate = useNavigate();
    const perPage = 12;

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let path = `/history?limit=${perPage}&offset=${page * perPage}`;
            if (search) path += `&brand=${encodeURIComponent(search)}`;
            if (platformFilter) path += `&platform=${encodeURIComponent(platformFilter)}`;
            const data = await api.get(path);
            setItems(data.items);
            setTotal(data.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [page, search, platformFilter]);

    const handleDelete = async (id) => {
        if (!confirm('Delete this generation?')) return;
        await api.delete(`/history/${id}`);
        fetchHistory();
    };

    const shareUrl = (shareId) => `${window.location.origin}/share/${shareId}`;

    const copyShareLink = (shareId) => {
        navigator.clipboard.writeText(shareUrl(shareId));
        alert('Share link copied!');
    };

    const handleOpen = (item) => {
        navigate('/result', { state: { data: item } });
    };

    const totalPages = Math.ceil(total / perPage);

    return (
        <div className="page-container">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="page-header">
                    <div>
                        <h2 className="page-title">
                            <HistoryIcon size={28} className="text-purple-400" />
                            <span className="shiny-text">Content History</span>
                        </h2>
                        <p className="page-subtitle">{total} generation{total !== 1 ? 's' : ''} total</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="filter-bar">
                    <div className="search-box">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search by brand..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            className="form-input"
                        />
                    </div>
                    <div className="search-box">
                        <Filter size={16} />
                        <select
                            value={platformFilter}
                            onChange={e => { setPlatformFilter(e.target.value); setPage(0); }}
                            className="form-select"
                        >
                            <option value="">All Platforms</option>
                            <option>Instagram</option>
                            <option>LinkedIn</option>
                            <option>Twitter</option>
                            <option>YouTube</option>
                            <option>WhatsApp</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {loading ? <GridSkeleton count={6} /> : items.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="empty-state">
                    <div className="empty-state__icon">📭</div>
                    <h3>No content yet</h3>
                    <p>Your generated content will appear here</p>
                    <button onClick={() => navigate('/dashboard')} className="neon-button" style={{ marginTop: '16px' }}>Create Content</button>
                </motion.div>
            ) : (
                <>
                    <motion.div
                        className="history-grid"
                        initial="hidden" animate="show"
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
                    >
                        {items.map(item => (
                            <motion.div
                                key={item.id}
                                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                                className="history-card glass-card"
                                layout
                            >
                                {item.image_url && (
                                    <div className="history-card__image">
                                        <img src={item.image_url} alt="" loading="lazy" />
                                    </div>
                                )}
                                <div className="history-card__body">
                                    <div className="history-card__meta">
                                        <span className="badge badge--purple">{item.platform || 'General'}</span>
                                        <span className="badge badge--ghost">{item.tone || 'Default'}</span>
                                        <span className="text-xs text-muted">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <h4 className="history-card__brand">{item.brand_name}</h4>
                                    <p className="history-card__script">{item.script?.substring(0, 120)}...</p>
                                </div>
                                <div className="history-card__actions">
                                    <button onClick={() => handleOpen(item)} className="icon-btn" title="Open in Studio">
                                        <Image size={14} /> View
                                    </button>
                                    <button onClick={() => copyShareLink(item.share_id)} className="icon-btn" title="Copy share link">
                                        <ExternalLink size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="icon-btn icon-btn--danger" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="icon-btn">
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-sm text-muted">Page {page + 1} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="icon-btn">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default HistoryPage;
