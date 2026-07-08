import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../UI/Loader';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-title">Welcome Back</h2>
      <p className="auth-subtitle">Sign in to your account</p>
      {error && <div className="auth-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Email</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input
          type="password"
          className="form-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>
      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? <Loader /> : 'Sign In'}
      </button>
      <p className="auth-footer-text">
        Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
      </p>
    </form>
  );
};

export default LoginForm;
