import React from 'react';

/**
 * Card wrapper over the theme's card systems.
 *   variant  undefined → `.rv-curve-card` (neutral card)
 *            'blue' | 'green' | 'amber' | 'purple' → `.box-*` accent-bordered card
 *   hover    adds `.lift` for the motion-system hover lift
 *
 * NB: `.box-*` set border/background with `!important`, so don't pass a
 * competing inline border when using an accent variant.
 */
export default function Card({
  as: Tag = 'div',
  variant,
  hover = false,
  className = '',
  style,
  children,
  ...rest
}) {
  const variantClass = variant ? `box-${variant}` : 'rv-curve-card';
  const classes = [variantClass, hover ? 'lift' : '', className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
}
