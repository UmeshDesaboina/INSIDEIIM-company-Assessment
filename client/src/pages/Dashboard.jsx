import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/Dashboard/SearchBar';
import QuickActions from '../components/Dashboard/QuickActions';
import StatCard from '../components/Dashboard/StatCard';
import { getFavorites, getHistory, getSavedReports } from '../services/api';
import { FiTrendingUp, FiDollarSign, FiBarChart2, FiStar } from 'react-icons/fi';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [savedReports, setSavedReports] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [favRes, histRes, savedRes] = await Promise.all([
          getFavorites(),
          getHistory(1),
          getSavedReports()
        ]);
        setFavorites(favRes.data.favorites || []);
        setRecentSearches(histRes.data.history || []);
        setSavedReports(savedRes.data.reports || []);
      } catch (e) {
        // silently fail
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">Welcome back, {user?.name?.split(' ')[0] || 'Investor'}</h1>
          <p className="dashboard-subtitle">Research any publicly traded company with AI</p>
        </div>
      </div>

      <SearchBar />

      <div className="stats-grid">
        <StatCard icon={<FiBarChart2 />} label="Total Reports" value={user?.stats?.totalReports || 0} color="#6366f1" />
        <StatCard icon={<FiStar />} label="Favorites" value={favorites.length} color="#f59e0b" />
        <StatCard icon={<FiTrendingUp />} label="Saved Reports" value={savedReports.length} color="#22c55e" />
        <StatCard icon={<FiDollarSign />} label="Companies Analyzed" value={user?.stats?.totalReports || 0} color="#ec4899" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <QuickActions />
        </div>

        <div className="dashboard-section">
          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <h3 className="section-title">Recent Searches</h3>
              <div className="recent-list">
                {recentSearches.slice(0, 5).map((item, i) => (
                  <div key={i} className="recent-item" onClick={() => navigate(`/app/report/${item.symbol}`)}>
                    <span className="recent-symbol">{item.symbol}</span>
                    <span className="recent-name">{item.companyName}</span>
                    <span className="recent-date">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {favorites.length > 0 && (
            <div className="favorites-mini">
              <h3 className="section-title">Favorites</h3>
              <div className="favorites-mini-list">
                {favorites.slice(0, 3).map((fav, i) => (
                  <div key={i} className="favorite-chip" onClick={() => navigate(`/app/report/${fav.symbol}`)}>
                    <span className="fav-star">★</span>
                    <span>{fav.symbol}</span>
                    <span className="fav-name">{fav.companyName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
