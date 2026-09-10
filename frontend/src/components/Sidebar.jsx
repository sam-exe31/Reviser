import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  CheckSquare, 
  BookOpen, 
  Target, 
  History, 
  MessageSquare, 
  Plus,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function Sidebar({ activeTab, setActiveTab, onOpenAddModal, dueCount = 0 }) {
  const [streak, setStreak] = useState(0);
  const [todayActive, setTodayActive] = useState(false);
  const [weeklyDays, setWeeklyDays] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadStreakAndActivity = async () => {
      try {
        const [streakData, activityData] = await Promise.all([
          api.getStreak().catch(() => null),
          api.getWeeklyActivity().catch(() => null)
        ]);

        if (isMounted) {
          if (streakData) {
            setStreak(streakData.currentStreak || 0);
            setTodayActive(!!streakData.todayActive);
          }
          if (activityData && Array.isArray(activityData.days)) {
            setWeeklyDays(activityData.days);
          }
        }
      } catch (err) {
        console.error('Error fetching sidebar streak & activity:', err);
      }
    };

    loadStreakAndActivity();
    window.addEventListener('focus', loadStreakAndActivity);
    return () => {
      isMounted = false;
      window.removeEventListener('focus', loadStreakAndActivity);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { 
      id: 'tasks', 
      label: 'Today & Due', 
      icon: CheckSquare, 
      count: dueCount > 0 ? dueCount : null
    },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'goals', label: 'Monthly Goals', icon: Target },
    { id: 'library', label: 'Problem Bank', icon: BookOpen },
    { id: 'history', label: 'Review & Insights', icon: History },
  ];

  return (
    <aside className="rv-rail">
      {/* Brand Wordmark */}
      <div className="rv-wordmark" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img
          src="./icon.png"
          alt="Reviser Logo"
          width="32"
          height="32"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(14,165,164,0.25)',
            flexShrink: 0
          }}
        />
        <div>
          <div className="name font-serif">Reviser</div>
          <div className="tag">spaced repetition &middot; AI</div>
        </div>
      </div>

      {/* Quick Add Action Button */}
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={onOpenAddModal}
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.84rem' }}
        >
          <Plus size={15} />
          <span>Add Problem</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="rv-nav" aria-label="Main Navigation">
        <div className="group">Workspace</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`rv-nav-item ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.count ? `${item.label} (${item.count} due)` : item.label}
            >
              <span className="ic" aria-hidden="true">
                <Icon size={17} strokeWidth={isActive ? 2.2 : 2} />
              </span>
              <span className="lbl">{item.label}</span>
              {item.count && (
                <span className="rv-nav-count" aria-hidden="true">{item.count}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Rail Foot: Live Study Streak & 7-Day Sparkline from Database */}
      <div className="rv-streak">
        <div className="top">
          <div className="num font-serif">
            {streak}
            <small> {streak === 1 ? 'day' : 'days'}</small>
          </div>
          <div className="mono-label">
            {todayActive ? 'Study streak 🔥' : streak > 0 ? 'Streak at risk ⚠️' : 'Study streak'}
          </div>
        </div>
        <div className="rv-spark" title="Last 7 days study consistency (Mon–Sun)">
          {weeklyDays.length > 0 ? (
            weeklyDays.map((day, idx) => {
              const active = day.hasActivity || day.completedCount > 0;
              const count = day.completedCount || 0;
              const heightPct = active 
                ? Math.min(100, Math.max(35, count * 22)) 
                : 20;
              const dayName = day.date 
                ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) 
                : `D${idx + 1}`;
              return (
                <span
                  key={idx}
                  className={!active ? 'miss' : ''}
                  style={{ height: `${heightPct}%` }}
                  title={`${dayName}: ${active ? `${count} completed` : 'Rest day'}`}
                />
              );
            })
          ) : (
            Array.from({ length: 7 }).map((_, idx) => (
              <span key={idx} className="miss" style={{ height: '25%' }} title="No data logged" />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

