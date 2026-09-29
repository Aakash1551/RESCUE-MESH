import { Link, useLocation } from 'react-router-dom';
import { Activity, List, PlusCircle, Radar } from 'lucide-react';
import './Header.css';

export default function Header({ stats }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const activeCount = stats?.activeSOS || 0;
    const totalCount = stats?.totalSOS || 0;

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <Link to="/" className="logo">
                        <Radar className="logo-icon animate-pulse-red" size={24} />
                        <span className="logo-text">Mesh<span className="logo-accent">SOS</span></span>
                    </Link>

                    <nav className="nav">
                        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                            <Activity size={18} />
                            <span>Dashboard</span>
                            {isActive('/') && <span className="nav-indicator"></span>}
                        </Link>

                        <Link to="/sos-list" className={`nav-link ${isActive('/sos-list') ? 'active' : ''}`}>
                            <List size={18} />
                            <span>SOS List</span>
                            {isActive('/sos-list') && <span className="nav-indicator"></span>}
                        </Link>

                        <Link to="/create" className={`nav-link ${isActive('/create') ? 'active' : ''}`}>
                            <PlusCircle size={18} />
                            <span>Create SOS</span>
                            {isActive('/create') && <span className="nav-indicator"></span>}
                        </Link>
                    </nav>
                </div>

                <div className="header-right">
                    <div className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="live-text font-mono text-xs">Live</span>
                    </div>

                    <div className="header-stats">
                        <div className={`stat-badge ${activeCount > 0 ? 'stat-badge-danger animate-pulse-red' : 'stat-badge-normal'}`}>
                            <span className="stat-label">Active</span>
                            <span className="stat-value font-mono">{activeCount}</span>
                        </div>
                        <div className="stat-badge stat-badge-normal">
                            <span className="stat-label">Total</span>
                            <span className="stat-value font-mono">{totalCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
