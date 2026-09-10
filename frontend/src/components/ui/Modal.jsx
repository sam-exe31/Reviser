import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Canonical modal used across the app.
 *
 * Reuses the theme's `.modal-overlay` / `.modal-container` classes (which carry
 * the fadeIn / scaleIn open animation from the motion system) and adds the
 * behaviour every hand-rolled overlay was missing: backdrop-click + Escape to
 * close, focus moved into the dialog on open, focus returned to the previously
 * focused element on close, and background scroll lock.
 *
 * Props:
 *   isOpen           render gate (default true so `{open && <Modal/>}` works too)
 *   onClose          called on backdrop click, Escape, and the × button
 *   title            heading text (string) or node
 *   eyebrow          small mono-label above the title
 *   icon             lucide icon component rendered in a tinted chip
 *   footer           node rendered in the footer action row
 *   maxWidth         container max width (px), default 620
 *   closeOnBackdrop  disable backdrop-click close when false
 */
export default function Modal({
  isOpen = true,
  onClose,
  title,
  eyebrow,
  icon: Icon,
  children,
  footer,
  maxWidth = 620,
  closeOnBackdrop = true,
}) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    previouslyFocused.current = document.activeElement;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Move focus into the dialog: an explicitly [autofocus]-marked field if
    // present, otherwise the container itself (predictable — Escape/Tab still work,
    // and we never trap focus on the × button or toggle a checkbox by surprise).
    const node = containerRef.current;
    if (node) {
      const preferred = node.querySelector('[autofocus]');
      (preferred || node).focus();
    }

    // Lock background scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused.current && previouslyFocused.current.focus) {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={containerRef}
        className="modal-container"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        style={{ maxWidth, outline: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || eyebrow) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-main)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {Icon && (
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-blue-subtle)',
                  color: 'var(--color-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={17} />
                </div>
              )}
              <div>
                {eyebrow && (
                  <div className="mono-label" style={{ color: 'var(--color-blue)' }}>{eyebrow}</div>
                )}
                {title && (
                  <h3 className="font-serif" style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-serif-title)' }}>
                    {title}
                  </h3>
                )}
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="btn-icon" aria-label="Close dialog" style={{ width: 30, height: 30 }}>
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {children}

        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
