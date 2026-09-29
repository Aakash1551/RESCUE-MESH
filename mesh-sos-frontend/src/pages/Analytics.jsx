import { useState, useEffect, useMemo } from 'react';
import { 
    BarChart2, 
    Clock, 
    Activity, 
    ShieldCheck, 
    Signal, 
    Globe, 
    MapPin, 
    AlertCircle,
    ChevronDown,
    Calendar,
    Flame,
    Droplets,
    Mountain,
    ShieldAlert
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subHours, differenceInMinutes, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import StatusCard from '../components/StatusCard';
import Map from '../components/Map';
import { sosAPI } from '../api/client';
import './Analytics.css';

const EMERGENCY_CONFIG = {
    MEDICAL: { color: '#06B6D4', icon: Activity },
    FIRE: { color: '#F97316', icon: Flame },
    FLOOD: { color: '#3B82F6', icon: Droplets },
    EARTHQUAKE: { color: '#8B5CF6', icon: Mountain },
    GENERAL: { color: '#E5091A', icon: ShieldAlert },
    ACCIDENT: { color: '#EAB308', icon: AlertCircle },
    SECURITY: { color: '#A855F7', icon: ShieldCheck },
    OTHER: { color: '#6B7280', icon: AlertCircle }
};

const CHART_COLORS = ['#E5091A', '#F5B301', '#22C55E', '#3B82F6', '#8B5CF6', '#06B6D4', '#F97316'];

export default function Analytics() {
    const [allSOS, setAllSOS] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(168); // Default 7 days in hours

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const data = await sosAPI.getAll(dateFilter, 5000);
            setAllSOS(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, [dateFilter]);

    // Data computations
    const stats = useMemo(() => {
        if (!allSOS.length) return null;

        const total = allSOS.length;
        const responded = allSOS.filter(s => s.status === 'RESPONDED');
        const pending = allSOS.filter(s => s.status === 'PENDING' || s.status === 'RELAYED');
        const delivered = allSOS.filter(s => s.status === 'DELIVERED');
        
        let totalResponseTime = 0;
        let minResponse = Infinity;
        let maxResponse = 0;
        let respondedCountWithTime = 0;

        responded.forEach(s => {
            if (s.responded_at && s.timestamp) {
                const start = new Date(s.timestamp.endsWith('Z') ? s.timestamp : s.timestamp + 'Z');
                const end = new Date(s.responded_at.endsWith('Z') ? s.responded_at : s.responded_at + 'Z');
                const diffMins = differenceInMinutes(end, start);
                
                if (diffMins >= 0) {
                    totalResponseTime += diffMins;
                    respondedCountWithTime++;
                    if (diffMins < minResponse) minResponse = diffMins;
                    if (diffMins > maxResponse) maxResponse = diffMins;
                }
            }
        });

        const avgResponseTime = respondedCountWithTime > 0 ? Math.round(totalResponseTime / respondedCountWithTime) : 0;
        
        let totalHops = 0;
        let totalTTL = 0;
        allSOS.forEach(s => {
            totalHops += s.hop_count || 0;
            totalTTL += s.ttl || 0;
        });

        return {
            total,
            active: total - responded.length,
            pending: pending.length,
            delivered: delivered.length,
            responded: responded.length,
            responseRate: total > 0 ? Math.round((responded.length / total) * 100) : 0,
            avgResponseTime,
            minResponse: minResponse === Infinity ? 0 : minResponse,
            maxResponse,
            totalNodes: new Set(allSOS.map(s => s.device_id)).size,
            avgHops: total > 0 ? (totalHops / total).toFixed(1) : 0,
            avgTTL: total > 0 ? (totalTTL / total).toFixed(1) : 0
        };
    }, [allSOS]);

    const activityData = useMemo(() => {
        const groups = {};
        allSOS.forEach(s => {
            const dateObj = new Date(s.timestamp.endsWith('Z') ? s.timestamp : s.timestamp + 'Z');
            // If 24h filter, group by hour. Else group by day.
            const formatStr = dateFilter <= 24 ? 'MMM dd, HH:00' : 'MMM dd';
            const key = format(dateObj, formatStr);
            if (!groups[key]) groups[key] = { name: key, count: 0 };
            groups[key].count++;
        });
        
        return Object.values(groups).sort((a, b) => new Date(a.name) - new Date(b.name));
    }, [allSOS, dateFilter]);

    const typeData = useMemo(() => {
        const counts = {};
        allSOS.forEach(s => {
            counts[s.emergency_type] = (counts[s.emergency_type] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({
            name: key,
            value: counts[key],
            color: EMERGENCY_CONFIG[key]?.color || '#8884d8'
        })).sort((a, b) => b.value - a.value);
    }, [allSOS]);

    const statusData = useMemo(() => {
        if (!stats) return [];
        return [
            { name: 'Pending', value: stats.pending, color: '#F5B301' },
            { name: 'Delivered', value: stats.delivered, color: '#22C55E' },
            { name: 'Responded', value: stats.responded, color: '#06B6D4' }
        ].filter(d => d.value > 0);
    }, [stats]);

    const recentSOS = useMemo(() => {
        return [...allSOS].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    }, [allSOS]);

    const formatMins = (mins) => {
        if (mins === 0) return 'N/A';
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1>SOS Analytics</h1>
                    <p className="text-secondary">System performance and emergency metrics</p>
                </div>
                <div className="header-actions">
                    <div className="custom-select-wrapper">
                        <Calendar size={16} className="select-icon" />
                        <select 
                            value={dateFilter} 
                            onChange={(e) => setDateFilter(Number(e.target.value))}
                            className="date-filter-select"
                        >
                            <option value={24}>Last 24 Hours</option>
                            <option value={168}>Last 7 Days</option>
                            <option value={720}>Last 30 Days</option>
                        </select>
                        <ChevronDown size={16} className="select-arrow" />
                    </div>
                </div>
            </div>

            {loading && allSOS.length === 0 ? (
                <div className="analytics-loading">
                    <div className="spinner"></div>
                    <p>Crunching metrics...</p>
                </div>
            ) : allSOS.length === 0 ? (
                <div className="empty-state card">
                    <BarChart2 size={48} color="var(--text-muted)" />
                    <h3>No SOS data available</h3>
                    <p className="text-secondary">There are no SOS signals in the selected time period.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <StatusCard
                            icon={AlertCircle}
                            label="Total SOS"
                            value={stats.total}
                            color="var(--text-primary)"
                            subtext="In selected period"
                        />
                        <StatusCard
                            icon={Activity}
                            label="Active / Pending"
                            value={`${stats.active} / ${stats.pending}`}
                            color="var(--status-emergency)"
                            subtext="Requires attention"
                        />
                        <StatusCard
                            icon={ShieldCheck}
                            label="Response Rate"
                            value={`${stats.responseRate}%`}
                            color="var(--status-responded)"
                            subtext={`${stats.responded} responded`}
                        />
                        <StatusCard
                            icon={Clock}
                            label="Avg Response"
                            value={formatMins(stats.avgResponseTime)}
                            color="var(--status-info)"
                            subtext={`Fastest: ${formatMins(stats.minResponse)}`}
                        />
                    </div>

                    <div className="analytics-grid">
                        {/* Activity Chart */}
                        <div className="card chart-card full-width">
                            <div className="card-header">
                                <h2>SOS Activity</h2>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3143" vertical={false} />
                                        <XAxis dataKey="name" stroke="#8B93A7" tick={{ fill: '#8B93A7', fontSize: 12 }} />
                                        <YAxis stroke="#8B93A7" tick={{ fill: '#8B93A7', fontSize: 12 }} allowDecimals={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#121826', borderColor: '#2A3143', borderRadius: '8px', color: '#FFF' }}
                                            itemStyle={{ color: '#E5091A' }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="#E5091A" strokeWidth={3} dot={{ r: 4, fill: '#E5091A' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distributions */}
                        <div className="card chart-card half-width">
                            <div className="card-header">
                                <h2>Emergency Types</h2>
                            </div>
                            <div className="chart-container flex-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={typeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {typeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#121826', borderColor: '#2A3143', borderRadius: '8px', color: '#FFF' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="card chart-card half-width">
                            <div className="card-header">
                                <h2>Status Breakdown</h2>
                            </div>
                            <div className="chart-container flex-center">
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={statusData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2A3143" horizontal={false} />
                                        <XAxis type="number" stroke="#8B93A7" allowDecimals={false} />
                                        <YAxis dataKey="name" type="category" stroke="#8B93A7" width={80} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#121826', borderColor: '#2A3143', borderRadius: '8px' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Network Performance */}
                        <div className="card list-card half-width">
                            <div className="card-header">
                                <h2>Mesh Network Performance</h2>
                            </div>
                            <div className="card-body padding-none">
                                <div className="perf-row">
                                    <div className="perf-icon"><Globe size={20} /></div>
                                    <div className="perf-info">
                                        <div className="perf-label">Total Unique Nodes</div>
                                        <div className="perf-val">{stats.totalNodes}</div>
                                    </div>
                                </div>
                                <div className="perf-row">
                                    <div className="perf-icon"><Signal size={20} /></div>
                                    <div className="perf-info">
                                        <div className="perf-label">Average Hops</div>
                                        <div className="perf-val">{stats.avgHops} hops</div>
                                    </div>
                                </div>
                                <div className="perf-row">
                                    <div className="perf-icon"><Activity size={20} /></div>
                                    <div className="perf-info">
                                        <div className="perf-label">Average TTL</div>
                                        <div className="perf-val">{stats.avgTTL}</div>
                                    </div>
                                </div>
                                <div className="perf-row">
                                    <div className="perf-icon"><ShieldCheck size={20} /></div>
                                    <div className="perf-info">
                                        <div className="perf-label">Delivery Success</div>
                                        <div className="perf-val">
                                            {stats.total > 0 ? Math.round(((stats.delivered + stats.responded) / stats.total) * 100) : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent SOS Activity */}
                        <div className="card list-card half-width">
                            <div className="card-header">
                                <h2>Recent SOS Activity</h2>
                            </div>
                            <div className="card-body padding-none">
                                {recentSOS.map(sos => {
                                    const eConfig = EMERGENCY_CONFIG[sos.emergency_type] || EMERGENCY_CONFIG.GENERAL;
                                    const Icon = eConfig.icon;
                                    const isPending = sos.status === 'PENDING' || sos.status === 'RELAYED';
                                    const utcTime = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';

                                    return (
                                        <div key={sos.sos_id} className="recent-sos-row">
                                            <div className="rs-icon" style={{ backgroundColor: `${eConfig.color}20`, color: eConfig.color }}>
                                                <Icon size={16} />
                                            </div>
                                            <div className="rs-content">
                                                <div className="rs-title">
                                                    <span style={{ color: eConfig.color }}>{sos.emergency_type}</span>
                                                    <span className="rs-time">{formatDistanceToNow(new Date(utcTime), { addSuffix: true })}</span>
                                                </div>
                                                <div className="rs-meta">
                                                    <MapPin size={12} /> {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}
                                                </div>
                                            </div>
                                            <div className="rs-status">
                                                <span className={`badge badge-${isPending ? 'pending' : sos.status.toLowerCase()}`}>
                                                    {isPending ? 'PENDING' : sos.status}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Map */}
                        <div className="card chart-card full-width map-container-analytics">
                            <div className="card-header">
                                <h2>SOS Hotspot Map</h2>
                                <span className="text-sm text-secondary">Historical locations in selected period</span>
                            </div>
                            <div className="analytics-map-inner">
                                <Map activeSOS={allSOS} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
