import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface GlobalBlockerScreenProps {
  message: string;
}

export default function GlobalBlockerScreen({ message }: GlobalBlockerScreenProps) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(18, 2, 2, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        boxSizing: 'border-box',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      <style>{`
        @keyframes pulse-neon {
          0% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));
          }
          50% {
            transform: scale(1.08);
            filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.9));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.6));
          }
        }
        .neon-warning-icon {
          animation: pulse-neon 2s infinite ease-in-out;
        }
      `}</style>
      
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: '600px',
          gap: '1.5rem',
        }}
      >
        <div 
          className="neon-warning-icon"
          style={{
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid #ef4444',
            borderRadius: '50%',
            padding: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <ShieldAlert size={64} />
        </div>
        
        <h1 
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: 0,
            textTransform: 'uppercase',
            color: '#ef4444',
            textShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
          }}
        >
          System Lockdown
        </h1>
        
        <div 
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '1.5rem 2rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <p 
            style={{
              fontSize: '1.15rem',
              lineHeight: '1.6',
              margin: 0,
              color: '#f87171',
              fontWeight: 500,
            }}
          >
            {message || 'An emergency system-wide broadcast has locked active nodes.'}
          </p>
        </div>
        
        <p 
          style={{
            color: 'rgba(156, 163, 175, 0.8)',
            fontSize: '0.875rem',
            marginTop: '1rem',
          }}
        >
          All operations are temporarily suspended. Please contact your Tier 0 Administrator for resolution details.
        </p>
      </div>
    </div>
  );
}
