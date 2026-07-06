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
    <div className="glass-panel p-0 overflow-hidden border border-red-500/25 bg-gradient-to-br from-red-500/4 to-[#141b2e]/60 shadow-[0_8px_32px_0_rgba(239,68,68,0.03)]">
      {/* Header */}
      <div className="py-5 px-6 border-b border-red-500/15 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-red-400" />
          <h2 className="text-[1.1rem] font-bold text-red-400">Command Center</h2>
        </div>
        <div className={`inline-flex items-center gap-1.5 text-[0.75rem] font-semibold py-1 px-3 rounded-full border ${
          wsStatus === 'CONNECTED' ? 'bg-emerald-500/8 border-emerald-500/25 text-[#00f5a0]' :
          wsStatus === 'CONNECTING' ? 'bg-purple-500/8 border-purple-500/25 text-[#c084fc]' :
          'bg-red-500/8 border-red-500/25 text-red-400'
        }`}>
          <Radio size={12} className={wsStatus === 'CONNECTED' ? 'animate-pulse' : ''} />
          <span>{wsStatus}</span>
        </div>
      </div>

      <div className="p-6">
        {/* Sender Identity (Immutable) */}
        <div className="mb-5 py-3 px-4 bg-[#0e1322]/60 rounded-lg border border-color flex justify-between items-center">
          <div>
            <span className="text-[0.7rem] text-text-muted block uppercase tracking-wider">
              Authorized Sender
            </span>
            <span className="text-[0.9rem] font-semibold text-text-main">
              {currentUser?.email || 'System Administrator'}
            </span>
          </div>
          {currentUser?.permissions?.includes('*:*') && (
            <span className={`badge badge-t0 text-[0.7rem]`}>
              System Admin
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Target Audience Dropdown */}
          <div>
            <label className="text-[0.75rem] text-text-muted uppercase tracking-wider mb-1.5 block font-semibold">Target Audience</label>
            <select 
              className="w-full bg-[#0e1322]/60 border border-color rounded-lg text-text-main text-[0.9rem] py-2.5 px-3.5 transition-all duration-200 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
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
            <label className="text-[0.75rem] text-text-muted uppercase tracking-wider mb-1.5 block font-semibold">Severity Level</label>
            <select 
              className="w-full bg-[#0e1322]/60 border border-color rounded-lg text-text-main text-[0.9rem] py-2.5 px-3.5 transition-all duration-200 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical Lockdown</option>
            </select>
          </div>

          {/* Emergency Message Textarea */}
          <div>
            <label className="text-[0.75rem] text-text-muted uppercase tracking-wider mb-1.5 block font-semibold">Emergency Message</label>
            <textarea 
              className="w-full bg-[#0e1322]/60 border border-color rounded-lg text-text-main text-[0.9rem] py-2.5 px-3.5 transition-all duration-200 outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/15"
              rows={4}
              placeholder="Input emergency broadcast payload description..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Feedback message */}
          {feedback && (
            <div className={`flex items-center gap-2 text-[0.8rem] p-3 rounded-lg border ${
              feedback.type === 'success' 
                ? 'border-emerald-500/25 bg-emerald-500/5 text-[#00f5a0]' 
                : 'border-red-500/25 bg-red-500/5 text-red-400'
            }`}>
              {feedback.type === 'success' ? <Lock size={14} /> : <AlertTriangle size={14} />}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Broadcast Button */}
          <button 
            type="submit" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-br from-red-500 to-red-700 border border-red-500/40 text-white rounded-lg font-bold text-[0.9rem] cursor-pointer shadow-[0_4px_12px_rgba(239,68,68,0.2)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
