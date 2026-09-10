import React, { useState, useEffect } from 'react';
import { 
  History, 
  Sparkles, 
  Brain, 
  Clock, 
  CheckCircle2, 
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryInsights({ initialProblem }) {
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState(initialProblem ? (initialProblem.problemId || initialProblem.id) : '');
  const [reviews, setReviews] = useState([]);
  const [aiInsight, setAiInsight] = useState('');
  const [reviewState, setReviewState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    api.getProblems().then((list) => {
      setProblems(list || []);
      if (!selectedId && list && list.length > 0) {
        setSelectedId(list[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    setLoading(true);
    setAiInsight('');

    Promise.all([
      api.getReviewHistory(selectedId).catch(() => []),
      api.getReviewState(selectedId).catch(() => null),
    ]).then(([historyList, stateData]) => {
      setReviews(historyList || []);
      setReviewState(stateData);
    }).finally(() => {
      setLoading(false);
    });
  }, [selectedId]);

  const handleFetchInsight = async () => {
    if (!selectedId) return;
    setLoadingAi(true);
    try {
      const res = await api.getProblemAiInsight(selectedId);
      setAiInsight(res.insight || 'No insight available.');
    } catch (err) {
      setAiInsight('Failed to fetch AI insight: ' + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const selectedProblem = problems.find(p => String(p.id) === String(selectedId));

  return (
    <div className="rv-container">
      {/* Editorial Header */}
      <header className="rv-hero" style={{ marginBottom: '24px' }}>
        <div className="rv-eyebrow">Retention Analytics &amp; SM-2 Logs</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="rv-greet font-serif" style={{ fontSize: '2.2rem' }}>
              Review <em>Insights</em>
            </h1>
            <p className="rv-sub" style={{ marginTop: '6px' }}>
              Inspect review history logs, memory ease factors, and Gemini AI retention diagnostics.
            </p>
          </div>

          <select
            className="form-input"
            style={{ width: '260px', fontSize: '0.84rem' }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {problems.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.difficulty || 'Medium'})
              </option>
            ))}
          </select>
        </div>
      </header>

      {selectedProblem ? (
        <div className="rv-cols">
          {/* Left: Review Timeline */}
          <div>
            <div className="rv-section-head">
              <h2 className="font-serif">Review Timeline</h2>
              <span className="mono-label">{reviews.length} Sessions Logged</span>
            </div>

            {/* Current State Stats Panel */}
            {reviewState && (
              <div className="rv-glance" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '16px' }}>
                <div className="rv-glance-cell">
                  <div className="rv-glance-num">
                    {reviewState.intervalDays || 1} <small>days</small>
                  </div>
                  <div className="rv-glance-cap">Current Interval</div>
                </div>
                <div className="rv-glance-cell">
                  <div className="rv-glance-num" style={{ color: 'var(--accent-cyan)' }}>
                    {reviewState.easeFactor ? reviewState.easeFactor.toFixed(2) : '2.50'}
                  </div>
                  <div className="rv-glance-cap">Ease Factor</div>
                </div>
                <div className="rv-glance-cell">
                  <div className="rv-glance-num" style={{ color: 'var(--accent-emerald)', fontSize: '1.4rem', paddingTop: '6px' }}>
                    {reviewState.nextReviewDate || 'Today'}
                  </div>
                  <div className="rv-glance-cap">Next Scheduled Due</div>
                </div>
              </div>
            )}

            {/* Timeline Items */}
            <div className="rv-review-list">
              {reviews.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No past review sessions recorded for this problem yet. Rate your first review when ready!
                </div>
              ) : (
                reviews.map((rev, idx) => (
                  <div key={rev.id || idx} className="rv-review-item">
                    <div className="rv-tick">
                      {rev.intervalDays ? `${rev.intervalDays}d` : '1d'}
                    </div>

                    <div className="rv-review-body">
                      <div className="rv-review-title">
                        Confidence {rev.confidenceRating || rev.confidence || 4} / 5
                      </div>
                      <div className="rv-review-meta">
                        <span>{new Date(rev.reviewDate || rev.createdAt || Date.now()).toLocaleDateString()}</span>
                        {rev.notes && (
                          <>
                            <span>·</span>
                            <span>"{rev.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sm2-tag">
                      EF {rev.easeFactor ? rev.easeFactor.toFixed(2) : '2.50'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: AI Retention Diagnostic Card */}
          <div>
            <div className="rv-section-head">
              <h2 className="font-serif">AI Memory Insight</h2>
              <span className="mono-label" style={{ color: 'var(--accent-purple)' }}>Gemini</span>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-main)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--shadow-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-serif-title)' }}>
                  {selectedProblem.title}
                </span>
              </div>

              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                {aiInsight || 'Click the button below to generate a real-time spaced repetition diagnostic on retention decay and optimal next intervals.'}
              </p>

              <button
                onClick={handleFetchInsight}
                disabled={loadingAi}
                className="btn-purple"
                style={{ alignSelf: 'flex-start', fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <Sparkles size={14} />
                <span>{loadingAi ? 'Analyzing Retention...' : 'Generate AI Retention Insight'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Select or add a problem to inspect recall analytics.
        </div>
      )}
    </div>
  );
}
