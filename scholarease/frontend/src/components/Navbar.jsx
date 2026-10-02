import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, LogOut, Shield, User, BookOpen, Bookmark, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationsDropdown from './NotificationsDropdown';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <span className="brand-name">ScholarEase</span>
          <span className="brand-tag">MERN Portal</span>
        </Link>

        {isAuthenticated && user && (
          <div className="nav-links">
            {user.role === 'Student' ? (
              <>
                <Link
                  to="/student"
                  className={`nav-item ${location.pathname === '/student' ? 'active' : ''}`}
                >
                  <BookOpen size={16} />
                  <span>Dashboard</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/admin"
                  className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}
                >
                  <Shield size={16} />
                  <span>Admin Console</span>
                </Link>
              </>
            )}
          </div>
        )}

        <div className="nav-right">
          {isAuthenticated && user ? (
            <>
              <NotificationsDropdown />

              <div className="nav-user">
                <div className="nav-avatar">
                  {getInitials(user.name)}
                </div>
                <div className="nav-user-info">
                  <span className="nav-user-name">{user.name}</span>
                  <span className="nav-user-role">
                    {user.role === 'Admin' ? 'Administrator' : 'Student'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="btn-icon"
                title="Sign out"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
