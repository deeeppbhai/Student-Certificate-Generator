import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Award, LayoutDashboard, FileCheck, PlusCircle, LogOut, ShieldCheck, LogIn, Sun, Moon } from 'lucide-react';
import { authService } from '../services/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('scg_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('scg_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('scg_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login?manual=true');
  };

  if (location.pathname === '/login') return null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/dashboard" className="nav-brand">
          <div className="nav-logo-wrap">
            <img
              src="/assets/logo.png"
              alt="SCG Logo"
              className="nav-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <span className="brand-text">Student Certificate Generation</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                <LayoutDashboard size={17} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/generate" className={`nav-link ${location.pathname === '/generate' ? 'active' : ''}`}>
                <PlusCircle size={17} />
                Studio
              </Link>
            </li>
            <li>
              <Link to="/certificates" className={`nav-link ${location.pathname === '/certificates' ? 'active' : ''}`}>
                <FileCheck size={17} />
                Certificates Archive
              </Link>
            </li>
            <li>
              <Link to="/verify" className={`nav-link ${location.pathname.startsWith('/verify') ? 'active' : ''}`}>
                <ShieldCheck size={17} />
                Verify Credential
              </Link>
            </li>
          </ul>
        </nav>

        {/* Right User & Actions */}
        <div className="nav-right-actions">
          {/* Theme Toggle Button */}
          <button
            className="btn btn-secondary btn-icon"
            onClick={toggleTheme}
            title={isDark ? "Switch to Executive Light Mode" : "Switch to Obsidian Dark Mode"}
            type="button"
          >
            {isDark ? <Sun size={16} color="var(--gold-400)" /> : <Moon size={16} color="var(--sapphire-600)" />}
          </button>

          {currentUser ? (
            <>
              <div className="user-badge">
                <div className="user-avatar">
                  {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser?.full_name || 'System Admin'}</span>
                  <span className="user-role">{currentUser?.role ? currentUser.role.toUpperCase() : 'ADMIN'}</span>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-icon"
                onClick={handleLogout}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem' }}>
              <LogIn size={15} /> Admin Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
