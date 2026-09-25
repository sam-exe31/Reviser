import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  History,
  BookOpen,
  Download
} from 'lucide-react';
import { api } from '../services/api';

// One-tap SM-2 grade buttons (Soft Sky). Easy = teal (recalled well, schedule
// later), Medium = amber (normal spacing), Hard = rose (struggled, sooner).
const QUICK_GRADE_STYLES = {
  easy:   { label: 'Easy', color: 'var(--color-green)', bg: 'var(--color-green-subtle)', border: 'rgba(47,156,147,0.35)', title: 'Easy — recalled it well; schedule further out' },
  medium: { label: 'Med',  color: 'var(--color-amber)', bg: 'var(--color-amber-subtle)', border: 'rgba(213,154,58,0.35)', title: 'Medium — some effort; keep normal spacing' },
  hard:   { label: 'Hard', color: 'var(--accent-rose)', bg: 'rgba(209,96,122,0.12)',      border: 'rgba(209,96,122,0.35)', title: 'Hard — struggled; bring it back sooner' },
};

function quickGradeBtnStyle(grade, disabled) {
  const s = QUICK_GRADE_STYLES[grade];
  return {
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    color: s.color,
    background: s.bg,
    border: `1px solid ${s.border}`,
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease'
  };
}

export default function ProblemLibrary({ onStartReview, onOpenAddModal, onViewHistory }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [lcUsername, setLcUsername] = useState(() => localStorage.getItem('reviser_leetcode_username') || '');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

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

  // Pull the user's most recent accepted LeetCode solves and add the new ones to
  // the bank. recentAcSubmissionList only returns title/slug, so the backend
  // enriches each with real difficulty + number from the public problem index.
  const handleImportRecent = async () => {
    const username = lcUsername.trim();
    if (!username) {
      setImportMsg('Enter your LeetCode username first.');
      return;
    }
    localStorage.setItem('reviser_leetcode_username', username);
    setImporting(true);
    setImportMsg('Fetching your recent solved problems from LeetCode…');
    try {
      const recent = await api.getLeetCodeRecent(username, 50);
      if (!recent || recent.length === 0) {
        setImportMsg(`No public accepted submissions found for "${username}". Make sure the profile is public.`);
        return;
      }
      // Dedup against titles already in the bank (case-insensitive).
      const existing = new Set(problems.map((p) => (p.title || '').trim().toLowerCase()));
      let added = 0;
      let skipped = 0;
      for (const sub of recent) {
        const title = (sub.title || '').trim();
        if (!title) continue;
        if (existing.has(title.toLowerCase())) { skipped++; continue; }
        try {
          await api.createProblem({
            title,
            platform: 'LeetCode',
            difficulty: sub.difficulty || 'Medium',
            pattern: sub.problemNumber ? `LC #${sub.problemNumber}` : 'Imported',
          });
          existing.add(title.toLowerCase());
          added++;
        } catch (e) {
          // One bad row shouldn't abort the whole import.
          console.error('Failed to import', title, e);
        }
      }
      await loadProblems();
      setImportMsg(`✓ Imported ${added} new problem${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} already in your bank` : ''}.`);
    } catch (err) {
      setImportMsg('Import failed: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteProblem(id);
      loadProblems();
    } catch (err) {
      alert('Error deleting problem: ' + err.message);
    }
  };

  // One-tap SM-2 reschedule straight from the bank — no full review modal.
  // Hard brings the problem back sooner, Easy pushes it further out; the row's
  // interval + stability update on reload so the change is visible immediately.
  const [gradingId, setGradingId] = useState(null);
  const handleQuickGrade = async (problem, grade) => {
    if (gradingId) return;
    setGradingId(problem.id);
    try {
      await api.gradeProblem(problem.id, grade);
      await loadProblems();
      // Nudge the dashboard / daily revision panel to refresh streak + picks.
      window.dispatchEvent(new CustomEvent('reviser:todos-changed'));
    } catch (err) {
      alert('Could not reschedule: ' + err.message);
    } finally {
      setGradingId(null);
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

      {/* LeetCode recent-solved importer */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-main)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-serif-title)', fontWeight: 600, fontSize: '0.86rem' }}>
          <Download size={15} color="var(--accent-purple)" />
          <span>Import from LeetCode</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-card-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 12px',
          minWidth: '200px'
        }}>
          <input
            type="text"
            placeholder="your LeetCode username"
            value={lcUsername}
            onChange={(e) => setLcUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !importing) handleImportRecent(); }}
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
        <button
          onClick={handleImportRecent}
          disabled={importing}
          className="btn-secondary"
          style={{ fontSize: '0.82rem', opacity: importing ? 0.6 : 1, cursor: importing ? 'default' : 'pointer' }}
          title="Fetch your 50 most recent accepted problems and add the new ones to your bank"
        >
          <Download size={14} />
          <span>{importing ? 'Importing…' : 'Import recent 50 solved'}</span>
        </button>
        {importMsg && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1, minWidth: '160px' }}>{importMsg}</span>
        )}
      </div>

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {['easy', 'medium', 'hard'].map((g) => (
                      <button
                        key={g}
                        onClick={() => handleQuickGrade(problem, g)}
                        disabled={gradingId === problem.id}
                        style={quickGradeBtnStyle(g, gradingId === problem.id)}
                        title={QUICK_GRADE_STYLES[g].title}
                        aria-label={`${QUICK_GRADE_STYLES[g].label} — reschedule ${problem.title}`}
                      >
                        {QUICK_GRADE_STYLES[g].label}
                      </button>
                    ))}
                  </div>

                  <span style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', flexShrink: 0 }} />

                  <button
                    onClick={() => onStartReview && onStartReview(problem)}
                    className="rv-review-btn"
                    title="Open the full review form to log details"
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
