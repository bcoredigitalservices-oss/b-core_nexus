import React from 'react';
import { EyeOff } from 'lucide-react';

export default function ReadOnlyBadge() {
  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginLeft: '8px',
        verticalAlign: 'middle',
        opacity: 0.8
      }}
      title="View Only"
    >
      <EyeOff size={14} />
    </span>
  );
}
