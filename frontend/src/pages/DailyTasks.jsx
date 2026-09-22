import React, { useState, useEffect } from 'react';
import { RotateCcw, Brain, CheckSquare, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import DailyTodoList from '../components/DailyTodoList';

export default function DailyTasks({ onStartReview, onNavigateToChat, onNavigateToLibrary }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rollingOver, setRollingOver] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTodayOverview();
      setOverview(data);
    } catch (err) {
      console.error('Error fetching today tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleRollover = async () => {
    setRollingOver(true);
    try {
      const res = await api.rolloverMissed();
      alert(`Successfully rolled over ${res.rolledOverCount || 0} missed tasks from yesterday into today's schedule.`);
      loadTasks();
    } catch (err) {
      alert('Error rolling over tasks: ' + err.message);
    } finally {
      setRollingOver(false);
    }
  };

  const tasks = overview?.tasks || [];

  return (
    <div className="rv-container">
      {/* Editorial Header */}
      <header className="rv-hero" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="rv-eyebrow">Daily Execution &amp; Spaced Recalls</div>
            <h1 className="rv-greet font-serif" style={{ fontSize: '2.2rem' }}>
              Today's <em>Schedule</em>
            </h1>
            <p className="rv-sub" style={{ marginTop: '6px' }}>
              Execute your daily slice of DSA problems, review theory, and complete SM-2 recalls to solidify long-term retention.
            </p>
          </div>

          <button
            onClick={handleRollover}
            disabled={rollingOver}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
          >
            <RotateCcw size={14} className={rollingOver ? 'animate-spin' : ''} />
            <span>{rollingOver ? 'Rolling Over...' : 'Rollover Yesterday'}</span>
          </button>
        </div>
      </header>

      {/* Main Todo List */}
      <DailyTodoList
        onNavigateToChat={onNavigateToChat}
        onNavigateToLibrary={onNavigateToLibrary}
        onStartReview={onStartReview}
      />
    </div>
  );
}
