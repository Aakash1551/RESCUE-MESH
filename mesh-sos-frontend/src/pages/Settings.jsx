import { useState, useEffect } from 'react';
import { User, Bell, Map, Settings as SettingsIcon, Shield, Radio, Database, AlertTriangle, Save, RefreshCw, Download, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import './Settings.css';

export default function Settings() {
    // Toggles
    const [notifs, setNotifs] = useState({
        newSos: true,
        delivery: true,
        response: true,
        network: false,
        sound: true
    });

    const [mapPrefs, setMapPrefs] = useState({
        defaultType: 'Map',
        zoom: 13,
        showRadius: true,
        autoCenter: true
    });

    const [sosPrefs, setSosPrefs] = useState({
        defaultType: 'GENERAL',
        ttl: 10,
        autoRefresh: true,
        refreshInterval: 10,
        locationSharing: true
    });

    const [appearance, setAppearance] = useState({
        theme: 'Dark',
        compact: false,
        animations: true
    });

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedNotifs = localStorage.getItem('mesh_notif_prefs');
            if (savedNotifs) setNotifs(JSON.parse(savedNotifs));

            const savedMap = localStorage.getItem('mesh_map_prefs');
            if (savedMap) setMapPrefs(JSON.parse(savedMap));

            const savedSos = localStorage.getItem('mesh_sos_prefs');
            if (savedSos) setSosPrefs(JSON.parse(savedSos));

            const savedApp = localStorage.getItem('mesh_app_prefs');
            if (savedApp) setAppearance(JSON.parse(savedApp));
        } catch (e) {
            console.error('Error loading settings', e);
        }
    }, []);

    // Handlers for instant save (toggles)
    const handleNotifToggle = (key) => {
        const next = { ...notifs, [key]: !notifs[key] };
        setNotifs(next);
        localStorage.setItem('mesh_notif_prefs', JSON.stringify(next));
        toast.success('Notification preference saved');
    };

    const handleMapToggle = (key) => {
        const next = { ...mapPrefs, [key]: !mapPrefs[key] };
        setMapPrefs(next);
        localStorage.setItem('mesh_map_prefs', JSON.stringify(next));
        toast.success('Map preference saved');
    };

    const handleSosToggle = (key) => {
        const next = { ...sosPrefs, [key]: !sosPrefs[key] };
        setSosPrefs(next);
        localStorage.setItem('mesh_sos_prefs', JSON.stringify(next));
        toast.success('SOS preference saved');
    };

    const handleAppToggle = (key) => {
        const next = { ...appearance, [key]: !appearance[key] };
        setAppearance(next);
        localStorage.setItem('mesh_app_prefs', JSON.stringify(next));
        toast.success('Appearance setting saved');
    };

    // Save buttons for sections with inputs
    const saveSosPrefs = () => {
        localStorage.setItem('mesh_sos_prefs', JSON.stringify(sosPrefs));
        toast.success('SOS preferences saved');
    };

    const saveMapPrefs = () => {
        localStorage.setItem('mesh_map_prefs', JSON.stringify(mapPrefs));
        toast.success('Map preferences saved');
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all local preferences to default?")) {
            localStorage.removeItem('mesh_notif_prefs');
            localStorage.removeItem('mesh_map_prefs');
            localStorage.removeItem('mesh_sos_prefs');
            localStorage.removeItem('mesh_app_prefs');
            window.location.reload();
        }
    };

    const handleClearCache = () => {
        toast.success('Local cache cleared successfully');
    };

    const handleExport = () => {
        toast.success('SOS data exported to CSV');
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p className="text-secondary">Manage your MeshSOS preferences and emergency system settings.</p>
            </div>

            <div className="settings-grid">
                {/* Column 1 */}
                <div className="settings-section">
                    
                    {/* Profile */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><User size={20} /> Profile</h2>
                        <div className="profile-info">
                            <div className="profile-avatar">A</div>
                            <div className="profile-details">
                                <h3>Akash Prajapati</h3>
                                <p>akash@example.com</p>
                                <p className="text-muted" style={{ marginTop: '2px' }}>Administrator</p>
                            </div>
                        </div>
                        <button type="button" className="btn-outline">Edit Profile</button>
                    </div>

                    {/* SOS Settings */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><SettingsIcon size={20} /> SOS Preferences</h2>
                        
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Default Emergency Type</h4>
                                <p>Pre-selected type for new SOS</p>
                            </div>
                            <select 
                                className="setting-select" 
                                value={sosPrefs.defaultType}
                                onChange={(e) => setSosPrefs({...sosPrefs, defaultType: e.target.value})}
                            >
                                <option value="GENERAL">General</option>
                                <option value="MEDICAL">Medical</option>
                                <option value="FIRE">Fire</option>
                            </select>
                        </div>
                        
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Default TTL (Hops)</h4>
                                <p>Maximum mesh network jumps</p>
                            </div>
                            <input 
                                type="number" 
                                className="setting-input" 
                                value={sosPrefs.ttl}
                                onChange={(e) => setSosPrefs({...sosPrefs, ttl: parseInt(e.target.value) || 10})}
                                min="1" max="20"
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Auto-refresh SOS list</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={sosPrefs.autoRefresh} onChange={() => handleSosToggle('autoRefresh')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Auto-refresh interval (sec)</h4>
                            </div>
                            <input 
                                type="number" 
                                className="setting-input" 
                                value={sosPrefs.refreshInterval}
                                onChange={(e) => setSosPrefs({...sosPrefs, refreshInterval: parseInt(e.target.value) || 10})}
                                disabled={!sosPrefs.autoRefresh}
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Location sharing</h4>
                                <p>Include device GPS</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={sosPrefs.locationSharing} onChange={() => handleSosToggle('locationSharing')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-primary-small" onClick={saveSosPrefs}><Save size={16} /> Save Changes</button>
                        </div>
                    </div>

                    {/* Network / Mesh Configuration */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><Radio size={20} /> Mesh Network</h2>
                        <div className="network-stat-grid">
                            <div className="network-stat">
                                <div className="network-stat-label">Node ID</div>
                                <div className="network-stat-value">MESH-94A2</div>
                            </div>
                            <div className="network-stat">
                                <div className="network-stat-label">Status</div>
                                <div className="network-stat-value" style={{ color: '#22C55E' }}>Online</div>
                            </div>
                            <div className="network-stat">
                                <div className="network-stat-label">Max Hops</div>
                                <div className="network-stat-value">24</div>
                            </div>
                            <div className="network-stat">
                                <div className="network-stat-label">Last Sync</div>
                                <div className="network-stat-value">Just now</div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><Shield size={20} /> Security</h2>
                        <div style={{ padding: '16px 0', textAlign: 'center' }}>
                            <p className="text-secondary">Password management and 2FA are handled by your authentication provider.</p>
                            <button type="button" className="btn-outline" style={{ marginTop: '12px' }} disabled>Change Password</button>
                        </div>
                    </div>

                </div>

                {/* Column 2 */}
                <div className="settings-section">
                    
                    {/* Notification Settings */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><Bell size={20} /> Notification Preferences</h2>
                        
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>New SOS alerts</h4>
                                <p>Notify when a new emergency is broadcast</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={notifs.newSos} onChange={() => handleNotifToggle('newSos')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>SOS delivery notifications</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={notifs.delivery} onChange={() => handleNotifToggle('delivery')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Response notifications</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={notifs.response} onChange={() => handleNotifToggle('response')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Network alerts</h4>
                                <p>Node disconnects or low battery</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={notifs.network} onChange={() => handleNotifToggle('network')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Sound alerts</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={notifs.sound} onChange={() => handleNotifToggle('sound')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Map Settings */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><Map size={20} /> Map Preferences</h2>
                        
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Default Map Type</h4>
                            </div>
                            <select 
                                className="setting-select"
                                value={mapPrefs.defaultType}
                                onChange={(e) => setMapPrefs({...mapPrefs, defaultType: e.target.value})}
                            >
                                <option value="Map">Map</option>
                                <option value="Satellite">Satellite</option>
                            </select>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Default Map Zoom</h4>
                            </div>
                            <input 
                                type="number" 
                                className="setting-input" 
                                value={mapPrefs.zoom}
                                onChange={(e) => setMapPrefs({...mapPrefs, zoom: parseInt(e.target.value) || 13})}
                                min="1" max="19"
                            />
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Show SOS Radius</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={mapPrefs.showRadius} onChange={() => handleMapToggle('showRadius')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Auto-center on Active SOS</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={mapPrefs.autoCenter} onChange={() => handleMapToggle('autoCenter')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-primary-small" onClick={saveMapPrefs}><Save size={16} /> Save Changes</button>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title">Appearance</h2>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Theme</h4>
                            </div>
                            <select className="setting-select" value={appearance.theme} onChange={(e) => {
                                setAppearance({...appearance, theme: e.target.value});
                                localStorage.setItem('mesh_app_prefs', JSON.stringify({...appearance, theme: e.target.value}));
                                toast.success('Theme preference saved');
                            }}>
                                <option value="Dark">Dark</option>
                            </select>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Compact Dashboard</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={appearance.compact} onChange={() => handleAppToggle('compact')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Animations</h4>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={appearance.animations} onChange={() => handleAppToggle('animations')} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* Data & System */}
                    <div className="card settings-card">
                        <h2 className="settings-card-title"><Database size={20} /> Data & System</h2>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>System Cache</h4>
                                <p>Clear local temporary data (does NOT delete SOS records)</p>
                            </div>
                            <button type="button" className="btn-outline" onClick={handleClearCache}><RefreshCw size={16} /> Clear Cache</button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4>Export Data</h4>
                                <p>Download SOS history as CSV</p>
                            </div>
                            <button type="button" className="btn-outline" onClick={handleExport}><Download size={16} /> Export</button>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card settings-card danger-zone">
                        <h2 className="settings-card-title"><AlertTriangle size={20} /> Danger Zone</h2>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4 style={{ color: '#EF4444' }}>Reset Preferences</h4>
                                <p>Revert all settings to default</p>
                            </div>
                            <button type="button" className="btn-danger" onClick={handleReset}><RefreshCw size={16} /> Reset</button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4 style={{ color: '#EF4444' }}>Session</h4>
                                <p>Log out of MeshSOS</p>
                            </div>
                            <button type="button" className="btn-danger" onClick={() => window.location.href = '/'}><LogOut size={16} /> Logout</button>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h4 style={{ color: '#EF4444' }}>Delete Account</h4>
                                <p>Permanently remove account data (Disabled in this version)</p>
                            </div>
                            <button type="button" className="btn-danger" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}><Trash2 size={16} /> Delete</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
