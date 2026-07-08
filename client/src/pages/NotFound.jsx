import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <span className="not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn-primary">Go Home</Link>
          <Link to="/app" className="btn-secondary">Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
