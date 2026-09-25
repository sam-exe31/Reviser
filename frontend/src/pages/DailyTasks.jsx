import React, { useState, useEffect } from 'react';
import { Brain, CheckSquare, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import DailyTodoList from '../components/DailyTodoList';

export default function DailyTasks({ onStartReview, onNavigateToChat, onNavigateToLibrary }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const tasks = overview?.tasks || [];

  return (
    <div className="rv-container">
      {/* Editorial Header */}
      <header className="rv-hero" style={{ marginBottom: '24px' }}>
        <div>
          <div className="rv-eyebrow">Daily Execution &amp; Spaced Recalls</div>
          <h1 className="rv-greet font-serif" style={{ fontSize: '2.2rem' }}>
            Today's <em>Schedule</em>
          </h1>
          <p className="rv-sub" style={{ marginTop: '6px' }}>
            Execute your daily slice of DSA problems, review theory, and complete SM-2 recalls to solidify long-term retention.
          </p>
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
