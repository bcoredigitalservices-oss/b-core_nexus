/**
 * InventoryDashboard — Landing page for the Inventory workspace.
 *
 * Mounted at: /workspaces/inventory
 * Wrapped by: WorkspaceLayout (localized sidebar)
 * Protected by: require_workspace_access("inventory") on the backend
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Warehouse,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Plus,
  RefreshCw,
  BarChart3,
  ClipboardList,
  BookOpen,
} from 'lucide-react';
import WorkspaceLayout, { WorkspaceLayoutConfig } from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';

// ─── Sidebar Config ────────────────────────────────────────────────────────────

const INVENTORY_SIDEBAR: WorkspaceLayoutConfig = {
  workspaceKey: 'inventory',
  workspaceName: 'Inventory',
  accentColor: '#ffb703',
  icon: <Package size={18} />,
  navItems: [
    { label: 'Dashboard',    subPath: '',            icon: <BarChart3 size={15} /> },
    { label: 'Item Master',  subPath: 'items',       icon: <BookOpen size={15} /> },
    { label: 'Warehouses',   subPath: 'warehouses',  icon: <Warehouse size={15} /> },
    { label: 'Stock Ledger', subPath: 'stock-ledger', icon: <ClipboardList size={15} /> },
  ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  trend?: string;
  onClick?: () => void;
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ id, label, value, subtext, icon, accentColor, glowColor, trend, onClick }: MetricCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      id={id}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(20,30,50,0.9) 0%, rgba(12,18,36,0.95) 100%)',
        border: hovered && onClick
          ? `1px solid ${accentColor}55`
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered && onClick ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered && onClick
          ? `0 12px 30px rgba(0,0,0,0.25), 0 0 20px ${glowColor}`
          : '0 4px 15px rgba(0,0,0,0.15)',
      }}
    >
      {/* Corner glow */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(16px)',
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0.6,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Header: label + icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: '2.1rem',
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          color: 'var(--text-main)',
          lineHeight: 1,
          marginBottom: '0.5rem',
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </div>

      {/* Subtext + trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {subtext}
        </span>
        {trend && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#00f5a0',
              background: 'rgba(0,245,160,0.1)',
              border: '1px solid rgba(0,245,160,0.2)',
              padding: '2px 7px',
              borderRadius: '8px',
            }}
          >
            <TrendingUp size={10} />
            {trend}
          </span>
        )}
      </div>

      {/* CTA arrow for clickable cards */}
      {onClick && (
        <div
          style={{
            marginTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: hovered ? accentColor : 'var(--text-muted)',
            transition: 'color 0.2s',
          }}
        >
          <span>View details</span>
          <ArrowRight size={12} style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function InventoryDashboard() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalItems: '—',
    activeWarehouses: '—',
    lowStockAlerts: '—',
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces`;

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Fetch paginated items total (limit=1 is enough to get the `total` field)
      const [itemsRes, warehousesRes] = await Promise.allSettled([
        fetch(`${API_BASE}/inventory/items?limit=1&offset=0`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('bcore_token')}` },
        }),
        fetch(`${API_BASE}/inventory/warehouses?is_active=true`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('bcore_token')}` },
        }),
      ]);

      let totalItems: string | number = '—';
      let activeWarehouses: string | number = '—';

      if (itemsRes.status === 'fulfilled' && itemsRes.value.ok) {
        const data = await itemsRes.value.json();
        totalItems = data.total ?? data.items?.length ?? '—';
      }

      if (warehousesRes.status === 'fulfilled' && warehousesRes.value.ok) {
        const data = await warehousesRes.value.json();
        activeWarehouses = Array.isArray(data) ? data.length : '—';
      }

      setMetrics({
        totalItems,
        activeWarehouses,
        lowStockAlerts: 0, // Placeholder — will be computed from stock ledger in future sprint
      });
      setLastRefreshed(new Date());
    } catch {
      // Silently degrade — metrics stay as '—'
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceLayout config={INVENTORY_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px' }}>

        {/* ── Page Header ── */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(255,183,3,0.08) 0%, rgba(12,18,36,0.6) 100%)',
            border: '1px solid rgba(255,183,3,0.15)',
            borderRadius: '18px',
            padding: '2rem 2.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* BG glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,183,3,0.15) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(255,183,3,0.15)',
                border: '1px solid rgba(255,183,3,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(255,183,3,0.2)',
              }}
            >
              <Package size={26} color="#ffb703" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.3rem',
                }}
              >
                Universal Catalog & Inventory Operations
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Manage items, warehouses, and real-time stock ledger movements.
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', zIndex: 1, flexWrap: 'wrap' }}>
            <button
              id="inv-refresh-btn"
              onClick={fetchMetrics}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: loading ? 'var(--text-muted)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Refresh
            </button>
            <button
              id="inv-add-item-btn"
              onClick={() => navigate('/workspaces/inventory/items')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #ffb703, #f59e0b)',
                border: 'none',
                borderRadius: '8px',
                color: '#0b0f19',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255,183,3,0.3)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={14} />
              Add Item
            </button>
          </div>
        </div>

        {/* ── Summary Metric Cards ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '4px',
                height: '18px',
                background: 'linear-gradient(180deg, #ffb703, #f59e0b)',
                borderRadius: '2px',
              }}
            />
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Operations Overview
            </h2>
            {lastRefreshed && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <MetricCard
              id="inv-metric-total-items"
              label="Total Active SKUs"
              value={metrics.totalItems}
              subtext="Registered in inventory catalog"
              icon={<Package size={18} />}
              accentColor="#ffb703"
              glowColor="rgba(255,183,3,0.2)"
              trend="+12 this month"
              onClick={() => navigate('/workspaces/inventory/items')}
            />
            <MetricCard
              id="inv-metric-warehouses"
              label="Registered Warehouses"
              value={metrics.activeWarehouses}
              subtext="Operational storage locations"
              icon={<Warehouse size={18} />}
              accentColor="#00f2fe"
              glowColor="rgba(0,242,254,0.15)"
              onClick={() => navigate('/workspaces/inventory/warehouses')}
            />
            <MetricCard
              id="inv-metric-low-stock"
              label="Low Stock Alerts"
              value={metrics.lowStockAlerts}
              subtext="Items below reorder threshold"
              icon={<AlertTriangle size={18} />}
              accentColor={metrics.lowStockAlerts === 0 ? '#00f5a0' : '#ff3366'}
              glowColor={metrics.lowStockAlerts === 0 ? 'rgba(0,245,160,0.15)' : 'rgba(255,51,102,0.15)'}
              onClick={() => navigate('/workspaces/inventory/stock-ledger')}
            />
          </div>
        </div>

        {/* ── Quick Nav Cards ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '4px',
                height: '18px',
                background: 'linear-gradient(180deg, rgba(255,183,3,0.5), transparent)',
                borderRadius: '2px',
              }}
            />
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
              }}
            >
              Workspace Modules
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            {INVENTORY_SIDEBAR.navItems.slice(1).map((item) => (
              <button
                key={item.label}
                id={`inv-module-${item.subPath}`}
                onClick={() => navigate(`/workspaces/inventory/${item.subPath}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,183,3,0.3)';
                  e.currentTarget.style.color = 'var(--text-main)';
                  e.currentTarget.style.background = 'rgba(255,183,3,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                <span style={{ color: '#ffb703', display: 'flex' }}>{item.icon}</span>
                <span>{item.label}</span>
                <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </WorkspaceLayout>
  );
}
