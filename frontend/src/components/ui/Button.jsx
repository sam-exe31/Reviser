import React from 'react';

// Map semantic variants onto the theme button classes that actually exist.
// (There is no `.btn-danger`/`.btn-ghost` in theme.css, so danger reuses the
//  secondary shell with a rose tint applied inline.)
const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  icon: 'btn-icon',
  danger: 'btn-secondary',
};

/**
 * Thin wrapper over the theme's `.btn-*` classes.
 *   variant  'primary' | 'secondary' | 'icon' | 'danger'
 *   loading  shows a spinner (via `.animate-spin`) and disables the button
 *   icon     lucide icon component rendered before the label
 */
export default function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: Icon,
  children,
  className = '',
  style,
  ...rest
}) {
  const base = VARIANT_CLASS[variant] || 'btn-primary';
  const isDisabled = disabled || loading;
  const dangerStyle = variant === 'danger'
    ? { color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }
    : null;

  return (
    <button
      className={`${base} ${className}`.trim()}
      disabled={isDisabled}
      style={{
        opacity: isDisabled ? 0.55 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...dangerStyle,
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span
          className="animate-spin"
          aria-hidden="true"
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
          }}
        />
      ) : (
        Icon && <Icon size={15} />
      )}
      {children && <span>{children}</span>}
    </button>
  );
}
