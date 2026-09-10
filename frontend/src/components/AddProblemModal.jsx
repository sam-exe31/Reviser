import React, { useState } from 'react';
import { Plus, BookPlus } from 'lucide-react';
import { api } from '../services/api';
import { Modal, Button } from './ui';

export default function AddProblemModal({ onClose, onProblemAdded }) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [difficulty, setDifficulty] = useState('Medium');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.createProblem({
        title: title.trim(),
        platform: platform.trim(),
        difficulty,
        topic: topic.trim() || 'General'
      });
      onProblemAdded();
      onClose();
    } catch (err) {
      alert('Failed to add problem: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const platforms = ['LeetCode', 'NeetCode', 'Codeforces', 'GeeksForGeeks', 'Other'];
  const popularPatterns = ['Sliding Window', 'Two Pointers', 'Dynamic Programming', 'Binary Search', 'Trees', 'Graphs', 'Monotonic Stack', 'Intervals', 'DBMS', 'OS'];

  return (
    <Modal onClose={onClose} icon={BookPlus} eyebrow="Registration" title="Add Problem to Bank">
      <form onSubmit={handleSubmit} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
            Problem Title *
          </label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="e.g. Course Schedule (Topological Sort)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Platform & Difficulty Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
              Platform
            </label>
            <select
              className="form-input"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
              Difficulty
            </label>
            <select
              className="form-input"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy (Green)</option>
              <option value="Medium">Medium (Amber)</option>
              <option value="Hard">Hard (Rose)</option>
            </select>
          </div>
        </div>

        {/* Topic / Pattern */}
        <div>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-serif-title)', marginBottom: '6px' }}>
            Pattern / Subject Tag
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Graphs / Topological Sort"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          {/* Suggested Pattern Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {popularPatterns.map(pat => (
              <button
                key={pat}
                type="button"
                onClick={() => setTopic(pat)}
                className="glass-pill"
                style={{
                  fontSize: '0.72rem',
                  border: topic === pat ? '1px solid var(--accent-cyan)' : '1px solid var(--border-main)',
                  color: topic === pat ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}
              >
                {pat}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button type="button" variant="secondary" onClick={onClose} style={{ fontSize: '0.84rem' }}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} icon={Plus} style={{ fontSize: '0.84rem' }}>
            {submitting ? 'Registering...' : 'Add to Bank'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
