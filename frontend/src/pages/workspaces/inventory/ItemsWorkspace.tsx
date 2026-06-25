import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Package, LayoutDashboard } from 'lucide-react';

interface NavItem { label: string; to: string; }

export default function ItemsWorkspace() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: 'Item', to: '/workspace/items/item' },
    { label: 'Item Group', to: '/workspace/items/item-group' },
    { label: 'Product Bundle', to: '/workspace/items/product-bundle' },
    { label: 'Shipping Rule', to: '/workspace/items/shipping-rule' },
    { label: 'Item Alternative', to: '/workspace/items/item-alternative' },
    { label: 'Item Manufacturer', to: '/workspace/items/item-manufacturer' },
  ];

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/');

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
            <Package size={14} color="#d4af37" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.01em' }}>Items</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '1px' }}>Catalogue</div>
          </div>
        </div>

        {/* Overview / Dashboard */}
        <div style={{ padding: '0.5rem 0.625rem 0.25rem' }}>
          <button
            onClick={() => navigate('/workspace/items')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '7px',
              padding: '0.45rem 0.625rem', borderRadius: '8px', border: 'none',
              background: isActive('/workspace/items') ? 'rgba(212,175,55,0.12)' : 'transparent',
              color: isActive('/workspace/items') ? '#d4af37' : 'var(--text-muted)',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive('/workspace/items')) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-main)'; }}}
            onMouseLeave={e => { if (!isActive('/workspace/items')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
          >
            <LayoutDashboard size={14} />
            Overview
          </button>
        </div>

        {/* Nav sections */}
        <nav style={{ padding: '0.5rem 0.625rem 1rem', flex: 1 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0.5rem 0.5rem' }}>
            Masters
          </div>
          {navItems.map(item => {
            const active = isActive(item.to);
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.to)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.32rem 0.625rem', borderRadius: '6px', border: 'none',
                  background: active ? `rgba(212,175,55,0.15)` : 'transparent',
                  color: active ? '#d4af37' : 'var(--text-muted)',
                  fontSize: '0.78rem', fontWeight: active ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                  marginBottom: '2px'
                }}
                onMouseEnter={e => {
                  if (!active) { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-main)'; }
                }}
                onMouseLeave={e => {
                  if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '0.625rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          B-Core · Items
        </div>
      </aside>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════ */}
      <main style={{ flex: 1, overflowY: 'auto', backgroundColor: 'var(--bg-surface)' }}>
        {location.pathname === '/workspace/items' ? (
           <div style={{ padding: '2rem' }}>
             <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>Items Catalogue Dashboard</h2>
             <p style={{ color: 'var(--text-muted)' }}>Select an option from the sidebar to manage catalog records.</p>
           </div>
        ) : (
           <Outlet />
        )}
      </main>
    </div>
  );
}
