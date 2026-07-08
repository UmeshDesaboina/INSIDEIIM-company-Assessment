import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCompanies } from '../../services/api';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const examples = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'AMZN', 'INFY', 'TCS', 'RELIANCE'];

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await searchCompanies(val);
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const selectCompany = (symbol) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/app/report/${symbol}`);
  };

  return (
    <div className="search-bar-container" ref={wrapperRef}>
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search any publicly traded company..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
        />
        {loading && <span className="search-spinner" />}
      </div>
      {isOpen && results.length > 0 && (
        <div className="search-results">
          {results.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => selectCompany(r.symbol)}>
              <div className="search-result-left">
                <span className="search-result-symbol">{r.symbol}</span>
                <span className="search-result-name">{r.name}</span>
              </div>
              <span className="search-result-exchange">{r.exchange}</span>
            </div>
          ))}
        </div>
      )}
      {isOpen && !loading && query && results.length === 0 && (
        <div className="search-results">
          <div className="search-result-item no-results">
            No companies found. Try another search.
          </div>
        </div>
      )}
      <div className="search-examples">
        <span className="examples-label">Try:</span>
        {examples.map(ex => (
          <button key={ex} className="example-chip" onClick={() => selectCompany(ex)}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
