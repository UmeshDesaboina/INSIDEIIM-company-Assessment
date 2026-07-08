import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FiSun, FiMoon, FiLogOut, FiUser, FiBell } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/app" className="navbar-logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">InvestMind</span>
        </Link>
      </div>
      <div className="navbar-search">
        <span className="search-trigger" onClick={() => navigate('/app')}>
          🔍 Search companies...
        </span>
      </div>
      <div className="navbar-actions">
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {darkMode ? <FiSun /> : <FiMoon />}
        </button>
        <button className="icon-btn" title="Notifications">
          <FiBell />
        </button>
        <Link to="/app/profile" className="user-avatar" title={user?.name}>
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </Link>
        <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
          <FiLogOut />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
