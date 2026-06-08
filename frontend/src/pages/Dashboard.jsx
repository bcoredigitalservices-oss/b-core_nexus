import React from 'react';
import { Activity, Database, Users, Package, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

const STAT_CARDS = [
  { label: 'Directory Profiles', value: '3', icon: <Users size={20} />, color: 'var(--accent-blue)' },
  { label: 'Catalog SKUs', value: '3', icon: <Package size={20} />, color: 'var(--accent-purple)' },
  { label: 'Live Events', value: '2', icon: <Activity size={20} />, color: 'var(--accent-green)' },
  { label: 'System Status', value: 'Online', icon: <Database size={20} />, color: 'var(--accent-warning)' },
];

export default function Dashboard() {
  const { navigationMatrix, currentUser, isApiLive } = useAppContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,242,254,0.08) 0%, rgba(157,78,221,0.08) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '1.75rem 2rem',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>
          Welcome back{currentUser?.full_name ? `, ${currentUser.full_name}` : ''}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          B-Core Nexus Headless ERP — {isApiLive ? '🟢 API Connected' : '🟡 Sandbox Mode'}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {STAT_CARDS.map(card => (
          <div key={card.label} className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ color: card.color }}>{card.icon}</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                {card.label}
              </span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions from matrix */}
      {navigationMatrix.quick_actions?.length > 0 && (
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
            <Activity size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {navigationMatrix.quick_actions.map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar navigation shortcuts */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
          <Shield size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
          Workspace Modules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {navigationMatrix.sidebar_links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,242,254,0.06)';
                e.currentTarget.style.color = 'var(--text-main)';
                e.currentTarget.style.borderColor = 'rgba(0,242,254,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
