import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI/Toast';
import { FiUser, FiMail, FiMoon, FiSun, FiBarChart2, FiCalendar } from 'react-icons/fi';
import '../styles/profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      addToast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      updateUser({ name });
      addToast('Profile updated', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <p className="page-subtitle">Manage your account settings</p>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <FiBarChart2 />
            <div>
              <span className="stat-num">{user?.stats?.totalReports || 0}</span>
              <span className="stat-label">Reports Generated</span>
            </div>
          </div>
          <div className="profile-stat">
            <FiCalendar />
            <div>
              <span className="stat-num">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              <span className="stat-label">Member Since</span>
            </div>
          </div>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label className="form-label"><FiUser /> Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label"><FiMail /> Email</label>
            <input type="email" className="form-input" value={user?.email || ''} disabled />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
