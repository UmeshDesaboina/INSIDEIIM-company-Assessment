import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../components/UI/Toast';
import { Loader } from '../components/UI/Loader';
import DoughnutChart from '../components/Charts/DoughnutChart';
import LineChart from '../components/Charts/LineChart';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiBriefcase, FiPieChart, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import '../styles/portfolio.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Portfolio = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSymbol, setEditingSymbol] = useState(null);
  const [editShares, setEditShares] = useState('');
  const [editCost, setEditCost] = useState('');

  // Add form state
  const [symbol, setSymbol] = useState('AAPL');
  const [shares, setShares] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const majorTickers = ['AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA', 'NVDA', 'AMD', 'NFLX', 'AMZN', 'WIT', 'INFY'];

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/portfolio`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      addToast('Failed to load portfolio data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleAddHolding = async (e) => {
    e.preventDefault();
    if (!symbol || !shares || !avgCost) {
      addToast('Please fill all fields', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/portfolio/holdings`,
        { symbol, shares: parseFloat(shares), averageCost: parseFloat(avgCost) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Holding added successfully', 'success');
      setShares('');
      setAvgCost('');
      fetchPortfolio();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add holding', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (h) => {
    setEditingSymbol(h.symbol);
    setEditShares(h.shares.toString());
    setEditCost(h.averageCost.toString());
  };

  const handleCancelEdit = () => {
    setEditingSymbol(null);
  };

  const handleSaveEdit = async (sym) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/portfolio/holdings/${sym}`,
        { shares: parseFloat(editShares), averageCost: parseFloat(editCost) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      addToast('Holding updated successfully', 'success');
      setEditingSymbol(null);
      fetchPortfolio();
    } catch (err) {
      addToast('Failed to update holding', 'error');
    }
  };

  const handleDeleteHolding = async (sym) => {
    if (!window.confirm(`Are you sure you want to remove ${sym} from your portfolio?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/portfolio/holdings/${sym}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Holding removed', 'success');
      fetchPortfolio();
    } catch (err) {
      addToast('Failed to remove holding', 'error');
    }
  };

  if (loading) {
    return (
      <div className="portfolio-page loading-center">
        <Loader />
      </div>
    );
  }

  const {
    holdings = [],
    totalValue = 0,
    costBasis = 0,
    gainLoss = 0,
    gainLossPercent = 0,
    dailyChange = 0,
    dailyChangePercent = 0,
    sectorAllocation = {},
    diversificationScore = 100,
    performanceHistory = []
  } = data || {};

  const sectorLabels = Object.keys(sectorAllocation);
  const sectorData = Object.values(sectorAllocation);
  const sectorColors = ['#6366f1', '#22c55e', '#06b6d4', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444', '#14b8a6'];

  const getDiversificationClass = (score) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="portfolio-page">
      <div className="portfolio-header">
        <div>
          <h1>Wealth Portfolio</h1>
          <p className="page-subtitle">Track holdings, allocations, performance and capital growth</p>
        </div>
      </div>

      {/* Top Level Cards */}
      <div className="portfolio-stats-grid">
        <div className="portfolio-stat-card glass-card">
          <div className="stat-icon"><FiBriefcase /></div>
          <div>
            <span className="stat-label">Portfolio Value</span>
            <h2 className="stat-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <span className="stat-sub">Cost Basis: ${costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="portfolio-stat-card glass-card">
          <div className="stat-icon"><FiTrendingUp /></div>
          <div>
            <span className="stat-label">Total Gain / Loss</span>
            <h2 className={`stat-value ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
              {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`stat-sub ${gainLoss >= 0 ? 'positive' : 'negative'}`}>
              {gainLoss >= 0 ? '▲' : '▼'} {gainLossPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="portfolio-stat-card glass-card">
          <div className="stat-icon"><FiTrendingUp /></div>
          <div>
            <span className="stat-label">Daily Price Change</span>
            <h2 className={`stat-value ${dailyChange >= 0 ? 'positive' : 'negative'}`}>
              {dailyChange >= 0 ? '+' : ''}${dailyChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <span className={`stat-sub ${dailyChange >= 0 ? 'positive' : 'negative'}`}>
              {dailyChange >= 0 ? '▲' : '▼'} {dailyChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="portfolio-stat-card glass-card">
          <div className="stat-icon"><FiPieChart /></div>
          <div>
            <span className="stat-label">Diversification Score</span>
            <h2 className={`stat-value ${getDiversificationClass(diversificationScore)}`}>
              {diversificationScore}/100
            </h2>
            <span className="stat-sub">
              {diversificationScore >= 70 ? 'Excellent' : diversificationScore >= 40 ? 'Moderate' : 'Concentrated Risk'}
            </span>
          </div>
        </div>
      </div>

      <div className="portfolio-main-grid">
        {/* Left column: holdings list */}
        <div className="portfolio-holdings-card glass-card">
          <h3>Holdings Details</h3>
          <div className="table-container">
            <table className="holdings-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Current Price</th>
                  <th>Current Value</th>
                  <th>Gain/Loss</th>
                  <th>Daily Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">No holdings added yet. Add a stock to get started!</td>
                  </tr>
                ) : (
                  holdings.map((h) => {
                    const isEditing = editingSymbol === h.symbol;
                    return (
                      <tr key={h.symbol}>
                        <td className="symbol-cell" onClick={() => navigate(`/app/report/${h.symbol}`)}>
                          <strong>{h.symbol}</strong>
                          <span className="company-subname">{h.name}</span>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editShares}
                              onChange={e => setEditShares(e.target.value)}
                            />
                          ) : (
                            h.shares
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="number"
                              className="edit-input"
                              value={editCost}
                              onChange={e => setEditCost(e.target.value)}
                            />
                          ) : (
                            `$${h.averageCost.toFixed(2)}`
                          )}
                        </td>
                        <td>${h.currentPrice.toFixed(2)}</td>
                        <td><strong>${h.currentValue.toLocaleString()}</strong></td>
                        <td className={h.gainLoss >= 0 ? 'positive' : 'negative'}>
                          <strong>{h.gainLoss >= 0 ? '+' : ''}${h.gainLoss.toLocaleString()}</strong>
                          <span className="table-sub">{h.gainLossPercent.toFixed(2)}%</span>
                        </td>
                        <td className={h.dailyChange >= 0 ? 'positive' : 'negative'}>
                          {h.dailyChange >= 0 ? '+' : ''}${h.dailyChange.toLocaleString()}
                          <span className="table-sub">{h.dailyChangePercent.toFixed(2)}%</span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            {isEditing ? (
                              <>
                                <button className="icon-btn-green" onClick={() => handleSaveEdit(h.symbol)} title="Save"><FiCheck /></button>
                                <button className="icon-btn-red" onClick={handleCancelEdit} title="Cancel"><FiX /></button>
                              </>
                            ) : (
                              <>
                                <button className="icon-btn-edit" onClick={() => handleStartEdit(h)} title="Edit"><FiEdit2 /></button>
                                <button className="icon-btn-delete" onClick={() => handleDeleteHolding(h.symbol)} title="Delete"><FiTrash2 /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Form and allocation */}
        <div className="portfolio-sidebar-column">
          {/* Add Holdings Form */}
          <div className="add-holding-card glass-card">
            <h3>Add Stocks / Holdings</h3>
            <form onSubmit={handleAddHolding} className="add-holding-form">
              <div className="form-group">
                <label>Stock Ticker</label>
                <select value={symbol} onChange={e => setSymbol(e.target.value)} className="form-input">
                  {majorTickers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Shares Quantity</label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 10"
                  className="form-input"
                  value={shares}
                  onChange={e => setShares(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Average Cost Basis ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 175.50"
                  className="form-input"
                  value={avgCost}
                  onChange={e => setAvgCost(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Position'} <FiPlus style={{ marginLeft: '4px' }} />
              </button>
            </form>
          </div>

          {/* Allocation card */}
          {holdings.length > 0 && (
            <div className="allocation-card glass-card">
              <h3>Sector Allocation</h3>
              <div className="allocation-chart-wrapper">
                <DoughnutChart
                  labels={sectorLabels}
                  data={sectorData}
                  colors={sectorColors.slice(0, sectorLabels.length)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Performance Graph */}
      {holdings.length > 0 && performanceHistory.length > 0 && (
        <div className="portfolio-chart-card glass-card" style={{ marginTop: '2rem' }}>
          <h3>Portfolio Historical Performance</h3>
          <p className="card-subtitle">Chronological cumulative price trend based on historical holding clashing averages</p>
          <div className="performance-chart-wrapper" style={{ height: '300px' }}>
            <LineChart
              labels={['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6', 'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12']}
              data={performanceHistory}
              title="Portfolio Value Trend"
              color="#6366f1"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
