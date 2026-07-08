import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, clearHistory } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { FiClock, FiTrash2, FiArrowRight, FiSearch, FiEye, FiBookmark } from 'react-icons/fi';
import '../styles/history.css';

const History = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      const res = await getHistory(page);
      setHistory(res.data.history || []);
      setPagination(res.data.pagination);
    } catch {
      addToast('Failed to load history', 'error');
    }
    setLoading(false);
  };

  const handleClear = async () => {
    try {
      await clearHistory();
      setHistory([]);
      addToast('History cleared', 'success');
    } catch {
      addToast('Failed to clear history', 'error');
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'search': return <FiSearch />;
      case 'view': return <FiEye />;
      case 'save': return <FiBookmark />;
      default: return <FiClock />;
    }
  };

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1>History</h1>
          <p className="page-subtitle">Your search and viewing activity</p>
        </div>
        {history.length > 0 && (
          <button className="btn-secondary danger" onClick={handleClear}>
            <FiTrash2 /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🕐</span>
          <h3>No history yet</h3>
          <p>Your searched companies will appear here</p>
          <button className="btn-primary" onClick={() => navigate('/app')}>
            Search Companies
          </button>
        </div>
      ) : (
        <>
          <div className="history-list">
            {history.map((item, i) => (
              <div key={item._id || i} className="history-item" onClick={() => navigate(`/app/report/${item.symbol}`)}>
                <span className="history-icon">{getActionIcon(item.action)}</span>
                <div className="history-info">
                  <span className="history-symbol">{item.symbol}</span>
                  <span className="history-name">{item.companyName}</span>
                </div>
                <span className="history-action">{item.action}</span>
                <span className="history-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                <FiArrowRight className="history-arrow" />
              </div>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span>Page {page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
