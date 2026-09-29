import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Activity, Users, ShieldCheck, ChevronRight, MapPin, Clock, Signal } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import StatusCard from '../components/StatusCard';
import Map from '../components/Map';
import { sosAPI } from '../api/client';
import './Dashboard.css';

const EMERGENCY_CONFIG = {
    MEDICAL: { color: '#06B6D4' },
    FIRE: { color: '#F97316' },
    FLOOD: { color: '#3B82F6' },
    EARTHQUAKE: { color: '#8B5CF6' },
    GENERAL: { color: '#E5091A' },
};

export default function Dashboard({ isUserDashboard = false }) {
    const [activeSOS, setActiveSOS] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const navigate = useNavigate();

    const fetchData = async (silent = false) => {
        try {
            const [sosData, statsData] = await Promise.all([
                isUserDashboard ? sosAPI.getMySos() : sosAPI.getActive(),
                isUserDashboard ? Promise.resolve(null) : sosAPI.getStats()
            ]);
            setActiveSOS(sosData);
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            if (!silent) toast.error('Connection lost. Retrying...');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const dataInterval = setInterval(() => fetchData(true), 10000);
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
        
        return () => {
            clearInterval(dataInterval);
            clearInterval(timeInterval);
        };
    }, []);

    const handleMarkResponded = async (e, sosId) => {
        e.stopPropagation(); // prevent row click
        try {
            await sosAPI.updateStatus(sosId);
            toast.success('SOS marked as responded');
            fetchData(true);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="dashboard-page">
            <div className="dashboard-header-row">
                <div className="title-section">
                    <h1>
                        <span className="text-white">{isUserDashboard ? 'My' : 'Emergency'}</span> <span className="text-primary">Dashboard</span>
                    </h1>
                    <p className="text-secondary">{isUserDashboard ? 'Manage your SOS signals' : 'Real-time monitoring of mesh network SOS signals'}</p>
                </div>
                <div className="system-status-pill">
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="font-semibold text-sm">Live System</span>
                    </div>
                    <div className="current-time font-mono text-xs text-muted">
                        {format(currentTime, 'MMM d, yyyy HH:mm')}
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                {loading ? (
                    Array(4).fill(0).map((_, i) => <div key={i} className="skeleton-box" style={{ height: 120 }}></div>)
                ) : isUserDashboard ? (
                    <>
                        <StatusCard
                            icon={AlertCircle}
                            label="My SOS Signals"
                            value={activeSOS.length}
                            color="var(--status-emergency)"
                            subtext="Your submitted alerts"
                        />
                    </>
                ) : (
                    <>
                        <StatusCard
                            icon={AlertCircle}
                            label="Active SOS"
                            value={stats?.activeSOS || activeSOS.length}
                            color="var(--status-emergency)"
                            subtext="Requiring attention"
                        />
                        <StatusCard
                            icon={Activity}
                            label="Total SOS"
                            value={stats?.totalSOS || 0}
                            color="var(--status-pending)"
                            subtext="All time signals"
                        />
                        <StatusCard
                            icon={Users}
                            label="Total Nodes"
                            value={stats?.totalNodes || 0}
                            color="var(--status-info)"
                            subtext="Online in network"
                        />
                        <StatusCard
                            icon={ShieldCheck}
                            label="Response Rate"
                            value={stats?.responseRate ? `${stats.responseRate}%` : 'N/A'}
                            color="var(--status-responded)"
                            subtext="Average response time"
                        />
                    </>
                )}
            </div>

            <div className="card map-card">
                <div className="card-header">
                    <div className="flex items-center gap-2">
                        <h2>Live Map</h2>
                        <span className="live-dot-small"></span>
                    </div>
                    <span className="text-muted text-sm">Real-time SOS locations</span>
                </div>
                <div className="map-container-inner">
                    {loading ? <div className="skeleton-box" style={{ height: 300 }}></div> : <Map activeSOS={activeSOS} />}
                </div>
            </div>

            <div className="card active-emergencies-card">
                <div className="card-header space-between">
                    <div className="flex items-center gap-3">
                        <h2>{isUserDashboard ? 'My Signals' : 'Active Emergencies'}</h2>
                        {!loading && activeSOS.length > 0 && (
                            <span className="badge-count">{activeSOS.length}</span>
                        )}
                    </div>
                    {!isUserDashboard && <Link to="/sos-list" className="link-view-all text-sm">View All &rarr;</Link>}
                </div>
                
                <div className="card-body">
                    {loading ? (
                        <div className="skeleton-box" style={{ height: 200 }}></div>
                    ) : activeSOS.length === 0 ? (
                        <div className="empty-state">
                            <ShieldCheck size={48} color="var(--status-responded)" />
                            <h3>All clear</h3>
                            <p className="text-secondary">No active emergencies at this time.</p>
                        </div>
                    ) : (
                        <div className="emergency-rows">
                            {activeSOS.map((sos) => {
                                const eConfig = EMERGENCY_CONFIG[sos.emergency_type] || EMERGENCY_CONFIG.GENERAL;
                                const utcTime = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';
                                
                                return (
                                    <div 
                                        key={sos.sos_id} 
                                        className="emergency-row"
                                        onClick={() => navigate(`/sos/${sos.sos_id}`)}
                                    >
                                        <div className="row-icon" style={{ backgroundColor: `${eConfig.color}20`, color: eConfig.color }}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div className="row-content">
                                            <div className="row-header">
                                                <span className="type-label" style={{ color: eConfig.color }}>{sos.emergency_type}</span>
                                                <span className="badge badge-emergency">ACTIVE</span>
                                            </div>
                                            <div className="row-meta">
                                                <span className="meta-item"><MapPin size={14}/> {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}</span>
                                                <span className="meta-item"><Clock size={14}/> {formatDistanceToNow(new Date(utcTime), { addSuffix: true })}</span>
                                                <span className="meta-item"><Signal size={14}/> {sos.hop_count} hops - TTL: {sos.ttl}</span>
                                            </div>
                                        </div>
                                        <div className="row-actions">
                                            {!isUserDashboard && (
                                                <button 
                                                    className="btn-mark"
                                                    onClick={(e) => handleMarkResponded(e, sos.sos_id)}
                                                >
                                                    Mark Responded
                                                </button>
                                            )}
                                            <ChevronRight size={20} className="text-muted" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
