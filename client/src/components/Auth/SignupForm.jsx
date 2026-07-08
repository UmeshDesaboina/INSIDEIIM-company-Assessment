import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from '../UI/Loader';

const SignupForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2 className="auth-title">Create Account</h2>
      <p className="auth-subtitle">Start your AI investment research</p>
      {error && <div className="auth-error">{error}</div>}
      <div className="form-group">
        <label className="form-label">Full Name</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="John Doe"
          required
          minLength={2}
        />
      </div>
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
      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input
          type="password"
          className="form-input"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>
      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? <Loader /> : 'Create Account'}
      </button>
      <p className="auth-footer-text">
        Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
      </p>
    </form>
  );
};

export default SignupForm;
