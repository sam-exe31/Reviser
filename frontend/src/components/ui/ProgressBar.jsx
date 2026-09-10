import React from 'react';

/**
 * Progress bar reusing the theme's `.rv-progline` markup (label row + track +
 * fill). The fill carries `.progress-fill` so the motion system animates its
 * width when data loads. Pass `bare` to render just the track (no label row),
 * e.g. inside a table cell or compact card.
 *
 *   value / max   numeric progress (clamped 0–100%)
 *   label         left-hand name in the top row
 *   valueLabel    right-hand mono value in the top row (e.g. "12 / 20")
 *   color         fill color (default teal accent)
 *   height        track height in px (default 5)
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  color = 'var(--color-blue)',
  height = 5,
  bare = false,
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const track = (
    <div className="track" style={{ height, background: 'var(--bg-card-inset)', borderRadius: 2, overflow: 'hidden' }}>
      <div className="progress-fill fill" style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  );

  if (bare) return track;

  return (
    <div className="rv-progline">
      {(label || valueLabel) && (
        <div className="top">
          {label && <span className="name">{label}</span>}
          {valueLabel && <span className="val">{valueLabel}</span>}
        </div>
      )}
      {track}
    </div>
  );
}
