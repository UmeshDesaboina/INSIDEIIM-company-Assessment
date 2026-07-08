import React from 'react';

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div className="stat-card" style={{ '--card-accent': color || 'var(--primary)' }}>
      <div className="stat-card-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

export default StatCard;
