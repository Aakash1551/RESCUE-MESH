import './StatusCard.css';

export default function StatusCard({ icon: Icon, label, value, subtext, color }) {
    // Generate a background tint based on the color string
    // Assumes color is a hex or var, but we'll use a CSS class hack or inline style
    return (
        <div className="status-card">
            <div className="status-card-inner">
                <div className="status-icon" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color: color }}>
                    <Icon size={24} />
                </div>
                <div className="status-content">
                    <div className="status-label">{label}</div>
                    <div className="status-value font-mono">{value}</div>
                    <div className="status-subtext">{subtext}</div>
                </div>
            </div>
        </div>
    );
}
