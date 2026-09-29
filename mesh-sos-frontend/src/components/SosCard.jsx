import { useState } from 'react';
import { MapPin, Clock, Signal, Battery, Activity, Flame, Droplets, Mountain, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { sosAPI } from '../api/client';
import './SosCard.css';

const EMERGENCY_CONFIG = {
    MEDICAL: { icon: Activity, color: '#06B6D4' },
    FIRE: { icon: Flame, color: '#F97316' },
    FLOOD: { icon: Droplets, color: '#3B82F6' },
    EARTHQUAKE: { icon: Mountain, color: '#8B5CF6' },
    GENERAL: { icon: ShieldAlert, color: '#E5091A' },
};

const STATUS_COLORS = {
    PENDING: 'var(--status-pending)',
    RELAYED: 'var(--status-pending)',
    DELIVERED: 'var(--status-delivered)',
    RESPONDED: 'var(--status-responded)',
};

export default function SosCard({ sos, onUpdate }) {
    const [loading, setLoading] = useState(false);
    
    const config = EMERGENCY_CONFIG[sos.emergency_type] || EMERGENCY_CONFIG.GENERAL;
    const Icon = config.icon;
    const statusColor = STATUS_COLORS[sos.status] || 'var(--text-secondary)';

    const formatRelativeTime = (timestamp) => {
        try {
            const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
            return formatDistanceToNow(new Date(utcTimestamp), { addSuffix: true });
        } catch {
            return 'Unknown time';
        }
    };

    const handleMarkResponded = async () => {
        setLoading(true);
        try {
            await sosAPI.updateStatus(sos.sos_id);
            toast.success('Emergency marked as responded', {
                description: `SOS ID: ${sos.sos_id.substring(0, 8)}...`
            });
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error marking as responded:', error);
            toast.error('Failed to mark as responded');
        } finally {
            setLoading(false);
        }
    };

    const isPending = sos.status === 'PENDING' || sos.status === 'RELAYED';

    return (
        <div className={`sos-card ${isPending ? 'sos-card-pending' : ''}`} style={{ '--card-accent': statusColor }}>
            <div className="sos-card-inner">
                <div className="sos-card-header">
                    <div className="sos-type" style={{ color: config.color }}>
                        <Icon size={18} />
                        <span className="font-mono">{sos.emergency_type}</span>
                    </div>
                    <div className="sos-status-badge" style={{ color: statusColor, borderColor: `${statusColor}40`, backgroundColor: `${statusColor}10` }}>
                        <span className="status-dot" style={{ backgroundColor: statusColor }}></span>
                        {sos.status}
                    </div>
                </div>

                <div className="sos-card-body">
                    <div className="info-row" title="Location">
                        <MapPin size={16} />
                        <span className="font-mono text-sm">{sos.latitude.toFixed(5)}, {sos.longitude.toFixed(5)}</span>
                    </div>

                    <div className="info-row" title={new Date(sos.timestamp).toLocaleString()}>
                        <Clock size={16} />
                        <span className="text-sm">{formatRelativeTime(sos.timestamp)}</span>
                    </div>
                    
                    <div className="metrics-row">
                        <div className="metric-chip" title="Mesh Hops / TTL">
                            <Signal size={14} />
                            <span className="font-mono text-xs">{sos.hop_count} hops · TTL {sos.ttl}</span>
                        </div>
                        {sos.battery_percentage !== undefined && sos.battery_percentage !== null && (
                            <div className="metric-chip" title="Battery Level">
                                <Battery size={14} color={sos.battery_percentage <= 20 ? 'var(--status-emergency)' : 'currentColor'} />
                                <span className="font-mono text-xs">{sos.battery_percentage}%</span>
                            </div>
                        )}
                    </div>

                    {sos.optional_message && (
                        <div className="sos-message">
                            <p className="text-sm">"{sos.optional_message}"</p>
                        </div>
                    )}
                </div>

                {sos.status !== 'RESPONDED' && (
                    <div className="sos-card-footer">
                        <button
                            className="btn-mark-responded"
                            onClick={handleMarkResponded}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Mark Responded'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
