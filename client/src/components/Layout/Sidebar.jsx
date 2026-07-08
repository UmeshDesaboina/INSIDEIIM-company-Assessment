import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBarChart2, FiRepeat, FiBriefcase, FiStar, FiClock, FiBookmark, FiMessageSquare, FiUser } from 'react-icons/fi';

const sidebarLinks = [
  { path: '/app', icon: <FiHome />, label: 'Dashboard' },
  { path: '/app/compare', icon: <FiRepeat />, label: 'Compare' },
  { path: '/app/portfolio', icon: <FiBriefcase />, label: 'Portfolio' },
  { path: '/app/chat', icon: <FiMessageSquare />, label: 'AI Chat' },
  { path: '/app/favorites', icon: <FiStar />, label: 'Favorites' },
  { path: '/app/saved', icon: <FiBookmark />, label: 'Saved Reports' },
  { path: '/app/history', icon: <FiClock />, label: 'History' },
  { path: '/app/profile', icon: <FiUser />, label: 'Profile' },
];

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-links">
        {sidebarLinks.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/app'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{link.icon}</span>
            <span className="sidebar-label">{link.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="sidebar-upgrade">
          <span className="upgrade-icon">✦</span>
          <div className="upgrade-text">
            <strong>AI Pro</strong>
            <small>Unlimited Reports</small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
