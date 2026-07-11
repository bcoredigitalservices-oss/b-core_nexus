import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Box, 
  Package, 
  Layers, 
  Building, 
  ShoppingCart,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  badge?: string;
}

function ModuleCard({ title, description, icon, to, badge }: ModuleCardProps) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const accentColor = '#d4af37'; // Gold
  const glowColor = 'rgba(212, 175, 55, 0.2)';

  return (
    <div
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '220px',
        cursor: 'pointer',
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered 
          ? `1px solid ${accentColor}88` 
          : '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered 
          ? `0 20px 40px rgba(0,0,0,0.15), 0 0 25px ${glowColor}` 
          : '0 4px 15px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(15px)',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        }}
      />

      {/* Header of the card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: hovered ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg-main)',
            border: hovered ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: hovered ? accentColor : 'var(--text-muted)',
            transition: 'all 0.3s ease'
          }}
        >
          {icon}
        </div>
        {badge && (
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: 'rgba(212, 175, 55, 0.12)',
              color: accentColor,
              border: `1px solid ${accentColor}33`,
              padding: '2px 8px',
              borderRadius: '20px'
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Body text */}
      <div style={{ marginTop: '1.5rem', flexGrow: 1 }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            fontFamily: 'var(--font-display)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.4,
            margin: 0
          }}
        >
          {description}
        </p>
      </div>

      {/* Action footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: hovered ? accentColor : 'var(--text-muted)',
          transition: 'color 0.2s ease',
          marginTop: '1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem'
        }}
      >
        <span>Launch Module</span>
        <ArrowRight 
          size={12} 
          style={{ 
            transform: hovered ? 'translateX(4px)' : 'none', 
            transition: 'transform 0.2s ease' 
          }} 
        />
      </div>
    </div>
  );
}

export default function InventoryHub() {
  const accentColor = '#d4af37'; // Gold

  const modules = [
    {
      title: 'Asset Registry',
      description: 'Manage capital items, machinery, hardware and registers.',
      icon: <Layers size={20} />,
      to: '/workspace/inventory/assets',
      badge: 'Core'
    },
    {
      title: 'Products View',
      description: 'Review product bundling, pricing tiers and retail profiles.',
      icon: <Box size={20} />,
      to: '/workspace/inventory/products',
      badge: 'View'
    },
    {
      title: 'Catalog Items',
      description: 'Central registry of all system-wide items and stock SKUs.',
      icon: <Package size={20} />,
      to: '/workspace/items/item',
      badge: 'Shared'
    },
    {
      title: 'Warehouse Ops',
      description: 'Configure and monitor layout locations, zones, and bins.',
      icon: <Layers size={20} />,
      to: '/workspace/inventory/warehouses',
      badge: 'Operations'
    },
    {
      title: 'Stock & Balances',
      description: 'Track stock transactions, journals, and real-time ledger records.',
      icon: <Building size={20} />,
      to: '/workspace/inventory/stock',
      badge: 'Live'
    },
    {
      title: 'Buying & Procurement',
      description: 'Manage purchase receipts, vendor items and intake ledger.',
      icon: <ShoppingCart size={20} />,
      to: '/workspaces/procurement',
      badge: 'Buying'
    }
  ];


  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2.5rem', 
        width: '100%', 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '1rem 0'
      }}
    >
      {/* ── Hub Banner ── */}
      <div 
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--border-color)',

          borderRadius: '20px',
          padding: '2.5rem 3rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '250px',
            height: '250px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
          <div 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(212, 175, 55, 0.25)',
              color: accentColor
            }}
          >
            <Sparkles size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.4rem' }}>
              <h1 
                style={{ 
                  fontSize: '2rem', 
                  fontWeight: 800, 
                  color: 'var(--text-main)', 
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.03em',
                  margin: 0
                }}
              >
                Inventory
              </h1>
              <span 
                style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 900, 
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                  color: '#0b0f19',
                  padding: '3px 10px',
                  borderRadius: '30px',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.25)'
                }}
              >
                6 Modules
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0, fontWeight: 500 }}>
              Assets, products, stock control, warehouse operations and procurement.
            </p>
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}
      >
        {modules.map((mod) => (
          <ModuleCard
            key={mod.title}
            title={mod.title}
            description={mod.description}
            icon={mod.icon}
            to={mod.to}
            badge={mod.badge}
          />
        ))}
      </div>
    </div>
  );
}
