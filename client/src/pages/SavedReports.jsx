import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedReports } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { FiBookmark, FiArrowRight, FiBarChart2 } from 'react-icons/fi';
import '../styles/saved.css';

const SavedReports = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await getSavedReports();
      setReports(res.data.reports || []);
    } catch {
      addToast('Failed to load saved reports', 'error');
    }
    setLoading(false);
  };

  const getRecColor = (type) => {
    switch (type) {
      case 'INVEST': return 'var(--success)';
      case 'HOLD': return 'var(--warning)';
      case 'PASS': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="saved-page">
      <h1>Saved Reports</h1>
      <p className="page-subtitle">Your bookmarked investment research reports</p>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📑</span>
          <h3>No saved reports</h3>
          <p>Save reports to access them quickly later</p>
          <button className="btn-primary" onClick={() => navigate('/app')}>
            Search Companies
          </button>
        </div>
      ) : (
        <div className="saved-grid">
          {reports.map(r => (
            <div key={r._id} className="saved-card">
              <div className="saved-card-header">
                <span className="saved-symbol">{r.symbol}</span>
                <span className="saved-badge" style={{ background: getRecColor(r.recommendation?.type) }}>
                  {r.recommendation?.type || 'HOLD'}
                </span>
              </div>
              <h3 className="saved-name">{r.companyName}</h3>
              <p className="saved-industry">{r.companyInfo?.industry || ''}</p>
              <div className="saved-meta">
                <span>{new Date(r.updatedAt).toLocaleDateString()}</span>
              </div>
              <button className="saved-view-btn" onClick={() => navigate(`/app/report/${r.symbol}`)}>
                View Report <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedReports;
