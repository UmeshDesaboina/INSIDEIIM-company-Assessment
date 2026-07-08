import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiShield, FiZap, FiBarChart2, FiArrowRight, FiStar, FiGlobe } from 'react-icons/fi';
import '../styles/landing.css';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const points = Array.from({ length: 60 }, (_, i) => ({
      x: (i / 60) * canvas.width,
      y: canvas.height / 2 + Math.sin(i * 0.3) * 30,
    }));

    let phase = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phase += 0.02;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      points.forEach((p, i) => {
        p.y = canvas.height / 2 + Math.sin(i * 0.3 + phase) * 30 + Math.sin(i * 0.1 + phase * 0.5) * 15;
        ctx.lineTo(p.x, p.y);
      });

      ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.lineTo(points[points.length - 1].x, canvas.height);
      ctx.lineTo(points[0].x, canvas.height);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, canvas.height / 2 - 40, 0, canvas.height);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const stats = [
    { icon: '📊', value: '10K+', label: 'Companies Analyzed' },
    { icon: '🎯', value: '94%', label: 'Accuracy Rate' },
    { icon: '⚡', value: '< 30s', label: 'Analysis Speed' },
    { icon: '🌍', value: '50+', label: 'Global Markets' },
  ];

  const features = [
    { icon: <FiZap />, title: 'AI-Powered Analysis', desc: 'Advanced AI analyzes financial data, news, and market trends to provide accurate investment recommendations.' },
    { icon: <FiBarChart2 />, title: 'Deep Financial Data', desc: 'Access comprehensive financial statements, ratios, growth metrics, and valuation data for any public company.' },
    { icon: <FiShield />, title: 'Risk Assessment', desc: 'Detailed risk analysis with SWOT framework to help you make informed investment decisions.' },
    { icon: <FiTrendingUp />, title: 'Smart Recommendations', desc: 'Clear INVEST, HOLD, or PASS recommendations with confidence scores backed by data.' },
    { icon: <FiGlobe />, title: 'Real-time News', desc: 'Aggregated news with AI sentiment analysis to understand market perception.' },
    { icon: <FiStar />, title: 'Company Comparison', desc: 'Compare multiple companies side-by-side across key financial metrics and AI recommendations.' },
  ];

  const steps = [
    { num: '01', title: 'Search Company', desc: 'Enter any publicly traded company name or ticker symbol.' },
    { num: '02', title: 'AI Analysis', desc: 'Our AI agent gathers financial data, news, and web research.' },
    { num: '03', title: 'Get Report', desc: 'Receive a comprehensive analysis with clear recommendation.' },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="nav-inner">
          <Link to="/" className="landing-logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">InvestMind</span>
          </Link>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="nav-cta">Get Started <FiArrowRight /></Link>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg" />
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-content">
          <div className="hero-badge">AI-Powered Investment Research</div>
          <h1 className="hero-title">
            Make Smarter<br />
            <span className="gradient-text">Investment Decisions</span>
          </h1>
          <p className="hero-desc">
            Research thousands of publicly traded companies with AI-powered analysis.
            Get data-driven recommendations, financial insights, and market intelligence in seconds.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="hero-btn-primary">
              Start Free Research <FiArrowRight />
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Watch Demo
            </Link>
          </div>
          <div className="hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <span className="hero-stat-icon">{s.icon}</span>
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Powerful Features for <span className="gradient-text">Smart Investing</span></h2>
            <p>Everything you need to research and analyze companies effectively.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="section-container">
          <div className="section-header">
            <h2>How It <span className="gradient-text">Works</span></h2>
            <p>Three simple steps to get your AI investment research.</p>
          </div>
          <div className="steps-container">
            {steps.map((s, i) => (
              <div key={i} className="step-card">
                <span className="step-number">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < steps.length - 1 && <div className="step-connector"><span>→</span></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Start Making Data-Driven <span className="gradient-text">Investment Decisions</span></h2>
          <p>Join thousands of investors using AI to research smarter.</p>
          <Link to="/signup" className="hero-btn-primary">
            Get Started Free <FiArrowRight />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-icon">◈</span>
            <span className="logo-text">InvestMind</span>
            <p className="footer-desc">AI-powered investment research platform making stock analysis accessible to everyone.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <Link to="/signup">Features</Link>
              <Link to="/signup">Pricing</Link>
              <Link to="/signup">API</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#blog">Blog</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 InvestMind AI. All rights reserved.</p>
          <p className="disclaimer">Investment research provided for informational purposes only. Not financial advice.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
