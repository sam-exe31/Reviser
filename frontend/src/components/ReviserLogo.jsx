import React from 'react';

export default function ReviserLogo({ size = 32, className = '', glow = false }) {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: glow ? '0 3px 12px rgba(14,165,164,0.3)' : '0 1px 4px rgba(0,0,0,0.1)'
      }}
    >
      <img
        src="./icon.png"
        alt="Reviser Logo"
        width={size}
        height={size}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </div>
  );
}
