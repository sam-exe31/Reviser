import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { Modal, Button } from './ui';

export default function ReviewModal({ problem, onClose, onReviewSubmitted }) {
  const [confidence, setConfidence] = useState(4);
  const [solvedWithoutHelp, setSolvedWithoutHelp] = useState(true);
  const [neededHint, setNeededHint] = useState(false);
  const [rememberedPattern, setRememberedPattern] = useState(true);
  const [couldExplainSolution, setCouldExplainSolution] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!problem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.recordReview(problem.problemId || problem.id, {
        confidence,
        solvedWithoutHelp,
        neededHint,
        rememberedPattern,
        couldExplainSolution,
        notes
      });

      try {
        await api.completeTask(problem.problemId || problem.id, problem.category || 'DSA');
      } catch (_) {}

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#0ea5a4', '#059669', '#d97706']
      });

      onReviewSubmitted();
      onClose();
    } catch (err) {
      alert('Error recording review: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const confidenceLabels = [
    { value: 1, label: '1 · Blackout', color: 'var(--accent-rose)', desc: 'Could not recall approach' },
    { value: 2, label: '2 · Struggle', color: 'var(--accent-coral)', desc: 'Needed complete solution' },
    { value: 3, label: '3 · Hints', color: 'var(--accent-amber)', desc: 'Recalled core with small nudge' },
    { value: 4, label: '4 · Solid Recall', color: 'var(--accent-emerald)', desc: 'Solved cleanly with minor pause' },
    { value: 5, label: '5 · Instant Mastery', color: 'var(--accent-cyan)', desc: 'Optimal solution effortlessly' },
  ];

  return (
    <Modal
      onClose={onClose}
      icon={BookOpen}
      eyebrow="SM-2 Spaced Repetition Session"
      title={problem.problemTitle || problem.title}
    >
      <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Quality / Confidence Buttons (1-5) */}
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '8px' }}>
            Recall Strength / Quality Score
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {confidenceLabels.map(item => {
              const isSelected = confidence === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setConfidence(item.value)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isSelected ? item.color : 'var(--border-main)',
                    background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: item.color }}>
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Checkbox Invariants */}
        <div style={{
          background: 'var(--bg-card-inset)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={solvedWithoutHelp}
              onChange={(e) => setSolvedWithoutHelp(e.target.checked)}
            />
            <span>Solved without help</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={rememberedPattern}
              onChange={(e) => setRememberedPattern(e.target.checked)}
            />
            <span>Recalled optimal pattern</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={neededHint}
              onChange={(e) => setNeededHint(e.target.checked)}
            />
            <span>Needed minor hint</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={couldExplainSolution}
              onChange={(e) => setCouldExplainSolution(e.target.checked)}
            />
            <span>Can articulate trade-offs</span>
          </label>
        </div>

        {/* Review Notes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
            Recall Notes &amp; Edge Cases (Optional)
          </label>
          <textarea
            rows={3}
            className="form-input"
            placeholder="e.g. Remember to check if complement exists before putting in map..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: 'none', fontSize: '0.84rem' }}
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ fontSize: '0.84rem' }}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} style={{ fontSize: '0.84rem' }}>
            {submitting ? 'Calculating Interval...' : 'Save & Update SM-2 Interval'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
