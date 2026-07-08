import React from 'react';
import { Link } from 'react-router-dom';
import SignupForm from '../components/Auth/SignupForm';
import '../styles/auth.css';

const Signup = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-sidebar">
          <div className="auth-sidebar-content">
            <Link to="/" className="auth-logo">
              <span className="logo-icon">◈</span>
              <span className="logo-text">InvestMind</span>
            </Link>
            <h2 className="auth-sidebar-title">Start Your Journey</h2>
            <p className="auth-sidebar-desc">
              Get AI-powered investment research at your fingertips.
            </p>
            <div className="auth-benefits">
              <div className="benefit-item">✓ AI-Powered Analysis</div>
              <div className="benefit-item">✓ 10,000+ Companies</div>
              <div className="benefit-item">✓ Real-time Data</div>
              <div className="benefit-item">✓ Smart Recommendations</div>
            </div>
          </div>
        </div>
        <div className="auth-main">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};

export default Signup;
