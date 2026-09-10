import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  History,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function ProblemLibrary({ onStartReview, onOpenAddModal, onViewHistory }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');

  const loadProblems = async () => {
    setLoading(true);
    try {
      const list = await api.getProblems();
      setProblems(list || []);
    } catch (err) {
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteProblem(id);
      loadProblems();
    } catch (err) {
      alert('Error deleting problem: ' + err.message);
    }
  };

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.topic && p.topic.toLowerCase().includes(search.toLowerCase()));
    const matchDiff = difficultyFilter === 'ALL' || (p.difficulty && p.difficulty.toUpperCase() === difficultyFilter);
    const matchPlat = platformFilter === 'ALL' || (p.platform && p.platform.toUpperCase() === platformFilter);
    return matchSearch && matchDiff && matchPlat;
  });

  return (
    <div className="rv-container">
      {/* Editorial Header */}
      <header className="rv-hero" style={{ marginBottom: '24px' }}>
        <div className="rv-eyebrow">Repository &amp; Spaced Schedule</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="rv-greet font-serif" style={{ fontSize: '2.2rem' }}>
              Problem <em>Bank</em>
            </h1>
            <p className="rv-sub" style={{ marginTop: '6px' }}>
              All registered practice problems and topics tracked by the SM-2 algorithm.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={async () => {
                try {
                  await api.seedProblems();
                  loadProblems();
                  alert('✓ Successfully loaded 21 classic starter revision problems into your bank!');
                } catch (err) {
                  alert('Error seeding problems: ' + err.message);
                }
              }}
              className="btn-secondary"
              style={{ fontSize: '0.82rem' }}
              title="Load 21 curated Blind 75 / Core CS problems"
            >
              <Sparkles size={14} color="var(--accent-purple)" />
              <span>Load 21 Starters</span>
            </button>
            <button onClick={onOpenAddModal} className="btn-primary" style={{ fontSize: '0.82rem' }}>
              <Plus size={15} />
              <span>Add Problem</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          minWidth: '220px',
          background: 'var(--bg-card-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px'
        }}>
          <Search size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search problems by title, pattern or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-serif-title)',
              fontSize: '0.86rem',
              width: '100%'
            }}
          />
        </div>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="form-input"
          style={{ width: '140px', padding: '6px 10px', fontSize: '0.82rem' }}
        >
          <option value="ALL">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="form-input"
          style={{ width: '130px', padding: '6px 10px', fontSize: '0.82rem' }}
        >
          <option value="ALL">All Platforms</option>
          <option value="LEETCODE">LeetCode</option>
          <option value="NEETCODE">NeetCode</option>
          <option value="GFG">GFG</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* Hairline Problem Table / List */}
      <div className="rv-review-list" style={{ boxShadow: 'var(--shadow-card)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading problem bank...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No problems found matching your search. Click "Add Problem" or "Load 21 Starters" above!
          </div>
        ) : (
          filtered.map((problem) => {
            const diff = (problem.difficulty || 'Medium').toLowerCase();
            const diffClass = diff === 'easy' ? 'badge-easy' : diff === 'hard' ? 'badge-hard' : 'badge-medium';

            return (
              <div key={problem.id} className="rv-review-item">
                <div className="rv-tick">
                  {problem.intervalDays ? `${problem.intervalDays}d` : '1d'}
                </div>

                <div className="rv-review-body">
                  <div className="rv-review-title">{problem.title}</div>
                  <div className="rv-review-meta">
                    <span>{problem.topic || 'General'}</span>
                    <span>·</span>
                    <span>{problem.platform || 'LeetCode'}</span>
                    <span className={`badge ${diffClass}`}>{problem.difficulty || 'Medium'}</span>
                    {problem.easeFactor && (
                      <span className="sm2-tag">EF {problem.easeFactor.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="rv-recall">
                  <div className="bar">
                    <div className="fill" style={{ width: `${Math.min(100, Math.max(30, Math.round((problem.easeFactor || 2.5) * 35)))}%` }}></div>
                  </div>
                  <div className="cap">
                    <span>stability</span>
                    <span>{Math.min(100, Math.max(30, Math.round((problem.easeFactor || 2.5) * 35)))}%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => onStartReview && onStartReview(problem)}
                    className="rv-review-btn"
                  >
                    Review
                  </button>

                  <button
                    onClick={() => onViewHistory && onViewHistory(problem)}
                    className="btn-icon"
                    title="View SRS Retention History"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <History size={14} />
                  </button>

                  <button
                    onClick={() => handleDelete(problem.id, problem.title)}
                    className="btn-icon"
                    title="Delete Problem"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Trash2 size={14} color="var(--text-dim)" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
