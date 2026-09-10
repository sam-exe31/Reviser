import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Flame, Check, CheckCircle2, Clock, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Skeleton, ProgressBar } from '../components/ui';

// Loading placeholder — mirrors the real layout so the dashboard doesn't
// flash zeros while the API calls resolve.
function DashboardSkeleton() {
  return (
    <div className="rv-container">
      <header className="rv-hero">
        <Skeleton width={220} height={12} style={{ marginBottom: 18 }} />
        <Skeleton width="70%" height={38} style={{ marginBottom: 10 }} />
        <Skeleton width="90%" height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="55%" height={16} style={{ marginBottom: 24 }} />
        <div className="rv-curve-card">
          <Skeleton width={180} height={18} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={200} radius="var(--radius-md)" />
        </div>
      </header>

      <section className="rv-glance">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rv-glance-cell">
            <Skeleton width={54} height={34} style={{ marginBottom: 10 }} />
            <Skeleton width={110} height={12} />
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 28 }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-card)',
        }}>
          <Skeleton width="40%" height={16} style={{ marginBottom: 14 }} />
          <Skeleton width="100%" height={8} />
        </div>
      </section>

      <section className="rv-cols">
        <div>
          <Skeleton width={140} height={18} style={{ marginBottom: 14 }} />
          <div className="rv-review-list">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} width="100%" height={64} radius="var(--radius-md)" style={{ marginBottom: 10 }} />
            ))}
          </div>
        </div>
        <div>
          <Skeleton width={120} height={18} style={{ marginBottom: 14 }} />
          <div className="rv-month">
            {[0, 1, 2].map(i => (
              <div key={i} style={{ marginBottom: 14 }}>
                <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
                <Skeleton width="100%" height={5} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Dashboard({ onNavigate, onStartReview, onOpenAddModal }) {
  const [overview, setOverview] = useState(null);
  const [dueReviews, setDueReviews] = useState([]);
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);

  const todayKey = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewData, goalData, dueData, todosData] = await Promise.all([
        api.getTodayOverview().catch(() => null),
        api.getCurrentMonthGoal().catch(() => null),
        api.getDueReviews().catch(() => []),
        api.getTodos(todayKey).catch(() => [])
      ]);
      setOverview(overviewData);
      setGoal(goalData);
      setDueReviews(dueData || []);
      setTodos(todosData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subtask toggle on Dashboard
  const handleDashboardSubtaskToggle = async (taskId, subtaskId) => {
    try {
      const updated = await api.toggleSubtask(taskId, subtaskId);
      setTodos(prev => prev.map(t => t.id === taskId ? updated : t));

      if (updated.completed) {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#0ea5a4', '#059669', '#d97706']
        });
      }
    } catch (err) {
      console.error('Error toggling subtask:', err);
    }
  };

  const dueCount = dueReviews.length || overview?.dueReviewCount || 0;
  const dailyTarget = overview?.dailyTargetTotal || 0;
  const completedToday = overview?.completedToday || 0;
  const completedLocal = todos.filter(t => t.completed).length;
  const totalLocal = todos.length;
  const categories = overview?.goalBreakdown?.categories || [];

  // Real analytics from database
  const habitStreak = overview?.currentStreak || 0;
  const todayActive = overview?.todayActive || false;
  const bestStreak = overview?.bestStreak || 0;
  const overallStability = overview?.overallStability ?? null;
  const trackedProblems = overview?.trackedProblems || 0;
  const weeklyActivity = overview?.weeklyActivity?.days || [];

  const habitItems = todos.filter(t => t.isHabit || t.habit || t.category === 'Habit');

  // Calculate days left in month
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDay - now.getDate());

  // Greeting time
  const hour = now.getHours();
  const greetingTime = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const weekNum = Math.min(4, Math.ceil(now.getDate() / 7));
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="rv-container">
      {/* ==================== HERO ==================== */}
      <header className="rv-hero">
        <div className="rv-eyebrow">
          {dayName} {greetingTime} · Week {weekNum} of 4
        </div>
        
        <h1 className="rv-greet font-serif">
          Good {greetingTime}.<br />
          <em>{dueCount > 0 ? `${dueCount} recall${dueCount > 1 ? 's are' : ' is'}` : 'All recalls are'}</em> ripe today.
        </h1>

        <p className="rv-sub">
          {trackedProblems > 0 && overallStability !== null
            ? `Your memory is holding at ${Math.round(overallStability)}% stability across ${trackedProblems} tracked problem${trackedProblems > 1 ? 's' : ''}. Clear the ripe reviews before they decay.`
            : 'Add problems and start reviewing to build your memory retention curve.'
          }
        </p>

        {/* The Signature Memory Retention Curve */}
        <div className="rv-curve-card">
          <div className="rv-curve-head">
            <div>
              <h3 className="font-serif">Memory retention</h3>
              <p>Each review lifts the curve and pushes the next recall interval further out.</p>
            </div>
            <div className="rv-legend">
              <span><i style={{ background: 'var(--accent-cyan)' }}></i> Recall strength</span>
              <span><i style={{ background: 'var(--accent-emerald)' }}></i> Review event</span>
            </div>
          </div>

          <svg 
            viewBox="0 0 900 220" 
            width="100%" 
            height="200" 
            preserveAspectRatio="none" 
            role="img" 
            aria-label="Retention curve decaying and resetting upward on each review"
          >
            <defs>
              <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(14,165,164,0.18)" />
                <stop offset="100%" stopColor="rgba(14,165,164,0.0)" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            <line x1="40" y1="50"  x2="860" y2="50"  stroke="var(--border-subtle)" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <line x1="40" y1="110" x2="860" y2="110" stroke="var(--border-subtle)" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
            <line x1="40" y1="170" x2="860" y2="170" stroke="var(--border-main)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
            <text x="14" y="54"  fontSize="10" fill="var(--text-dim)" fontFamily="JetBrains Mono, monospace">100</text>
            <text x="20" y="114" fontSize="10" fill="var(--text-dim)" fontFamily="JetBrains Mono, monospace">50</text>
            <text x="24" y="174" fontSize="10" fill="var(--text-dim)" fontFamily="JetBrains Mono, monospace">0</text>

            {/* Decay area + line */}
            <path 
              className="rv-curve-area" 
              fill="url(#fillGrad)"
              d="M40,50 Q140,105 250,145 L250,56 Q350,100 470,145 L470,52 Q580,96 690,148 L690,46 Q780,88 860,122 L860,170 L40,170 Z"
            />
            <path 
              className="rv-curve-line" 
              fill="none" 
              stroke="var(--accent-cyan)" 
              strokeWidth="2.75" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              vectorEffect="non-scaling-stroke"
              d="M40,50 Q140,105 250,145 L250,56 Q350,100 470,145 L470,52 Q580,96 690,148 L690,46 Q780,88 860,122"
            />

            {/* Review reset markers */}
            <circle className="rv-curve-dot" style={{ animationDelay: '.6s' }} cx="250" cy="56" r="5" fill="var(--accent-emerald)" stroke="var(--bg-card)" strokeWidth="2.5"/>
            <circle className="rv-curve-dot" style={{ animationDelay: '1.0s' }} cx="470" cy="52" r="5" fill="var(--accent-emerald)" stroke="var(--bg-card)" strokeWidth="2.5"/>
            <circle className="rv-curve-dot" style={{ animationDelay: '1.4s' }} cx="690" cy="46" r="5" fill="var(--accent-emerald)" stroke="var(--bg-card)" strokeWidth="2.5"/>
            
            {/* Today marker */}
            <circle className="rv-curve-dot" style={{ animationDelay: '1.8s' }} cx="860" cy="122" r="5.5" fill="var(--accent-cyan)" stroke="var(--bg-card)" strokeWidth="2.5"/>
            <text className="rv-curve-dot" style={{ animationDelay: '1.8s' }} x="858" y="112" textAnchor="end" fontSize="11" fill="var(--accent-cyan)" fontWeight="700" fontFamily="JetBrains Mono, monospace">
              today
            </text>
          </svg>
        </div>
      </header>

      {/* ==================== AT A GLANCE (4 CELLS) ==================== */}
      <section className="rv-glance stagger-in">
        <div className="rv-glance-cell">
          <div className="rv-glance-num" style={{ color: dueCount > 0 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
            {dueCount}
          </div>
          <div className="rv-glance-cap">
            Due for review
            <b>Spaced repetition</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num">
            {dailyTarget}
          </div>
          <div className="rv-glance-cap">
            Daily target
            <b>Sliced from goals</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num" style={{ color: 'var(--accent-emerald)' }}>
            {completedLocal > 0 ? completedLocal : completedToday} {totalLocal > 0 && <small>/ {totalLocal}</small>}
          </div>
          <div className="rv-glance-cap">
            Tasks done
            <b>Today's checklist</b>
          </div>
        </div>

        <div className="rv-glance-cell">
          <div className="rv-glance-num" style={{ color: 'var(--accent-amber)' }}>
            {habitStreak} <small>days</small>
          </div>
          <div className="rv-glance-cap">
            {todayActive ? 'Study streak 🔥' : habitStreak > 0 ? 'Streak at risk ⚠️' : 'Start your streak'}
            <b>{todayActive ? 'Active today' : habitStreak > 0 ? 'Complete a task!' : 'Complete a task'}</b>
          </div>
        </div>
      </section>

      {/* ==================== STUDY & HABIT STREAK COUNTER ==================== */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-main)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          boxShadow: 'var(--shadow-card)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Main Streak Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
              flexShrink: 0
            }}>
              <Flame size={32} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent-amber)', lineHeight: 1 }}>
                  {habitStreak}
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {habitStreak === 1 ? 'Day Study Streak!' : habitStreak > 0 ? 'Day Study Streak!' : 'No Streak Yet'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                {habitStreak > 0
                  ? <>🔥 {todayActive ? 'Active today' : 'Complete a task to keep it going'} · Best record: <strong style={{ color: 'var(--accent-emerald)' }}>{bestStreak} days</strong></>
                  : 'Complete your first task to start building momentum!'
                }
              </p>
            </div>
          </div>

          {/* Subtask & Daily Reps Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                Today's Sub-ticks &amp; Study Reps
              </span>
              <span style={{
                fontSize: '0.74rem',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: '700',
                color: 'var(--accent-emerald)'
              }}>
                {todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0)} / {Math.max(1, todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.length : 0), 0))} completed
              </span>
            </div>
            <div 
              role="progressbar"
              aria-valuenow={(() => {
                const totalSubs = todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.length : 0), 0);
                const doneSubs = todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0);
                return totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
              })()}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall daily subtask and study progress"
              style={{
                height: '8px',
                background: 'var(--border-main)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              {(() => {
                const totalSubs = todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.length : 0), 0);
                const doneSubs = todos.reduce((acc, t) => acc + (t.subtasks ? t.subtasks.filter(s => s.completed).length : 0), 0);
                const pct = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;
                return (
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%)',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.45)',
                    borderRadius: '4px',
                    transition: 'width 0.35s ease'
                  }} />
                );
              })()}
            </div>
          </div>

          {/* 7-Day Consistency Track — REAL DATA from DB */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px', fontWeight: '600' }}>
              7-Day Consistency Activity
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLabel, idx) => {
                const dayData = weeklyActivity[idx];
                const hasActivity = dayData?.hasActivity || false;
                const isToday = dayData?.date === todayKey;
                const isPastOrToday = dayData?.date <= todayKey;
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                    <div 
                      title={`${dayNames[idx]}: ${isToday ? (hasActivity ? 'Today (Active)' : 'Today (No activity yet)') : hasActivity ? `${dayData.completedCount} completed` : isPastOrToday ? 'No activity' : 'Upcoming'}`}
                      aria-label={`${dayNames[idx]}: ${isToday ? 'Today' : hasActivity ? 'Completed' : 'No activity'}`}
                      style={{
                        width: '100%',
                        height: '24px',
                        borderRadius: '4px',
                        background: isToday && hasActivity
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : hasActivity
                          ? 'rgba(16, 185, 129, 0.35)'
                          : 'var(--border-subtle)',
                        border: isToday ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isToday && hasActivity ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none'
                      }}
                    >
                      {hasActivity && <Check size={10} color={isToday ? '#ffffff' : 'var(--color-green)'} strokeWidth={3.5} />}
                    </div>
                    <span style={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono', color: isToday ? 'var(--accent-emerald)' : 'var(--text-dim)', fontWeight: isToday ? '800' : '500' }}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HABITS & SUB-TICKS SECTION ==================== */}
      {habitItems.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <div className="rv-section-head">
            <h2 className="font-serif">Daily Habits &amp; Sub-tick Reps</h2>
            <button className="link" onClick={() => onNavigate('tasks')}>
              Manage in Checklist <ArrowRight size={13} />
            </button>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-main)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {habitItems.map(h => {
              const habitSubs = h.subtasks || [];
              const doneSubs = habitSubs.filter(st => st.completed).length;
              const subPct = habitSubs.length > 0 ? Math.round((doneSubs / habitSubs.length) * 100) : (h.completed ? 100 : 0);

              return (
                <div 
                  key={h.id}
                  className="box-amber"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Flame size={16} color="var(--color-amber)" />
                      <span style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                        {h.title}
                      </span>
                    </div>

                    <span className="badge badge-amber" style={{ fontSize: '0.68rem', fontFamily: 'JetBrains Mono' }}>
                      {habitSubs.length > 0 ? `${doneSubs}/${habitSubs.length} sub-ticks (${subPct}%)` : 'Daily'}
                    </span>
                  </div>

                  {/* Colorful Green Subtask Progress Bar */}
                  {habitSubs.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div 
                        role="progressbar"
                        aria-valuenow={subPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progress for ${h.title}: ${doneSubs} of ${habitSubs.length} completed`}
                        style={{
                          height: '6px',
                          background: 'var(--border-main)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div style={{
                          width: `${subPct}%`,
                          height: '100%',
                          background: subPct === 100
                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%)'
                            : 'linear-gradient(90deg, #0ea5a4 0%, #10b981 100%)',
                          boxShadow: doneSubs > 0 ? '0 0 8px rgba(16, 185, 129, 0.45)' : 'none',
                          borderRadius: '3px',
                          transition: 'width 0.35s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {habitSubs.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {habitSubs.map(st => (
                        <button
                          key={st.id}
                          onClick={() => handleDashboardSubtaskToggle(h.id, st.id)}
                          role="checkbox"
                          aria-checked={st.completed}
                          aria-label={`Subtask ${st.title} (${st.completed ? 'completed' : 'pending'})`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid',
                            borderColor: st.completed ? 'var(--color-green)' : 'var(--border-main)',
                            background: st.completed ? 'var(--color-green-subtle)' : 'var(--bg-card)',
                            color: st.completed ? 'var(--color-green)' : 'var(--text-main)',
                            fontSize: '0.78rem',
                            fontWeight: st.completed ? '600' : '400',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '3px',
                            background: st.completed ? 'var(--color-green)' : 'transparent',
                            border: st.completed ? 'none' : '1.5px solid var(--border-hover)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            margin: 0,
                            flexShrink: 0
                          }}>
                            {st.completed && <Check size={10} color="#ffffff" strokeWidth={3.5} style={{ display: 'block' }} />}
                          </span>
                          <span>{st.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================== TWO COLUMN ==================== */}
      <section className="rv-cols">
        {/* Left: Due for review */}
        <div>
          <div className="rv-section-head">
            <h2 className="font-serif">Due for review</h2>
            <button className="link" onClick={() => onNavigate('tasks')}>
              See all <ArrowRight size={13} />
            </button>
          </div>

          <div className="rv-review-list">
            {dueReviews.length > 0 ? (
              dueReviews.slice(0, 4).map((item, idx) => {
                const diff = (item.difficulty || 'Medium').toLowerCase();
                const diffClass = diff === 'easy' ? 'badge-easy' : diff === 'hard' ? 'badge-hard' : 'badge-medium';
                const recallPercent = Math.max(30, Math.min(95, 100 - (idx * 15)));

                return (
                  <div key={item.id || idx} className="rv-review-item">
                    <div className={`rv-tick ${idx === 0 ? 'overdue' : ''}`}>
                      {idx === 0 ? 'overdue' : 'today'}
                    </div>
                    <div className="rv-review-body">
                      <div className="rv-review-title">{item.problemTitle || item.title}</div>
                      <div className="rv-review-meta">
                        <span>{item.topic || item.category || 'DSA'}</span>
                        <span>·</span>
                        <span>{item.platform || 'LeetCode'}</span>
                        <span className={`badge ${diffClass}`}>{item.difficulty || 'Medium'}</span>
                      </div>
                    </div>
                    <div className="rv-recall">
                      <div className="bar">
                        <div className="fill" style={{ width: `${recallPercent}%` }}></div>
                      </div>
                      <div className="cap">
                        <span>recall</span>
                        <span>{recallPercent}%</span>
                      </div>
                    </div>
                    <button 
                      className="rv-review-btn"
                      onClick={() => onStartReview(item)}
                    >
                      Review
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={28} color="var(--accent-emerald)" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '4px' }}>
                  No reviews are due — you're all caught up! 🎉
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  {trackedProblems > 0
                    ? 'Your spaced repetition schedule is clear for today.'
                    : 'Add problems to your library and review them to start building recall schedules.'
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: This month progress */}
        <div>
          <div className="rv-section-head">
            <h2 className="font-serif">This month</h2>
            <button className="link" onClick={() => onNavigate('goals')}>Manage</button>
          </div>

          <div className="rv-month">
            {categories.length > 0 ? (
              <>
                {categories.map((cat, idx) => {
                  const name = cat.category || cat.name || `Target ${idx + 1}`;
                  const completed = cat.completedCount ?? cat.completed ?? 0;
                  const target = cat.targetCount ?? cat.target ?? 0;
                  const colorCycle = ['var(--color-blue)', 'var(--color-purple)', 'var(--color-green)'];

                  return (
                    <ProgressBar
                      key={idx}
                      value={completed}
                      max={target}
                      label={name}
                      valueLabel={`${completed} / ${target}`}
                      color={colorCycle[idx % colorCycle.length]}
                    />
                  );
                })}

                {(() => {
                  const totalTarget = categories.reduce((acc, c) => acc + (c.targetCount ?? c.target ?? 0), 0);
                  const totalCompleted = categories.reduce((acc, c) => acc + (c.completedCount ?? c.completed ?? 0), 0);
                  const remaining = totalTarget - totalCompleted;
                  const pace = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : 0;
                  return (
                    <div style={{
                      marginTop: '4px',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <Sparkles size={15} color="var(--accent-purple)" />
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        {remaining > 0
                          ? <>{remaining} remaining · <b style={{ color: 'var(--text-serif-title)' }}>{pace}/day pace needed</b></>
                          : <b style={{ color: 'var(--accent-emerald)' }}>All targets met this month! 🎯</b>
                        }
                      </span>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No monthly goals set yet. <button className="link" onClick={() => onNavigate('goals')} style={{ fontSize: '0.86rem' }}>Set up goals →</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== REVIEW RHYTHM ==================== */}
      <section className="rv-rhythm">
        <div className="rv-section-head">
          <h2 className="font-serif">Your review rhythm</h2>
          <span className="mono-label">SuperMemo-2 · EF 2.5</span>
        </div>
        <div className="rv-stations">
          <div className="rv-station done">
            <div className="dot"></div>
            <div className="iv">1d</div>
            <div className="lb">Encode</div>
          </div>
          <div className="rv-station done">
            <div className="dot"></div>
            <div className="iv">3d</div>
            <div className="lb">Consolidate</div>
          </div>
          <div className="rv-station">
            <div className="dot"></div>
            <div className="iv">7d</div>
            <div className="lb">Store</div>
          </div>
          <div className="rv-station">
            <div className="dot"></div>
            <div className="iv">14d</div>
            <div className="lb">Retain</div>
          </div>
          <div className="rv-station">
            <div className="dot"></div>
            <div className="iv">30d</div>
            <div className="lb">Master</div>
          </div>
        </div>
      </section>
    </div>
  );
}
