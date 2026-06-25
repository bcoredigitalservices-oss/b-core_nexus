import React from 'react';
import { Terminal } from 'lucide-react';
import CommandCenter from '../../components/admin/CommandCenter';

export default function EventEngineDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(157, 78, 221, 0.05) 100%)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
          <div 
            style={{
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
              borderRadius: '12px',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Terminal size={28} color="var(--accent-blue)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem', fontWeight: 700 }}>
              Event Engine Control
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Broadcast events and inspect system message backplanes.
            </p>
          </div>
        </div>
      </div>

      <CommandCenter />
      
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Live Audit Stream & IP Tracking</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time event logs and audit streams will display here. IP geolocations and routing headers are tracked automatically.
        </p>
      </div>
    </div>
  );
}
