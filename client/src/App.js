import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/UI/Toast';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CompanyReport from './pages/CompanyReport';
import Comparison from './pages/Comparison';
import Favorites from './pages/Favorites';
import History from './pages/History';
import SavedReports from './pages/SavedReports';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Portfolio from './pages/Portfolio';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="report/:symbol" element={<CompanyReport />} />
            <Route path="compare" element={<Comparison />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="history" element={<History />} />
            <Route path="saved" element={<SavedReports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:symbol" element={<Chat />} />
            <Route path="portfolio" element={<Portfolio />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
