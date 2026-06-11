/**
 * WorkspaceLayout — Generic inner wrapper for all pluggable workspaces.
 *
 * Renders a localized left-sidebar + main content area INSIDE the existing
 * TierOneLayout shell. It does NOT re-implement the outer header/chat — those
 * are already handled by TierOneLayout → Outlet.
 *
 * Usage:
 *   <WorkspaceLayout config={INVENTORY_SIDEBAR_CONFIG}>
 *     <InventoryDashboard />
 *   </WorkspaceLayout>
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceSidebarItem {
  label: string;
  subPath: string;          // relative path segment, e.g. "" | "items" | "warehouses"
  icon: React.ReactNode;
  badge?: string | number;  // optional count/status badge
}

export interface WorkspaceLayoutConfig {
  workspaceKey: string;       // e.g. "inventory"
  workspaceName: string;      // e.g. "Inventory"
  accentColor: string;        // e.g. "#ffb703"
  icon: React.ReactNode;
  navItems: WorkspaceSidebarItem[];
}

interface WorkspaceLayoutProps {
  config: WorkspaceLayoutConfig;
  children?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkspaceLayout({ config, children }: WorkspaceLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoverBack, setHoverBack] = useState(false);

  const { accentColor, workspaceName, navItems, icon } = config;
  const basePath = `/workspaces/${config.workspaceKey}`;

  /** Resolve whether a nav item is active based on current URL */
  const isActive = (item: WorkspaceSidebarItem): boolean => {
    const fullPath = item.subPath ? `${basePath}/${item.subPath}` : basePath;
    if (item.subPath === '') {
      // Dashboard root — only exact match
      return location.pathname === basePath || location.pathname === `${basePath}/`;
    }
    return location.pathname.startsWith(fullPath);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'var(--bg-main)',
      }}
    >
      {/* ── Workspace Localized Sidebar ── */}
      <aside
        style={{
          width: '230px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Back-to-Home button */}
        <button
          id="ws-back-to-home"
          onClick={() => navigate('/')}
          onMouseEnter={() => setHoverBack(true)}
          onMouseLeave={() => setHoverBack(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '1rem 0.875rem 0.5rem',
            padding: '8px 10px',
            background: hoverBack ? 'var(--bg-card-hover)' : 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: hoverBack ? 'var(--text-main)' : 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'left',
          }}
          aria-label="Back to App Grid"
        >
          <ArrowLeft size={13} />
          <span>Back to App Grid</span>
        </button>

        {/* Workspace Header */}
        <div
          style={{
            padding: '0.875rem 1rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}0A)`,
                border: `1px solid ${accentColor}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
              }}
            >
              {icon}
            </div>
            <div>
              <p
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: accentColor,
                  marginBottom: '2px',
                }}
              >
                Workspace
              </p>
              <h2
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.01em',
                }}
              >
                {workspaceName}
              </h2>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav
          style={{
            flex: 1,
            padding: '0.25rem 0.625rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {navItems.map((item) => {
            const active = isActive(item);
            const fullPath = item.subPath ? `${basePath}/${item.subPath}` : basePath;

            return (
              <button
                key={item.label}
                id={`ws-nav-${item.subPath || 'dashboard'}`}
                onClick={() => navigate(fullPath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: active
                    ? `linear-gradient(90deg, ${accentColor}18, ${accentColor}06)`
                    : 'transparent',
                  border: active
                    ? `1px solid ${accentColor}30`
                    : '1px solid transparent',
                  color: active ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-main)';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {/* Active left-bar accent */}
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '-0.625rem',
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      borderRadius: '0 2px 2px 0',
                      background: accentColor,
                    }}
                  />
                )}

                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: active ? accentColor : 'inherit',
                    transition: 'color 0.18s',
                  }}
                >
                  {item.icon}
                </span>

                <span style={{ flex: 1 }}>{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: `${accentColor}20`,
                      color: accentColor,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {active && <ChevronRight size={13} style={{ color: accentColor, opacity: 0.7 }} />}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content Area ── */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          background: 'var(--bg-main)',
        }}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
}
