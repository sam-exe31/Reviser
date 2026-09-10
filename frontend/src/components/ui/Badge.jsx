import React from 'react';

/**
 * Badge over the theme's `.badge` classes.
 *   tone  one of the defined `.badge-*` modifiers:
 *         'cyan' | 'purple' | 'parchment' | 'easy' | 'medium' | 'hard'
 */
export default function Badge({ tone = 'cyan', children, className = '', style, ...rest }) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()} style={style} {...rest}>
      {children}
    </span>
  );
}
