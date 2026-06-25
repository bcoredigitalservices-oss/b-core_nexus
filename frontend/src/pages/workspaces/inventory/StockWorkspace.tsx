import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building, Package, Hash,
  TrendingUp, Layers, Settings,
  Wrench, Activity, ChevronRight, ChevronDown,
  LayoutDashboard, BarChart2, FileText, Truck,
  List, BookOpen, Scale, Clock3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
// @ts-ignore
import UniversalDataGrid from '../../../components/ui/UniversalDataGrid';

interface StockBalance   { sku: string; item_name: string; warehouse_name: string; current_qty: number; }
interface AnalyticsValue { group_name: string; total_value: number; }

interface NavItem { label: string; to: string; icon?: React.ReactNode; }
interface SidebarCategory {
  title: string; icon: React.ReactNode; accentColor: string; items: NavItem[];
}

// ── helpers ──────────────────────────────────────────────────────────────────
const token = () => localStorage.getItem('bcore_token') ?? '';

export default function StockWorkspace() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── data ──────────────────────────────────────────────────────────────────
  const [stockValueData, setStockValueData] = useState<AnalyticsValue[]>([]);
  const [totalWarehouses, setTotalWarehouses]   = useState(0);
  const [totalActiveItems, setTotalActiveItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<string | null>(null);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Items Catalogue', 'Stock Transactions', 'Stock Reports'])
  );

  const API_BASE = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;
  const headers  = { Authorization: `Bearer ${token()}` };

  useEffect(() => {
    const run = async () => {
      try {
        const [analyticsRes, whRes, itemsRes] = await Promise.all([
          fetch(`${API_BASE}/analytics/stock-value-by-group`, { headers }),
          fetch(`${API_BASE}/warehouses`, { headers }),
          fetch(`${API_BASE}/items?is_active=true&limit=1`, { headers }),
        ]);
        if (analyticsRes.ok) setStockValueData((await analyticsRes.json()) || []);
        if (whRes.ok)       setTotalWarehouses((await whRes.json())?.length || 0);
        if (itemsRes.ok)    setTotalActiveItems((await itemsRes.json())?.total || 0);
      } catch {}
      finally { setLoading(false); }
    };
    run();
  }, []);

  const totalStockValue = stockValueData.reduce((acc, c) => acc + Number(c.total_value || 0), 0);

  // ── mock trend data ───────────────────────────────────────────────────────
  const purchaseTrends  = [
    { m: 'Jan', v: 125000 }, { m: 'Feb', v: 148000 }, { m: 'Mar', v: 135000 },
    { m: 'Apr', v: 198000 }, { m: 'May', v: 220000 }, { m: 'Jun', v: 275000 },
  ];
  const deliveryTrends  = [
    { m: 'Jan', v: 95000  }, { m: 'Feb', v: 110000 }, { m: 'Mar', v: 142000 },
    { m: 'Apr', v: 130000 }, { m: 'May', v: 185000 }, { m: 'Jun', v: 215000 },
  ];

  const BAR_COLORS = ['#d4af37','#3b82f6','#10b981','#a78bfa','#f59e0b','#fb7185'];

  // ── grid columns ──────────────────────────────────────────────────────────
  const columns = [
    { key: 'sku',          label: 'SKU',           sortable: true },
    { key: 'item_name',    label: 'Item Name',     sortable: true },
    { key: 'warehouse_name', label: 'Warehouse',   sortable: true },
    { key: 'current_qty',  label: 'Qty On Hand',   sortable: true,
      render: (v: any) => v != null ? Number(v).toLocaleString() : '0' },
  ];

  // ── sidebar nav ───────────────────────────────────────────────────────────
  const sidebarCategories: SidebarCategory[] = [
    {
      title: 'Items Catalogue', icon: <Package size={14} />, accentColor: '#d4af37',
      items: [
        { label: 'Item',              to: '/workspace/inventory/items' },
        { label: 'Item Group',        to: '/workspace/inventory/items' },
        { label: 'Product Bundle',    to: '/workspace/inventory/products' },
        { label: 'Shipping Rule',     to: '/workspace/inventory/items' },
        { label: 'Item Alternative',  to: '/workspace/inventory/items' },
        { label: 'Item Manufacturer', to: '/workspace/inventory/items' },
      ],
    },
    {
      title: 'Stock Transactions', icon: <Activity size={14} />, accentColor: '#3b82f6',
      items: [
        { label: 'Material Request', to: '/workspaces/procurement/material-requests', icon: <FileText size={11} /> },
        { label: 'Stock Entry',      to: '/workspace/inventory/stock-entries',        icon: <BookOpen size={11} /> },
        { label: 'Delivery Note',    to: '/workspace/inventory/delivery-notes',       icon: <Truck size={11} /> },
        { label: 'Pick List',        to: '/workspace/inventory/pick-list',            icon: <List size={11} /> },
        { label: 'Purchase Receipt', to: '/workspaces/procurement',                  icon: <Scale size={11} /> },
      ],
    },
    {
      title: 'Stock Reports', icon: <BarChart2 size={14} />, accentColor: '#10b981',
      items: [
        { label: 'Stock Ledger',       to: '/workspace/inventory/reports/stock-ledger' },
        { label: 'Stock Balance',      to: '/workspace/inventory/reports/stock-balance' },
        { label: 'Stock Projected Qty', to: '/workspace/inventory/reports/stock-projected-qty' },
        { label: 'Stock Ageing',       to: '/workspace/inventory/reports/stock-ageing' },
      ],
    },
    {
      title: 'Settings', icon: <Settings size={14} />, accentColor: '#a78bfa',
      items: [
        { label: 'Stock Settings',   to: '/workspace/inventory/settings' },
        { label: 'Warehouse',        to: '/workspace/inventory/warehouses' },
        { label: 'Unit of Measure',  to: '/workspace/inventory/uom' },
      ],
    },
    {
      title: 'Serial No & Batch', icon: <Hash size={14} />, accentColor: '#fb7185',
      items: [
        { label: 'Serial No', to: '/workspace/inventory/serial-no' },
        { label: 'Batch',     to: '/workspace/inventory/batch' },
      ],
    },
    {
      title: 'Tools', icon: <Wrench size={14} />, accentColor: '#f59e0b',
      items: [
        { label: 'Stock Reconciliation', to: '/workspace/inventory/stock-entries' },
        { label: 'Landed Cost Voucher',  to: '/workspaces/procurement/purchase-invoices' },
      ],
    },
  ];

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => {
      const s = new Set(prev);
      s.has(title) ? s.delete(title) : s.add(title);
      return s;
    });
  };

  const handleNavClick = (item: NavItem) => {
    if (item.to) { navigate(item.to); }
    else {
      setToast(`"${item.label}" will be available in an upcoming release.`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const isActive = (to: string) => to && location.pathname === to;

  // ── kpi cards ────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Stock Value',
      value: `$${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <Package size={20} color="#d4af37" />,
      bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.2)',
    },
    {
      label: 'Total Warehouses',
      value: totalWarehouses,
      icon: <Building size={20} color="#3b82f6" />,
      bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)',
    },
    {
      label: 'Total Active Items',
      value: totalActiveItems,
      icon: <Layers size={20} color="#10b981" />,
      bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)',
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100%', color: 'var(--text-main)', overflow: 'hidden' }}>

      {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <aside style={{
        width: '220px', minWidth: '220px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', overflowX: 'hidden',
        height: '100%', flexShrink: 0,
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '1rem 0.875rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={14} color="#d4af37" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.01em' }}>Stock</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '1px' }}>Inventory Module</div>
          </div>
        </div>

        {/* Overview button */}
        <div style={{ padding: '0.5rem 0.625rem 0.25rem' }}>
          <button
            onClick={() => navigate('/workspace/inventory/stock')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '7px',
              padding: '0.45rem 0.625rem', borderRadius: '8px', border: 'none',
              background: isActive('/workspace/inventory/stock') ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: isActive('/workspace/inventory/stock') ? '#d4af37' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive('/workspace/inventory/stock')) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-main)'; }}}
            onMouseLeave={e => { if (!isActive('/workspace/inventory/stock')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
          >
            <LayoutDashboard size={14} />
            Overview
          </button>
        </div>

        {/* Nav sections */}
        <nav style={{ padding: '0.25rem 0.625rem 1rem', flex: 1 }}>
          {sidebarCategories.map(cat => {
            const isOpen = expandedCategories.has(cat.title);
            return (
              <div key={cat.title} style={{ marginBottom: '1px' }}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat.title)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.425rem 0.5rem', borderRadius: '7px', border: 'none',
                    background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    marginTop: '0.5rem',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: cat.accentColor, display: 'flex' }}>{cat.icon}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {cat.title}
                    </span>
                  </span>
                  <ChevronDown size={11} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', flexShrink: 0 }} />
                </button>

                {/* Items */}
                {isOpen && (
                  <div style={{ paddingLeft: '8px', paddingBottom: '2px' }}>
                    {cat.items.map(item => {
                      const active = isActive(item.to);
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleNavClick(item)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.32rem 0.625rem', borderRadius: '6px', border: 'none',
                            background: active ? `${cat.accentColor}15` : 'transparent',
                            color: active ? cat.accentColor : 'var(--text-muted)',
                            fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                          }}
                          onMouseEnter={e => {
                            if (!active) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-main)'; }
                          }}
                          onMouseLeave={e => {
                            if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.icon && <span style={{ color: cat.accentColor, opacity: 0.7, display: 'flex' }}>{item.icon}</span>}
                            {item.label}
                          </span>
                          {item.to
                            ? <ChevronRight size={10} style={{ opacity: 0.35, flexShrink: 0 }} />
                            : <Clock3 size={10} style={{ opacity: 0.25, flexShrink: 0 }} />
                          }
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          B-Core · Stock v2
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', minWidth: 0 }}>

        {/* Header */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.22)', borderRadius: '10px', padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building size={24} color="#d4af37" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', margin: 0, fontWeight: 800 }}>Stock Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0.2rem 0 0' }}>
              Real-time inventory levels, valuation analytics, and stock registry integrations.
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {kpiCards.map(kpi => (
            <div key={kpi.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: kpi.bg, border: `1px solid ${kpi.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600 }}>{kpi.label}</div>
                <div style={{ fontSize: '1.55rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1, marginTop: '0.1rem' }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bar Chart */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.2rem', fontFamily: 'var(--font-display)' }}>Stock Value by Item Group</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0 0 1.25rem' }}>Monetary distribution grouped by classification.</p>
          <div style={{ height: '260px' }}>
            {stockValueData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No stock balances registered yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockValueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="group_name" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.82rem' }} formatter={v => [`$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Value']} />
                  <Bar dataKey="total_value" radius={[5, 5, 0, 0]}>
                    {stockValueData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trend Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { title: 'Purchase Receipt Trends', data: purchaseTrends, color: '#10b981', label: 'Purchases' },
            { title: 'Delivery Note Trends',    data: deliveryTrends, color: '#3b82f6', label: 'Deliveries' },
          ].map(chart => (
            <div key={chart.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
                <TrendingUp size={15} color={chart.color} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>{chart.title}</h3>
              </div>
              <div style={{ height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="m" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} tickFormatter={v => `$${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.78rem' }} formatter={v => [`$${Number(v).toLocaleString()}`, chart.label]} />
                    <Line type="monotone" dataKey="v" stroke={chart.color} strokeWidth={2.5} dot={{ r: 3, fill: chart.color }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Stock Balances Grid */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <Building size={17} color="#d4af37" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Real-time Stock Balances</h2>
            </div>
            <button
              onClick={() => navigate('/workspace/inventory/reports/stock-ledger')}
              style={{ fontSize: '0.75rem', color: '#d4af37', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              View Full Ledger →
            </button>
          </div>
          <div style={{ padding: '1rem' }}>
            <UniversalDataGrid
              endpointUrl="/api/v1/workspaces/inventory/stock/levels"
              title="Stock Balances"
              pageSize={8}
              emptyMessage="No stock balances. Submit a Stock Entry to populate balances."
              columns={columns}
            />
          </div>
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'var(--bg-card)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)', borderRadius: '12px',
          padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 9999, maxWidth: '360px',
          animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4af37', boxShadow: '0 0 6px #d4af37', flexShrink: 0 }} />
          <span style={{ fontSize: '0.81rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.4 }}>{toast}</span>
        </div>
      )}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
