import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Battery, Signal, NavigationOff, ExternalLink, Crosshair, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './Map.css';

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function MapUpdater({ activeSOS, autoFit }) {
    const map = useMap();
    useEffect(() => {
        if (!autoFit) return;
        // activeSOS already contains valid _coords property
        if (activeSOS && activeSOS.length > 0) {
            const bounds = L.latLngBounds(activeSOS.map(sos => [sos._coords.lat, sos._coords.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
    }, [activeSOS, map, autoFit]);
    return null;
}

function CustomControls() {
    const map = useMap();
    
    const handleZoomIn = () => map.zoomIn();
    const handleZoomOut = () => map.zoomOut();
    const handleLocate = () => {
        map.locate().on('locationfound', (e) => {
            map.flyTo(e.latlng, 14);
        });
    };

    return (
        <div className="custom-map-controls">
            <button className="map-btn" onClick={handleLocate} title="Locate Me">
                <Crosshair size={18} />
            </button>
            <div className="map-btn-group">
                <button className="map-btn" onClick={handleZoomIn} title="Zoom In"><Plus size={18} /></button>
                <button className="map-btn" onClick={handleZoomOut} title="Zoom Out"><Minus size={18} /></button>
            </div>
        </div>
    );
}

const getMarkerColor = (status) => {
    if (status === 'RESPONDED') return 'var(--status-responded)';
    if (status === 'PENDING' || status === 'RELAYED') return 'var(--status-pending)';
    return 'var(--status-emergency)';
};

const createPulsingMarker = (sos) => {
    const color = getMarkerColor(sos.status);
    return L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
            <div class="pulse-ring" style="background-color: ${color}40; border-color: ${color}"></div>
            <div class="pulse-dot" style="background-color: ${color}">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const getCoordinates = (sos) => {
    let lat = null;
    let lng = null;

    if (sos.latitude !== undefined && sos.longitude !== undefined) {
        lat = Number(sos.latitude);
        lng = Number(sos.longitude);
    } else if (sos.lat !== undefined && sos.lng !== undefined) {
        lat = Number(sos.lat);
        lng = Number(sos.lng);
    } else if (sos.location) {
        if (sos.location.latitude !== undefined && sos.location.longitude !== undefined) {
            lat = Number(sos.location.latitude);
            lng = Number(sos.location.longitude);
        } else if (sos.location.lat !== undefined && sos.location.lng !== undefined) {
            lat = Number(sos.location.lat);
            lng = Number(sos.location.lng);
        }
    } else if (sos.coordinates && Array.isArray(sos.coordinates)) {
        lat = Number(sos.coordinates[0]);
        lng = Number(sos.coordinates[1]);
    }
    
    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            return { lat, lng };
        }
    }
    
    return null;
};

export default function Map({ activeSOS = [] }) {
    const [layerType, setLayerType] = useState(() => {
        const saved = localStorage.getItem('mesh_map_prefs');
        if (saved) {
            const prefs = JSON.parse(saved);
            if (prefs.defaultType) return prefs.defaultType.toLowerCase();
        }
        return 'map';
    });
    const [mapPrefs, setMapPrefs] = useState(() => {
        const saved = localStorage.getItem('mesh_map_prefs');
        if (saved) {
            const prefs = JSON.parse(saved);
            return {
                zoom: prefs.zoom || 5,
                autoCenter: prefs.autoCenter !== false
            };
        }
        return { zoom: 5, autoCenter: true };
    });
    
    const defaultCenter = [20.5937, 78.9629];
    
    const processedSOS = activeSOS.map(sos => ({
        ...sos,
        _coords: getCoordinates(sos)
    }));

    const validSOS = processedSOS.filter(sos => sos._coords !== null);
    const invalidCount = processedSOS.length - validSOS.length;

    const tileUrl = layerType === 'map' 
        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

    return (
        <div className="map-wrapper">
            {invalidCount > 0 && (
                <div className="map-warning-overlay">
                    <NavigationOff size={16} />
                    <span>{invalidCount} SOS signal(s) with no valid location data</span>
                </div>
            )}
            
            <div className="map-layer-toggle">
                <button 
                    className={`toggle-btn ${layerType === 'map' ? 'active' : ''}`}
                    onClick={() => setLayerType('map')}
                >
                    Map
                </button>
                <button 
                    className={`toggle-btn ${layerType === 'satellite' ? 'active' : ''}`}
                    onClick={() => setLayerType('satellite')}
                >
                    Satellite
                </button>
            </div>

            <div className="map-legend">
                <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--status-emergency)' }}></div>
                    <span>Active SOS</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--status-pending)' }}></div>
                    <span>Pending</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ backgroundColor: 'var(--status-responded)' }}></div>
                    <span>Responded</span>
                </div>
            </div>

            <MapContainer
                center={defaultCenter}
                zoom={mapPrefs.zoom}
                className="leaflet-map"
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <MapResizer />
                <TileLayer 
                    url={tileUrl} 
                    attribution={layerType === 'map' ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : ''}
                />
                <CustomControls />
                <MapUpdater activeSOS={validSOS} autoFit={mapPrefs.autoCenter} />

                {validSOS.map((sos) => {
                    const utcTimestamp = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';
                    return (
                        <Marker
                            key={sos.sos_id}
                            position={[sos._coords.lat, sos._coords.lng]}
                            icon={createPulsingMarker(sos)}
                        >
                            <Popup className="ops-popup">
                                <div className="ops-popup-content">
                                    <div className="ops-popup-header">
                                        <span className="font-mono text-sm" style={{ color: getMarkerColor(sos.status), fontWeight: 600 }}>
                                            {sos.emergency_type}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {formatDistanceToNow(new Date(utcTimestamp), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="ops-popup-body">
                                        <div className="font-mono text-xs text-secondary mb-2">
                                            {sos._coords.lat.toFixed(5)}, {sos._coords.lng.toFixed(5)}
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="badge-mini"><Signal size={12}/> {sos.hop_count}</span>
                                            {sos.battery_percentage !== undefined && (
                                                <span className="badge-mini"><Battery size={12}/> {sos.battery_percentage}%</span>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/sos/${sos.sos_id}`} className="ops-popup-link">
                                        View Details <ExternalLink size={14} />
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    );
}
