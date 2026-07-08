import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiRepeat, FiMessageSquare, FiFileText } from 'react-icons/fi';

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: <FiSearch />, label: 'New Research', desc: 'Analyze a company', path: '/app' },
    { icon: <FiRepeat />, label: 'Compare', desc: 'Compare companies', path: '/app/compare' },
    { icon: <FiMessageSquare />, label: 'AI Chat', desc: 'Ask questions', path: '/app/chat' },
    { icon: <FiFileText />, label: 'Reports', desc: 'Saved reports', path: '/app/saved' },
  ];

  return (
    <div className="quick-actions">
      <h3 className="section-title">Quick Actions</h3>
      <div className="actions-grid">
        {actions.map((action, i) => (
          <div key={i} className="action-card" onClick={() => navigate(action.path)}>
            <span className="action-icon">{action.icon}</span>
            <div className="action-info">
              <span className="action-label">{action.label}</span>
              <span className="action-desc">{action.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
