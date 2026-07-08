import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/Auth/LoginForm';
import '../styles/auth.css';

const Login = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-sidebar">
          <div className="auth-sidebar-content">
            <Link to="/" className="auth-logo">
              <span className="logo-icon">◈</span>
              <span className="logo-text">InvestMind</span>
            </Link>
            <h2 className="auth-sidebar-title">Welcome Back</h2>
            <p className="auth-sidebar-desc">
              Access your AI-powered investment research dashboard.
            </p>
            <div className="auth-testimonial">
              <p>"InvestMind has completely transformed how I research stocks. The AI analysis is incredibly accurate."</p>
              <span className="testimonial-author">— Sarah Chen, Investor</span>
            </div>
          </div>
        </div>
        <div className="auth-main">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Login;
