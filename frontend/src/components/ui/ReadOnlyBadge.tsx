import React from 'react';
import { EyeOff } from 'lucide-react';

export default function ReadOnlyBadge() {
  return (
    <span 
      className="inline-flex items-center justify-center text-text-muted ml-2 align-middle opacity-80"
      title="View Only"
    >
      <EyeOff size={14} />
    </span>
  );
}
