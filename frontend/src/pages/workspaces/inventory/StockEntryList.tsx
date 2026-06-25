import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, FileText, RefreshCw, Search,
  CheckCircle, Clock, ArrowLeft
} from 'lucide-react';

interface StockEntry {
  id: string;
  series: string;
  entry_type: string;
  posting_date: string;
  posting_time: string;
  status: 'Draft' | 'Submitted';
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Material Receipt':  { bg: 'rgba(16,185,129,0.12)',  text: '#10b981', border: 'rgba(16,185,129,0.3)'  },
  'Material Issue':    { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  'Material Transfer': { bg: 'rgba(59,130,246,0.12)',  text: '#3b82f6', border: 'rgba(59,130,246,0.3)'  },
  'Manufacture':       { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
};

const ENTRY_TYPES = ['All', 'Material Receipt', 'Material Issue', 'Material Transfer', 'Manufacture'];
const STATUSES    = ['All', 'Draft', 'Submitted'];

export default function StockEntryList() {
  const navigate = useNavigate();
  const [entries, setEntries]       = useState<StockEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;
  const headers  = { Authorization: `Bearer ${localStorage.getItem('bcore_token')}` };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stock-entries`, { headers });
      if (res.ok) setEntries((await res.json()) || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEntries(); }, []);

  const filtered = entries.filter(e => {
    const mt = filterType === 'All'   || e.entry_type === filterType;
    const ms = filterStatus === 'All' || e.status === filterStatus;
    const mq = !search || [e.series, e.entry_type].some(v => v?.toLowerCase().includes(search.toLowerCase()));
    return mt && ms && mq;
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => navigate('/workspace/inventory/stock')}
            style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#d4af37'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0, color: 'var(--text-main)' }}>
              Stock Entries
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0' }}>
              Material receipts, issues, transfers, and manufacturing stock movements.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/workspace/inventory/stock-entries/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #d4af37, #b8960a)',
            border: 'none', borderRadius: '10px',
            padding: '0.625rem 1.25rem',
            color: '#0b0f19', fontWeight: 700, fontSize: '0.875rem',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(212,175,55,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(212,175,55,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,175,55,0.3)'; }}
        >
          <Plus size={16} /> New Stock Entry
        </button>
      </div>

      {/* ── Type Summary Chips ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {ENTRY_TYPES.slice(1).map(type => {
          const c = TYPE_COLORS[type];
          const count = entries.filter(e => e.entry_type === type).length;
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? 'All' : type)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 14px', borderRadius: '20px',
                background: filterType === type ? c.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filterType === type ? c.border : 'rgba(255,255,255,0.08)'}`,
                color: filterType === type ? c.text : 'var(--text-muted)',
                fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {type}
              <span style={{ background: filterType === type ? c.border : 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1px 6px', fontSize: '0.68rem' }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Filters Bar ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.875rem' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search series or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px', width: '100%' }}
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ height: '36px', minWidth: '185px' }}>
          {ENTRY_TYPES.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ height: '36px', minWidth: '120px' }}>
          {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
        </select>
        <button
          onClick={fetchEntries}
          disabled={loading}
          title="Refresh"
          style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {filtered.length} of {entries.length} entries
        </span>
      </div>

      {/* ── Table ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '2px solid rgba(255,255,255,0.06)' }}>
                {['Series / ID', 'Entry Type', 'Posting Date', 'Time', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem', display: 'block' }} />
                    Loading stock entries…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FileText size={36} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.25 }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>No stock entries found</div>
                    <div style={{ fontSize: '0.82rem' }}>
                      {search || filterType !== 'All' || filterStatus !== 'All'
                        ? 'Try adjusting your filters.'
                        : 'Click "New Stock Entry" to record your first movement.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(entry => {
                  const tc = TYPE_COLORS[entry.entry_type] || { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', border: 'rgba(107,114,128,0.3)' };
                  return (
                    <tr
                      key={entry.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => navigate(`/workspace/inventory/stock-entries/${entry.id}`)}
                    >
                      <td style={{ padding: '0.875rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#d4af37', fontSize: '0.82rem' }}>
                        {entry.series || entry.id?.substring(0, 8) + '…' || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 600, background: tc.bg, color: tc.text, border: `1px solid ${tc.border}` }}>
                          {entry.entry_type}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-main)' }}>
                        {entry.posting_date || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {entry.posting_time?.substring(0, 5) || '—'}
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        {entry.status === 'Submitted' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.77rem', fontWeight: 600 }}>
                            <CheckCircle size={13} /> Submitted
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.77rem', fontWeight: 600 }}>
                            <Clock size={13} /> Draft
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/workspace/inventory/stock-entries/${entry.id}`); }}
                          style={{ padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.74rem', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.color = '#d4af37'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
