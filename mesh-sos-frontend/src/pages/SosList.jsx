import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, MoreVertical, ShieldCheck, Activity, Flame, Droplets, Mountain, ShieldAlert, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { sosAPI } from '../api/client';
import './SosList.css';

const STATUS_TABS = ['ALL', 'PENDING', 'DELIVERED', 'RESPONDED'];

const EMERGENCY_CONFIG = {
    MEDICAL: { icon: Activity, color: '#06B6D4' },
    FIRE: { icon: Flame, color: '#F97316' },
    FLOOD: { icon: Droplets, color: '#3B82F6' },
    EARTHQUAKE: { icon: Mountain, color: '#8B5CF6' },
    GENERAL: { icon: ShieldAlert, color: '#E5091A' },
};

export default function SosList() {
    const [allSOS, setAllSOS] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    
    // Pagination & Sorting
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
    const itemsPerPage = 10;
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const data = await sosAPI.getAll();
            setAllSOS(data);
        } catch (err) {
            console.error('Error fetching SOS list:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const counts = useMemo(() => {
        const c = { ALL: allSOS.length, PENDING: 0, DELIVERED: 0, RESPONDED: 0 };
        allSOS.forEach(sos => {
            const effectiveStatus = sos.status === 'RELAYED' ? 'PENDING' : sos.status;
            if (c[effectiveStatus] !== undefined) c[effectiveStatus]++;
        });
        return c;
    }, [allSOS]);

    const filteredAndSortedSOS = useMemo(() => {
        let result = allSOS;
        
        if (filter !== 'ALL') {
            result = result.filter(sos => {
                const effectiveStatus = sos.status === 'RELAYED' ? 'PENDING' : sos.status;
                return effectiveStatus === filter;
            });
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(sos => 
                sos.sos_id.toLowerCase().includes(q) ||
                sos.emergency_type.toLowerCase().includes(q) ||
                (sos.device_id && sos.device_id.toLowerCase().includes(q))
            );
        }

        result.sort((a, b) => {
            if (sortConfig.key === 'timestamp') {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
            if (sortConfig.key === 'type') {
                return sortConfig.direction === 'asc' 
                    ? a.emergency_type.localeCompare(b.emergency_type)
                    : b.emergency_type.localeCompare(a.emergency_type);
            }
            if (sortConfig.key === 'hops') {
                return sortConfig.direction === 'asc' ? a.hop_count - b.hop_count : b.hop_count - a.hop_count;
            }
            return 0;
        });

        return result;
    }, [allSOS, filter, searchQuery, sortConfig]);

    const paginatedSOS = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedSOS.slice(start, start + itemsPerPage);
    }, [filteredAndSortedSOS, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedSOS.length / itemsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleMarkResponded = async (e, sosId) => {
        e.stopPropagation();
        try {
            await sosAPI.updateStatus(sosId);
            toast.success('SOS marked as responded');
            fetchData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const copyCoords = (e, lat, lng) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`${lat}, ${lng}`);
        toast.success('Coordinates copied');
    };

    return (
        <div className="sos-list-page">
            <div className="page-header">
                <div>
                    <h1>SOS History</h1>
                    <p className="text-secondary">Track and manage all SOS signals</p>
                </div>
                <div className="header-actions">
                    <div className="search-input">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search SOS..." 
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    <button className="btn-outline">
                        <Calendar size={18} />
                        <span>Pick Date</span>
                    </button>
                </div>
            </div>

            <div className="filter-pills">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        className={`filter-pill ${filter === tab ? 'active' : ''}`}
                        onClick={() => { setFilter(tab); setCurrentPage(1); }}
                    >
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})
                    </button>
                ))}
            </div>

            <div className="card table-card">
                <div className="table-responsive">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th onClick={() => handleSort('type')} className="sortable">
                                    Type <ArrowUpDown size={14} />
                                </th>
                                <th>Location</th>
                                <th onClick={() => handleSort('timestamp')} className="sortable">
                                    Date & Time <ArrowUpDown size={14} />
                                </th>
                                <th onClick={() => handleSort('hops')} className="sortable">
                                    Hops / TTL <ArrowUpDown size={14} />
                                </th>
                                <th>Status</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-6 text-muted">Loading data...</td>
                                </tr>
                            ) : paginatedSOS.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-6">
                                        <div className="empty-state">
                                            <ShieldCheck size={48} color="var(--text-muted)" />
                                            <h3 className="mt-2">No signals found</h3>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedSOS.map((sos, index) => {
                                    const eConfig = EMERGENCY_CONFIG[sos.emergency_type] || EMERGENCY_CONFIG.GENERAL;
                                    const Icon = eConfig.icon;
                                    const isPending = sos.status === 'PENDING' || sos.status === 'RELAYED';
                                    const utcTime = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';
                                    const dateObj = new Date(utcTime);

                                    return (
                                        <tr key={sos.sos_id} onClick={() => navigate(`/sos/${sos.sos_id}`)}>
                                            <td className="text-muted text-sm font-mono">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td>
                                                <div className="cell-type" style={{ color: eConfig.color }}>
                                                    <Icon size={16} />
                                                    <span>{sos.emergency_type}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-location text-sm text-secondary">
                                                    <MapPin size={14} />
                                                    <span className="font-mono">{sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="cell-datetime text-sm">
                                                    <div className="text-primary-text">{format(dateObj, 'MMM d, yyyy')}</div>
                                                    <div className="text-muted">{format(dateObj, 'HH:mm:ss')}</div>
                                                </div>
                                            </td>
                                            <td className="font-mono text-sm text-secondary">
                                                {sos.hop_count} / {sos.ttl}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${isPending ? 'pending' : sos.status.toLowerCase()}`}>
                                                    {isPending ? 'PENDING' : sos.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-actions">
                                                    {isPending && (
                                                        <button 
                                                            className="btn-mark-sm"
                                                            onClick={(e) => handleMarkResponded(e, sos.sos_id)}
                                                        >
                                                            Mark Responded
                                                        </button>
                                                    )}
                                                    <div className="kebab-menu" onClick={(e) => e.stopPropagation()}>
                                                        <button className="btn-kebab"><MoreVertical size={18} /></button>
                                                        <div className="kebab-dropdown">
                                                            <button onClick={() => navigate(`/sos/${sos.sos_id}`)}>View details</button>
                                                            <button onClick={(e) => copyCoords(e, sos.latitude, sos.longitude)}>Copy coordinates</button>
                                                            <button className="text-danger">Delete</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && totalPages > 1 && (
                    <div className="pagination">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm text-secondary">Page {currentPage} of {totalPages}</span>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
