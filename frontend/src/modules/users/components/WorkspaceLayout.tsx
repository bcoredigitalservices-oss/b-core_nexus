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

import React from 'react';
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

  const { accentColor, workspaceName, navItems, icon } = config;
  const isPlural = location.pathname.startsWith('/workspaces');
  const basePath = isPlural ? `/workspaces/${config.workspaceKey}` : `/workspace/${config.workspaceKey}`;

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
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg-main)]">
      {/* ── Workspace Localized Sidebar ── */}
      <aside className="flex h-full w-[230px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border-color)] bg-[var(--bg-card)]">
        {/* Back-to-Home button */}
        <button
          id="ws-back-to-home"
          onClick={() => navigate('/')}
          aria-label="Back to App Grid"
          className="mx-3.5 mt-4 mb-2 flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-2.5 py-2 text-left text-xs font-semibold text-[var(--text-muted)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
        >
          <ArrowLeft size={13} />
          <span>Back to App Grid</span>
        </button>

        {/* Workspace Header */}
        <div className="mb-2 border-b border-[var(--border-color)] px-4 pb-4 pt-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border"
              style={{
                background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}0A)`,
                borderColor: `${accentColor}35`,
                color: accentColor,
              }}
            >
              {icon}
            </div>
            <div>
              <p
                className="mb-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em]"
                style={{ color: accentColor }}
              >
                Workspace
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-[0.9rem] font-extrabold tracking-[-0.01em] text-[var(--text-main)]">
                {workspaceName}
              </h2>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-1">
          {navItems.map((item) => {
            const active = isActive(item);
            const fullPath = item.subPath ? `${basePath}/${item.subPath}` : basePath;

            return (
              <button
                key={item.label}
                id={`ws-nav-${item.subPath || 'dashboard'}`}
                onClick={() => navigate(fullPath)}
                className={`relative flex w-full items-center gap-2.5 rounded-lg border px-3 py-[9px] text-left text-[0.82rem] transition-all duration-[180ms] ${
                  active
                    ? 'border-transparent font-bold text-[var(--text-main)]'
                    : 'border-transparent font-medium text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
                }`}
                style={
                  active
                    ? {
                        background: `linear-gradient(90deg, ${accentColor}18, ${accentColor}06)`,
                        borderColor: `${accentColor}30`,
                      }
                    : undefined
                }
              >
                {/* Active left-bar accent */}
                {active && (
                  <div
                    className="absolute bottom-[20%] left-[-0.625rem] top-[20%] w-[3px] rounded-r-[2px]"
                    style={{ background: accentColor }}
                  />
                )}

                <span
                  className="flex items-center transition-colors duration-[180ms]"
                  style={{ color: active ? accentColor : 'inherit' }}
                >
                  {item.icon}
                </span>

                <span className="flex-1">{item.label}</span>

                {item.badge !== undefined && (
                  <span
                    className="rounded-[10px] border px-1.5 py-0.5 text-[0.65rem] font-bold"
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                      borderColor: `${accentColor}30`,
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
      <main className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}
