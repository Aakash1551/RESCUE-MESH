import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, List, PlusCircle, BarChart2, Settings, Menu, Bell, User, LogOut, ShieldAlert, Activity, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sosAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // Relies on App.css styles

export function Sidebar({ mobileOpen, setMobileOpen }) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const navItems = [
        ...(isAdmin ? [{ path: '/', icon: LayoutDashboard, label: 'Dashboard' }] : [{ path: '/', icon: LayoutDashboard, label: 'My SOS' }]),
        ...(isAdmin ? [{ path: '/sos-list', icon: List, label: 'All SOS' }] : []),
        { path: '/create', icon: PlusCircle, label: 'Create SOS' },
        ...(isAdmin ? [{ path: '/analytics', icon: BarChart2, label: 'Analytics' }] : []),
        ...(isAdmin ? [{ path: '/settings', icon: Settings, label: 'Settings' }] : [])
    ];

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <span className="logo-mesh">Mesh</span>
                    <span className="logo-sos">SOS</span>
                </div>
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}

export function TopBar({ setMobileOpen }) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    
    const notifRef = useRef(null);
    const avatarRef = useRef(null);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const data = isAdmin ? await sosAPI.getAll(24, 50) : await sosAPI.getMySos();
            const notifs = data.map(sos => {
                const isPending = sos.status === 'PENDING' || sos.status === 'RELAYED';
                let icon = ShieldAlert;
                let color = '#E5091A';
                let title = 'New SOS signal';
                let desc = `${sos.emergency_type} emergency received`;

                if (sos.status === 'DELIVERED') {
                    icon = CheckCircle2;
                    color = '#22C55E';
                    title = 'SOS Delivered';
                    desc = `SOS #${sos.sos_id.substring(0, 6)} delivered`;
                } else if (sos.status === 'RESPONDED') {
                    icon = Activity;
                    color = '#06B6D4';
                    title = 'SOS Responded';
                    desc = `Emergency was responded to`;
                }

                // If no coords and pending
                if (isPending && (!sos.latitude || !sos.longitude || (sos.latitude === 0 && sos.longitude === 0))) {
                    icon = Clock;
                    color = '#F5B301';
                    title = 'SOS requires attention';
                    desc = 'Location unavailable';
                }
                
                const timeStr = sos.timestamp.endsWith('Z') ? sos.timestamp : sos.timestamp + 'Z';

                return {
                    id: sos.sos_id,
                    type: sos.status,
                    icon,
                    color,
                    title,
                    desc,
                    time: new Date(timeStr),
                    read: false
                };
            }).sort((a, b) => b.time - a.time).slice(0, 5);
            
            setNotifications(prev => {
                // simple merge to keep read state if existing
                return notifs.map(n => {
                    const existing = prev.find(p => p.id === n.id);
                    return existing ? { ...n, read: existing.read } : n;
                });
            });
        } catch (e) {
            console.error('Error fetching notifications:', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
            if (avatarRef.current && !avatarRef.current.contains(e.target)) setIsAvatarOpen(false);
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsNotifOpen(false);
                setIsAvatarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const toggleNotif = (e) => {
        e.stopPropagation();
        setIsNotifOpen(!isNotifOpen);
        setIsAvatarOpen(false);
    };

    const toggleAvatar = (e) => {
        e.stopPropagation();
        setIsAvatarOpen(!isAvatarOpen);
        setIsNotifOpen(false);
    };

    const handleNotifClick = (id) => {
        setIsNotifOpen(false);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        navigate(`/sos/${id}`);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllRead = (e) => {
        e.stopPropagation();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <header className="top-bar">
            <button className="btn-icon mobile-menu-btn" onClick={() => setMobileOpen(prev => !prev)} aria-label="Toggle menu">
                <Menu size={20} />
            </button>
            <div style={{ flex: 1 }} className="mobile-menu-spacer"></div>
            
            {/* Notification Button */}
            <div className="header-dropdown-container" ref={notifRef}>
                <button 
                    className={`btn-icon ${isNotifOpen ? 'active' : ''}`} 
                    onClick={toggleNotif}
                    aria-label="Notifications"
                    aria-expanded={isNotifOpen}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                
                {isNotifOpen && (
                    <div className="header-dropdown notif-dropdown fade-in">
                        <div className="dropdown-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button className="btn-text-small" onClick={handleMarkAllRead}>Mark all read</button>
                            )}
                        </div>
                        <div className="dropdown-body">
                            {notifications.length === 0 ? (
                                <div className="dropdown-empty">You're all caught up</div>
                            ) : (
                                notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`notif-item ${n.read ? 'read' : ''}`}
                                        onClick={() => handleNotifClick(n.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleNotifClick(n.id)}
                                    >
                                        <div className="notif-icon" style={{ color: n.color, backgroundColor: `${n.color}20` }}>
                                            <n.icon size={16} />
                                        </div>
                                        <div className="notif-content">
                                            <h4>{n.title}</h4>
                                            <p>{n.desc}</p>
                                            <span className="notif-time">{formatDistanceToNow(n.time, { addSuffix: true })}</span>
                                        </div>
                                        {!n.read && <div className="notif-unread-dot"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar Button */}
            <div className="header-dropdown-container" ref={avatarRef}>
                <button 
                    className={`avatar-btn ${isAvatarOpen ? 'active' : ''}`} 
                    onClick={toggleAvatar}
                    aria-label="User Profile"
                    aria-expanded={isAvatarOpen}
                >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>
                
                {isAvatarOpen && (
                    <div className="header-dropdown avatar-dropdown fade-in">
                        <div className="dropdown-user-info">
                            <div className="avatar-lg">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                            <div className="user-details">
                                <div className="user-name">{user?.name || 'User'}</div>
                                <div className="user-role">{user?.role || 'USER'}</div>
                            </div>
                        </div>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-menu">
                            <button type="button" className="dropdown-menu-item" onClick={() => { setIsAvatarOpen(false); navigate('/settings'); }}>
                                <User size={16} /> Profile
                            </button>
                            <button type="button" className="dropdown-menu-item" onClick={() => { setIsAvatarOpen(false); navigate('/settings'); }}>
                                <Settings size={16} /> Settings
                            </button>
                            <button type="button" className="dropdown-menu-item" onClick={() => { setIsAvatarOpen(false); navigate('/settings'); }}>
                                <Bell size={16} /> Notification Settings
                            </button>
                            <div className="dropdown-divider"></div>
                            <button type="button" className="dropdown-menu-item text-danger" onClick={() => { setIsAvatarOpen(false); logout(); navigate('/login'); }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
