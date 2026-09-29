import { useState, useRef, useEffect } from 'react';
import { MapPin, MessageSquare, Battery, Activity, Flame, Droplets, Mountain, ShieldAlert, Navigation, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { sosAPI } from '../api/client';
import './CreateSos.css';

const EMERGENCY_TYPES = [
    { id: 'GENERAL', label: 'General Emergency', icon: ShieldAlert, color: '#E5091A' },
    { id: 'MEDICAL', label: 'Medical Emergency', icon: Activity, color: '#06B6D4' },
    { id: 'FIRE', label: 'Fire', icon: Flame, color: '#F97316' },
    { id: 'FLOOD', label: 'Flood', icon: Droplets, color: '#3B82F6' },
    { id: 'EARTHQUAKE', label: 'Earthquake', icon: Mountain, color: '#8B5CF6' },
];

export default function CreateSos() {
    const [formData, setFormData] = useState({
        emergency_type: 'GENERAL',
        latitude: '',
        longitude: '',
        battery_percentage: 100,
        optional_message: '',
    });
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const dropdownRef = useRef(null);
    const MAX_CHARS = 500;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedType = EMERGENCY_TYPES.find(t => t.id === formData.emergency_type);
    const SelectedIcon = selectedType.icon;

    const handleUseMyLocation = () => {
        if ('geolocation' in navigator) {
            toast.info('Acquiring coordinates...');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({ 
                        ...prev, 
                        latitude: pos.coords.latitude.toFixed(6), 
                        longitude: pos.coords.longitude.toFixed(6) 
                    }));
                    toast.success('Location updated');
                },
                (err) => {
                    toast.error('Location access denied');
                }
            );
        } else {
            toast.error('Geolocation not supported');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.latitude || !formData.longitude) {
            toast.error('Please provide latitude and longitude');
            return;
        }

        setLoading(true);

        try {
            await sosAPI.create({
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude)
            });
            toast.success('SOS signal created successfully');
            setFormData({
                emergency_type: 'GENERAL',
                latitude: '',
                longitude: '',
                battery_percentage: 100,
                optional_message: '',
            });
        } catch (err) {
            toast.error('Failed to create SOS. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-sos-page">
            <div className="page-header center">
                <h1>Create Manual SOS</h1>
                <p className="text-secondary">Testing & administrative SOS creation</p>
            </div>

            <div className="form-card-container">
                <form onSubmit={handleSubmit} className="card create-form">
                    
                    {/* Emergency Type Custom Select */}
                    <div className="form-field" ref={dropdownRef}>
                        <label>Emergency Type</label>
                        <div 
                            className="custom-select"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            tabIndex={0}
                        >
                            <div className="select-value">
                                <SelectedIcon size={18} color={selectedType.color} />
                                <span>{selectedType.label}</span>
                            </div>
                            <ChevronDown size={18} className="text-muted" />
                        </div>
                        {isDropdownOpen && (
                            <div className="select-dropdown">
                                {EMERGENCY_TYPES.map(type => {
                                    const Icon = type.icon;
                                    return (
                                        <div 
                                            key={type.id} 
                                            className="select-option"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, emergency_type: type.id }));
                                                setIsDropdownOpen(false);
                                            }}
                                        >
                                            <Icon size={18} color={type.color} />
                                            <span>{type.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Coordinates */}
                    <div className="form-row">
                        <div className="form-field">
                            <label>Latitude</label>
                            <div className="input-with-icon">
                                <MapPin size={18} className="input-icon" />
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="0.000000"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-field">
                            <label className="space-between">
                                Longitude
                                <button type="button" className="btn-link" onClick={handleUseMyLocation}>
                                    <Navigation size={12} /> Use location
                                </button>
                            </label>
                            <div className="input-with-icon">
                                <MapPin size={18} className="input-icon" />
                                <input
                                    type="number"
                                    step="0.000001"
                                    placeholder="0.000000"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Battery */}
                    <div className="form-field">
                        <label>Battery Percentage</label>
                        <div className="input-with-icon right-suffix">
                            <Battery size={18} className="input-icon" />
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.battery_percentage}
                                onChange={(e) => setFormData(prev => ({ ...prev, battery_percentage: parseInt(e.target.value) || 0 }))}
                                required
                            />
                            <span className="input-suffix">%</span>
                        </div>
                    </div>

                    {/* Message */}
                    <div className="form-field">
                        <label>Optional Message</label>
                        <div className="input-with-icon align-top">
                            <MessageSquare size={18} className="input-icon" style={{ marginTop: '12px' }} />
                            <textarea
                                rows="4"
                                maxLength={MAX_CHARS}
                                placeholder="Describe the situation..."
                                value={formData.optional_message}
                                onChange={(e) => setFormData(prev => ({ ...prev, optional_message: e.target.value }))}
                            ></textarea>
                            <div className="char-counter">
                                {formData.optional_message.length}/{MAX_CHARS}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-submit-sos" disabled={loading}>
                        {loading ? <span className="spinner"></span> : (
                            <>
                                <Send size={20} />
                                Create SOS
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
