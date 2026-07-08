import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../services/api';
import { useToast } from '../components/UI/Toast';
import { FiStar, FiTrash2, FiArrowRight } from 'react-icons/fi';
import '../styles/saved.css';

const Favorites = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await getFavorites();
      setFavorites(res.data.favorites || []);
    } catch {
      addToast('Failed to load favorites', 'error');
    }
    setLoading(false);
  };

  const handleRemove = async (symbol) => {
    try {
      await removeFavorite(symbol);
      setFavorites(favorites.filter(f => f.symbol !== symbol));
      addToast('Removed from favorites', 'success');
    } catch {
      addToast('Failed to remove', 'error');
    }
  };

  return (
    <div className="saved-page">
      <h1>Favorites</h1>
      <p className="page-subtitle">Your favorite companies for quick access</p>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : favorites.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">★</span>
          <h3>No favorites yet</h3>
          <p>Search for companies and add them to your favorites</p>
          <button className="btn-primary" onClick={() => navigate('/app')}>
            Search Companies
          </button>
        </div>
      ) : (
        <div className="saved-grid">
          {favorites.map(fav => (
            <div key={fav._id} className="saved-card">
              <div className="saved-card-header">
                <span className="saved-symbol">{fav.symbol}</span>
                <button className="icon-btn danger" onClick={() => handleRemove(fav.symbol)}>
                  <FiTrash2 />
                </button>
              </div>
              <h3 className="saved-name">{fav.companyName}</h3>
              <button className="saved-view-btn" onClick={() => navigate(`/app/report/${fav.symbol}`)}>
                View Report <FiArrowRight />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
