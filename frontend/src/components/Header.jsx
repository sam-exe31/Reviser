import React, { useState, useEffect } from 'react';
import { RefreshCw, Sun, Moon } from 'lucide-react';
import { api } from '../services/api';

export default function Header({ title, onRefresh }) {
  const [backendOnline, setBackendOnline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [theme, setTheme] = useState('light');

  const checkStatus = async () => {
    setChecking(true);
    const ok = await api.checkHealth();
    setBackendOnline(ok);
    setChecking(false);
  };

  // Load theme from PostgreSQL database
  useEffect(() => {
    api.getSetting('theme')
      .then(res => {
        if (res && res.value) {
          setTheme(res.value);
          document.documentElement.setAttribute('data-theme', res.value);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      await api.setSetting('theme', nextTheme);
    } catch (err) {
      console.warn('Could not persist theme to DB:', err);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="rv-topbar">
      <div className="rv-crumb">
        <b>{title}</b> &nbsp;·&nbsp; {todayStr}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Universal Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title={`Switch to ${theme === 'light' ? 'Midnight Dark' : 'Warm Parchment Light'} Mode`}
          style={{ width: '34px', height: '34px' }}
        >
          {theme === 'light' ? (
            <Moon size={15} color="var(--text-main)" />
          ) : (
            <Sun size={15} color="#facc15" />
          )}
        </button>

        {/* Backend Status Indicator */}
        <div 
          className="rv-status" 
          onClick={checkStatus} 
          title="Click to verify backend connection"
          style={{ cursor: 'pointer', color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}
        >
          <span 
            className="pulsing-dot" 
            style={{ background: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} 
          />
          <span>{backendOnline ? 'Engine online' : 'Connecting...'}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button 
            className="btn-icon" 
            onClick={onRefresh} 
            title="Refresh View"
          >
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}
