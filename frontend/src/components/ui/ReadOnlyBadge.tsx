import React from 'react';

export default function ReadOnlyBadge() {
  return (
    <span 
      style={{
        fontSize: '9px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        backgroundColor: '#1F2937',
        color: '#9CA3AF',
        padding: '2px 6px',
        borderRadius: '4px',
        marginLeft: '8px',
        fontWeight: 700,
        display: 'inline-block',
        verticalAlign: 'middle',
        lineHeight: 1
      }}
    >
      View Only
    </span>
  );
}
