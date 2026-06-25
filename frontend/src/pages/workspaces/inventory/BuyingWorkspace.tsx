/**
 * BuyingWorkspace — ERPNext-style Procurement Hub
 *
 * Layout:
 *  1. Header banner
 *  2. Purchase Order Trends — Recharts LineChart
 *  3. KPI metric cards (PO Count, Total Amount, Avg Order Value)
 *  4. ERPNext-style module grid (Buying / Items & Pricing / Supplier / Settings / Reports)
 *
 * The old inline Purchase Receipt form has been removed from this dashboard.
 * It lives in a dedicated modal (new PO flow belongs on the PO list page).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingCart,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  Tag,
  Layers,
  Settings,
  Users,
  BarChart2,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  ClipboardList,
  Truck,
  Receipt,
  BookOpen,
  Building2,
  PhoneCall,
  PieChart,
  SlidersHorizontal,
  Calculator,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { BUYING_SIDEBAR } from './buyingSidebarConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PurchaseOrder {
  id: string;
  supplier_id: string;
  order_date: string;
  total_amount: number;
  status: 'Draft' | 'Submitted' | 'Received' | 'Cancelled';
}

interface ChartPoint {
  month: string;
  orders: number;
  amount: number;
}

interface KpiData {
  poCount: number;
  totalAmount: number;
  avgOrderValue: number;
  loading: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#d4af37';
const ACCENT_DIM = 'rgba(212, 175, 55, 0.12)';
const ACCENT_BORDER = 'rgba(212, 175, 55, 0.25)';

// ERPNext-style module grid sections
const MODULE_SECTIONS = [
  {
    id: 'buying',
    label: 'Buying',
    icon: <ShoppingCart size={15} />,
    color: '#d4af37',
    items: [
      { label: 'Material Request',     icon: <ClipboardList size={15} />,  href: '/workspaces/procurement/material-requests' },
      { label: 'Purchase Order',        icon: <ShoppingCart size={15} />,   href: '/workspaces/procurement/purchase-orders' },
      { label: 'Purchase Invoice',      icon: <Receipt size={15} />,        href: '/workspaces/procurement/purchase-invoices' },
      { label: 'Request for Quotation', icon: <FileText size={15} />,       href: '/workspaces/procurement/rfq' },
    ],
  },
  {
    id: 'items',
    label: 'Items & Pricing',
    icon: <Package size={15} />,
    color: '#818cf8',
    items: [
      { label: 'Item',           icon: <Package size={15} />,  href: '/workspace/inventory/items' },
      { label: 'Item Price',     icon: <Tag size={15} />,      href: '/workspace/inventory/items' },
      { label: 'Product Bundle', icon: <Layers size={15} />,   href: '/workspace/inventory/products' },
    ],
  },
  {
    id: 'supplier',
    label: 'Supplier',
    icon: <Building2 size={15} />,
    color: '#34d399',
    items: [
      { label: 'Supplier', icon: <Building2 size={15} />, href: '/workspaces/procurement/suppliers' },
      { label: 'Contact',  icon: <PhoneCall size={15} />, href: '/workspaces/procurement/contacts' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={15} />,
    color: '#94a3b8',
    items: [
      { label: 'Buying Settings', icon: <SlidersHorizontal size={15} />, href: '/workspaces/procurement/settings' },
      { label: 'Taxes',           icon: <Calculator size={15} />,        href: '/workspaces/procurement/taxes' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart2 size={15} />,
    color: '#f472b6',
    items: [
      { label: 'Purchase Analytics', icon: <PieChart size={15} />, href: '/workspaces/procurement/analytics' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function buildChartData(orders: PurchaseOrder[]): ChartPoint[] {
  const buckets: Record<string, { orders: number; amount: number }> = {};

  orders.forEach((po) => {
    const d = new Date(po.order_date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (!buckets[key]) buckets[key] = { orders: 0, amount: 0 };
    buckets[key].orders += 1;
    buckets[key].amount += Number(po.total_amount) || 0;
  });

  // If no real data, return 6-month illustrative zeros
  if (Object.keys(buckets).length === 0) {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        orders: 0,
        amount: 0,
      };
    });
  }

  return Object.entries(buckets).map(([month, v]) => ({ month, ...v }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  id: string;
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  accentColor: string;
  loading: boolean;
}

function KpiCard({ id, label, value, subtext, icon, accentColor, loading }: KpiCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      id={id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        border: hovered
          ? `1px solid ${accentColor}44`
          : '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered
          ? `0 16px 40px rgba(0,0,0,0.12), 0 0 24px ${accentColor}18`
          : '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'default',
      }}
    >
      {/* Corner ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.3s',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <span style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
        }}>
          {label}
        </span>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: `${accentColor}15`,
          border: `1px solid ${accentColor}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
        }}>
          {icon}
        </div>
      </div>

      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        fontFamily: 'var(--font-display)',
        color: loading ? 'var(--text-muted)' : 'var(--text-main)',
        lineHeight: 1,
        marginBottom: '0.5rem',
        letterSpacing: '-0.03em',
      }}>
        {loading ? '—' : value}
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {subtext}
      </div>
    </div>
  );
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${ACCENT_BORDER}`,
      borderRadius: '10px',
      padding: '0.75rem 1rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      fontSize: '0.8rem',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px', fontFamily: 'var(--font-display)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ACCENT }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
          <span style={{ color: 'var(--text-muted)' }}>Orders:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{payload[0]?.value ?? 0}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8' }} />
          <span style={{ color: 'var(--text-muted)' }}>Amount:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
            {formatCurrency(payload[1]?.value ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Module Section ───────────────────────────────────────────────────────────

function ModuleSection({ section }: { section: typeof MODULE_SECTIONS[0] }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0.875rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card-hover)',
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: `${section.color}15`,
          border: `1px solid ${section.color}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: section.color,
        }}>
          {section.icon}
        </div>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
        }}>
          {section.label}
        </span>
      </div>

      {/* Section links */}
      <div>
        {section.items.map((item, idx) => (
          <ModuleLink
            key={item.label}
            label={item.label}
            icon={item.icon}
            href={item.href}
            accentColor={section.color}
            isLast={idx === section.items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface ModuleLinkProps {
  label: string;
  icon: React.ReactNode;
  href: string;
  accentColor: string;
  isLast: boolean;
}

function ModuleLink({ label, icon, href, accentColor, isLast }: ModuleLinkProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0.7rem 1.25rem',
        background: hovered ? `${accentColor}08` : 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        color: hovered ? 'var(--text-main)' : 'var(--text-muted)',
        fontSize: '0.84rem',
        fontWeight: hovered ? 600 : 500,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ color: hovered ? accentColor : 'var(--text-muted)', transition: 'color 0.15s', display: 'flex' }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight
        size={13}
        style={{
          opacity: hovered ? 0.8 : 0.25,
          transform: hovered ? 'translateX(2px)' : 'translateX(0)',
          transition: 'all 0.15s',
          color: hovered ? accentColor : 'currentColor',
        }}
      />
    </button>
  );
}

// ─── Section heading strip ────────────────────────────────────────────────────

function SectionHeading({ label, accent = ACCENT }: { label: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
      <div style={{
        width: '4px',
        height: '18px',
        background: `linear-gradient(180deg, ${accent}, ${accent}44)`,
        borderRadius: '2px',
      }} />
      <h2 style={{
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--text-main)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.01em',
      }}>
        {label}
      </h2>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function BuyingWorkspace() {
  const { authFetch } = useAppContext();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [kpi, setKpi] = useState<KpiData>({
    poCount: 0,
    totalAmount: 0,
    avgOrderValue: 0,
    loading: true,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const API = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/procurement`;
  const token = () => localStorage.getItem('bcore_token');

  const fetchData = async () => {
    setRefreshing(true);
    setKpi((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`${API}/purchase-orders`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      if (res.ok) {
        const data: PurchaseOrder[] = await res.json();
        const active = data.filter((o) => o.status !== 'Cancelled');

        const totalAmount = active.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
        const avgOrderValue = active.length > 0 ? totalAmount / active.length : 0;

        setOrders(data);
        setChartData(buildChartData(active));
        setKpi({
          poCount: active.length,
          totalAmount,
          avgOrderValue,
          loading: false,
        });
      } else {
        // Backend not yet seeded — show illustrative empty state
        setChartData(buildChartData([]));
        setKpi({ poCount: 0, totalAmount: 0, avgOrderValue: 0, loading: false });
      }
      setLastRefreshed(new Date());
    } catch {
      setChartData(buildChartData([]));
      setKpi({ poCount: 0, totalAmount: 0, avgOrderValue: 0, loading: false });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <WorkspaceLayout config={BUYING_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── 1. Header Banner ────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: '18px',
          padding: '2rem 2.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute',
            top: '-50px', right: '-50px',
            width: '250px', height: '250px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT_DIM} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />
          {/* Subtle stripe */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, height: '3px',
            background: `linear-gradient(90deg, transparent, ${ACCENT}55, transparent)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
            <div style={{
              width: '54px', height: '54px',
              borderRadius: '14px',
              background: ACCENT_DIM,
              border: `1px solid ${ACCENT_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 24px ${ACCENT}20`,
            }}>
              <ShoppingCart size={26} color={ACCENT} />
            </div>
              <h1 style={{
                fontSize: '1.55rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.03em',
                marginBottom: 0,
              }}>
                Procurement & Buying
              </h1>
            </div>

          <div style={{ display: 'flex', gap: '0.75rem', zIndex: 1, flexWrap: 'wrap' }}>
            <button
              id="buying-refresh-btn"
              onClick={fetchData}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw
                size={13}
                style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
              />
              Refresh
            </button>
            <button
              id="buying-new-po-btn"
              onClick={() => navigate('/workspaces/procurement/purchase-orders?new=true')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: `linear-gradient(135deg, ${ACCENT}, #b8860b)`,
                border: 'none',
                borderRadius: '8px',
                color: '#0b0f19',
                fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${ACCENT}30`,
                transition: 'all 0.2s',
              }}
            >
              <ArrowUpRight size={14} />
              New Purchase Order
            </button>
          </div>
        </div>

        {/* ── 2. Purchase Order Trends Chart ─────────────────────────────── */}
        <div>
          <SectionHeading label="Purchase Order Trends" />
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1.5rem 1.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                  Monthly PO Activity
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Order count and total spend aggregated by month
                </div>
              </div>
              {lastRefreshed && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem' }}>
              {[
                { color: ACCENT,    label: 'Orders' },
                { color: '#818cf8', label: 'Spend (USD)' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                  {label}
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={ACCENT} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v) => formatCurrency(v)}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke={ACCENT}
                  strokeWidth={2.5}
                  fill="url(#gradOrders)"
                  dot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: ACCENT }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="amount"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fill="url(#gradAmount)"
                  dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 3. KPI Cards ────────────────────────────────────────────────── */}
        <div>
          <SectionHeading label="Purchasing Overview" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}>
            <KpiCard
              id="buying-kpi-po-count"
              label="Purchase Orders"
              value={kpi.poCount.toString()}
              subtext="Active orders (excl. cancelled)"
              icon={<ShoppingCart size={16} />}
              accentColor={ACCENT}
              loading={kpi.loading}
            />
            <KpiCard
              id="buying-kpi-total-amount"
              label="Total Purchase Amount"
              value={formatCurrency(kpi.totalAmount)}
              subtext="Committed spend across all active POs"
              icon={<DollarSign size={16} />}
              accentColor="#818cf8"
              loading={kpi.loading}
            />
            <KpiCard
              id="buying-kpi-avg-order"
              label="Average Order Value"
              value={formatCurrency(kpi.avgOrderValue)}
              subtext="Mean value per purchase order"
              icon={<TrendingUp size={16} />}
              accentColor="#34d399"
              loading={kpi.loading}
            />
          </div>
        </div>

        {/* ── 4. ERPNext Module Grid ──────────────────────────────────────── */}
        <div>
          <SectionHeading label="Workspace Modules" />

          {/* Main buying modules — 2 wider + smaller settings side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}>
            {MODULE_SECTIONS.map((section) => (
              <ModuleSection key={section.id} section={section} />
            ))}
          </div>
        </div>

      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </WorkspaceLayout>
  );
}
