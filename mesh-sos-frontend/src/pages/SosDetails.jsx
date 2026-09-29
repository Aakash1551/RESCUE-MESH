import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Activity, Flame, Droplets, Mountain, ShieldAlert, Clock, Signal, Battery, MessageSquare, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { sosAPI } from '../api/client';
import Map from '../components/Map';
import './SosDetails.css';

const EMERGENCY_CONFIG = {
    MEDICAL: { icon: Activity, color: '#06B6D4' },
    FIRE: { icon: Flame, color: '#F97316' },
    FLOOD: { icon: Droplets, color: '#3B82F6' },
    EARTHQUAKE: { icon: Mountain, color: '#8B5CF6' },
    GENERAL: { icon: ShieldAlert, color: '#E5091A' },
};

export default function SosDetails() {
    const { id } = useParams();
    const [sos, setSos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetails = async () => {
        try {
            const data = await sosAPI.getById(id);
            setSos(data);
        } catch (err) {
            toast.error('Failed to load SOS details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        const interval = setInterval(fetchDetails, 10000);
        return () => clearInterval(interval);
    }, [id]);

    const handleMarkResponded = async () => {
        setActionLoading(true);
        try {
            await sosAPI.updateStatus(id);
            toast.success('SOS marked as responded');
            fetchDetails();
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !sos) {
        return <div className="details-loading">Loading details...</div>;
    }

    if (!sos) {
        return (
            <div className="details-error">
                <h2>SOS not found</h2>
                <Link to="/sos-list" className="btn-link">Return to list</Link>
            </div>
        );
    }

    const eConfig = EMERGENCY_CONFIG[sos.emergency_type] || EMERGENCY_CONFIG.GENERAL;
    const Icon = eConfig.icon;
    const isPending = sos.status === 'PENDING' || sos.status === 'RELAYED';
    const utcTime = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';
    const dateObj = new Date(utcTime);

    return (
        <div className="sos-details-page">
            <Link to="/sos-list" className="back-link">
                <ArrowLeft size={16} /> Back to SOS List
            </Link>

            <div className="details-header-row">
                <div>
                    <h1>SOS Details</h1>
                    <p className="text-secondary">Detailed information about this emergency signal</p>
                </div>
                <div className="header-status">
                    <span className={`badge badge-${isPending ? 'pending' : sos.status.toLowerCase()} badge-lg`}>
                        {isPending ? 'PENDING' : sos.status}
                    </span>
                    {isPending && (
                        <button 
                            className="btn-mark-responded" 
                            onClick={handleMarkResponded}
                            disabled={actionLoading}
                        >
                            {actionLoading ? 'Updating...' : 'Mark Responded'}
                        </button>
                    )}
                </div>
            </div>

            <div className="details-grid">
                {/* Basic Info Card */}
                <div className="card info-card">
                    <div className="card-header">
                        <h2>Basic Information</h2>
                    </div>
                    <div className="info-list">
                        <div className="info-row">
                            <div className="info-label">
                                <Icon size={16} /> Emergency Type
                            </div>
                            <div className="info-value font-semibold" style={{ color: eConfig.color }}>
                                {sos.emergency_type}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <ShieldCheck size={16} /> Status
                            </div>
                            <div className="info-value">
                                <span className={`badge badge-${isPending ? 'pending' : sos.status.toLowerCase()}`}>
                                    {isPending ? 'PENDING' : sos.status}
                                </span>
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <MapPin size={16} /> Latitude
                            </div>
                            <div className="info-value font-mono">
                                {sos.latitude.toFixed(6)}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <MapPin size={16} /> Longitude
                            </div>
                            <div className="info-value font-mono">
                                {sos.longitude.toFixed(6)}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <Clock size={16} /> Date & Time
                            </div>
                            <div className="info-value">
                                {format(dateObj, 'MMM d, yyyy HH:mm:ss')}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <Signal size={16} /> Hops
                            </div>
                            <div className="info-value font-mono">
                                {sos.hop_count}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <Signal size={16} /> TTL
                            </div>
                            <div className="info-value font-mono">
                                {sos.ttl}
                            </div>
                        </div>

                        <div className="info-row">
                            <div className="info-label">
                                <Battery size={16} /> Battery
                            </div>
                            <div className="info-value font-mono">
                                {sos.battery_percentage !== undefined ? `${sos.battery_percentage}%` : 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="message-section">
                        <div className="info-label mb-2">
                            <MessageSquare size={16} /> Optional Message
                        </div>
                        <div className={`message-box ${!sos.optional_message ? 'empty' : ''}`}>
                            {sos.optional_message ? sos.optional_message : 'No additional message provided.'}
                        </div>
                    </div>
                </div>

                {/* Map Card */}
                <div className="card map-card">
                    <div className="card-header">
                        <h2>Map Location</h2>
                    </div>
                    <div className="details-map-container">
                        <Map activeSOS={[sos]} />
                    </div>
                </div>
            </div>
        </div>
    );
}
