import React from 'react';
import { Activity, Database, Users, Package, Shield, ArrowUpRight } from 'lucide-react';
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
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <div className="rounded-[14px] border border-[var(--border-color)] bg-gradient-to-br from-[rgba(0,242,254,0.08)] to-[rgba(157,78,221,0.08)] px-8 py-7">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl">
          Welcome back{currentUser?.full_name ? `, ${currentUser.full_name}` : ''}
        </h1>
        <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          B-Core Nexus Headless ERP
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {isApiLive && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-green)] opacity-75" />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: isApiLive ? 'var(--accent-green)' : 'var(--accent-warning)' }}
              />
            </span>
            {isApiLive ? 'API Connected' : 'Sandbox Mode'}
          </span>
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="glass-panel p-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="mb-3 flex items-center gap-3">
              <span style={{ color: card.color }}>{card.icon}</span>
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{card.label}</span>
            </div>
            <div className="font-[family-name:var(--font-display)] text-[1.6rem] font-extrabold" style={{ color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions from matrix */}
      {navigationMatrix.quick_actions?.length > 0 && (
        <div className="glass-panel">
          <h3 className="mb-4 flex items-center gap-1.5 text-base">
            <Activity size={16} />
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {navigationMatrix.quick_actions.map((action) => (
              <Link key={action.path} to={action.path} className="btn btn-secondary px-4 py-2 text-[0.82rem]">
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sidebar navigation shortcuts */}
      <div className="glass-panel">
        <h3 className="mb-4 flex items-center gap-1.5 text-base">
          <Shield size={16} />
          Workspace Modules
        </h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {navigationMatrix.sidebar_links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group flex items-center justify-between gap-2 rounded-[10px] border border-[var(--border-color)] bg-[var(--bg-card-hover)] px-4 py-3 text-sm text-[var(--text-muted)] no-underline transition-all duration-200 hover:border-[rgba(0,242,254,0.3)] hover:bg-[rgba(0,242,254,0.06)] hover:text-[var(--text-main)]"
            >
              {link.label}
              <ArrowUpRight size={14} className="opacity-0 transition-opacity duration-200 group-hover:opacity-70" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
