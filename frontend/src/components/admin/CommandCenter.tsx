import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Send, Radio, AlertTriangle, Lock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function CommandCenter() {
  const { token, currentUser, isApiLive } = useAppContext();
  const [targetAudience, setTargetAudience] = useState('ALL_SESSIONS');
  const [severity, setSeverity] = useState('WARNING');
  const [message, setMessage] = useState('');
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const COMMAND_CENTER_UUID = '00000000-0000-0000-0000-000000000000';

  useEffect(() => {
    if (!token || !isApiLive) return;

    const connectWs = () => {
      setWsStatus('CONNECTING');
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const wsProto = apiBaseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsHost = apiBaseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProto}://${wsHost}/api/v1/events/ws/${COMMAND_CENTER_UUID}?token=${token}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('CONNECTED');
        console.log('CommandCenter WebSocket connected');
      };

      ws.onmessage = (event) => {
        console.log('CommandCenter message received:', event.data);
      };

      ws.onclose = () => {
        setWsStatus('DISCONNECTED');
        console.log('CommandCenter WebSocket disconnected');
        // Try reconnecting in 5 seconds
        setTimeout(() => {
          if (token) connectWs();
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error('CommandCenter WebSocket error:', err);
      };
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, isApiLive]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!message.trim()) {
      setFeedback({ type: 'error', text: 'Emergency message cannot be empty.' });
      return;
    }

    if (wsStatus !== 'CONNECTED' || !wsRef.current) {
      setFeedback({ type: 'error', text: 'Cannot broadcast: WebSocket is disconnected.' });
      return;
    }

    const payload = {
      event_type: 'blocker_beacon',
      entity_type: 'COMMAND_CENTER',
      payload: {
        target_audience: targetAudience,
        severity: severity,
        message: message,
        email: currentUser?.email || 'unknown@bcore.local',
        name: currentUser?.email ? currentUser.email.split('@')[0] : 'System Admin'
      }
    };

    try {
      wsRef.current.send(JSON.stringify(payload));
      setFeedback({ type: 'success', text: 'Blocker Beacon broadcasted successfully.' });
      setMessage('');
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to send payload over WebSocket.' });
    }
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '0px', 
        overflow: 'hidden',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.04) 0%, rgba(20, 27, 46, 0.6) 100%)',
        boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.03)'
      }}
    >
      <style>{`
        .cc-form-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
          display: block;
          font-weight: 600;
        }
        .cc-select, .cc-textarea {
          width: 100%;
          background: rgba(14, 19, 34, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-color);
          font-size: 0.9rem;
          padding: 0.6rem 0.8rem;
          transition: all 0.2s ease;
        }
        .cc-select:focus, .cc-textarea:focus {
          border-color: rgba(239, 68, 68, 0.5);
          outline: none;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.15);
        }
        .cc-btn-broadcast {
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: white;
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          transition: all 0.2s ease;
        }
        .cc-btn-broadcast:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
          filter: brightness(1.1);
        }
        .cc-btn-broadcast:active:not(:disabled) {
          transform: translateY(1px);
        }
        .cc-btn-broadcast:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        .ws-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .ws-connected {
          background: rgba(0, 245, 160, 0.08);
          border: 1px solid rgba(0, 245, 160, 0.25);
          color: var(--accent-green);
        }
        .ws-connecting {
          background: rgba(157, 78, 221, 0.08);
          border: 1px solid rgba(157, 78, 221, 0.25);
          color: var(--accent-purple);
        }
        .ws-disconnected {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
        }
      `}</style>

      {/* Header */}
      <div 
        style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={20} color="#f87171" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f87171' }}>Command Center</h2>
        </div>
        <div className={`ws-badge ws-${wsStatus.toLowerCase()}`}>
          <Radio size={12} className={wsStatus === 'CONNECTED' ? 'pulse' : ''} />
          <span>{wsStatus}</span>
        </div>
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Sender Identity (Immutable) */}
        <div 
          style={{ 
            marginBottom: '1.25rem', 
            padding: '0.75rem 1rem', 
            background: 'rgba(14, 19, 34, 0.6)', 
            borderRadius: '8px', 
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Authorized Sender
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-color)' }}>
              {currentUser?.email || 'System Administrator'}
            </span>
          </div>
          {currentUser?.role_tier !== undefined && (
            <span className={`badge badge-t${currentUser.role_tier}`} style={{ fontSize: '0.7rem' }}>
              Tier {currentUser.role_tier}
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Target Audience Dropdown */}
          <div>
            <label className="cc-form-label">Target Audience</label>
            <select 
              className="cc-select"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            >
              <option value="ALL_SESSIONS">All Active Sessions</option>
              <option value="TIER_1_ONLY">Tier 1 Executives Only</option>
              <option value="TIER_2_PLUS">Tier 2+ Operators</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div>
            <label className="cc-form-label">Severity Level</label>
            <select 
              className="cc-select"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical Lockdown</option>
            </select>
          </div>

          {/* Emergency Message Textarea */}
          <div>
            <label className="cc-form-label">Emergency Message</label>
            <textarea 
              className="cc-textarea"
              rows={4}
              placeholder="Input emergency broadcast payload description..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Feedback message */}
          {feedback && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                padding: '0.75rem',
                borderRadius: '6px',
                border: feedback.type === 'success' ? '1px solid rgba(0, 245, 160, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                background: feedback.type === 'success' ? 'rgba(0, 245, 160, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                color: feedback.type === 'success' ? 'var(--accent-green)' : '#f87171'
              }}
            >
              {feedback.type === 'success' ? <Lock size={14} /> : <AlertTriangle size={14} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Broadcast Button */}
          <button 
            type="submit" 
            className="cc-btn-broadcast"
            disabled={wsStatus !== 'CONNECTED'}
          >
            <Send size={15} />
            Broadcast Blocker Beacon
          </button>
        </form>
      </div>
    </div>
  );
}
