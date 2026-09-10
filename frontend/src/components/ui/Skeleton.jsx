import React from 'react';

/**
 * Shimmer placeholder using the theme's `.skeleton` class (shimmer keyframe +
 * reduced-motion aware). Use while data loads to avoid a flash of empty/zero UI.
 */
export default function Skeleton({ width = '100%', height = 16, radius = 'var(--radius-sm)', style }) {
  return <div className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Convenience: N stacked skeleton lines (last one shortened). */
export function SkeletonText({ lines = 3, gap = 8, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}
