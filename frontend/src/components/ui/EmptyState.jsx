import React from 'react';

/**
 * Centered empty / zero-data state.
 *   icon         lucide icon component shown in a tinted chip
 *   title        short headline
 *   description  supporting line
 *   action       node (e.g. a <Button/>) rendered below
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
    }}>
      {Icon && (
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card-inset)',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={22} />
        </div>
      )}
      {title && (
        <div className="font-serif" style={{ fontSize: '1.05rem', color: 'var(--text-serif-title)' }}>
          {title}
        </div>
      )}
      {description && (
        <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
