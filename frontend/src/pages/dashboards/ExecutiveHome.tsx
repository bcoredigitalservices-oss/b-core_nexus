import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Users,
  Package,
  Cog,
  UserCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  Compass,
  Zap,
  LayoutGrid,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkspaceDefinition {
  key: string;           // must match workspace_string in backend
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
  features: string[];
  route: string;
}

// ─── Master Workspace Registry ────────────────────────────────────────────────

const WORKSPACE_DEFINITIONS: WorkspaceDefinition[] = [
  {
    key: 'finance',
    title: 'Finance',
    subtitle: 'Financial Management',
    description:
      'Ledger management, budgeting forecasts, expense tracking, tax compliance, and multi-currency accounting.',
    icon: <DollarSign size={26} />,
    accentColor: '#00f5a0',
    glowColor: 'rgba(0, 245, 160, 0.18)',
    features: ['Financial Management', 'Accounting', 'Budgeting & Forecasting', 'Expense Tracking', 'Tax Compliance'],
    route: '/workspaces/finance',
  },
  {
    key: 'crm',
    title: 'CRM & Sales',
    subtitle: 'Customer Relationships',
    description:
      'Lead management, sales pipeline tracking, contact registry, and customer support coordination.',
    icon: <Users size={26} />,
    accentColor: '#00f2fe',
    glowColor: 'rgba(0, 242, 254, 0.18)',
    features: ['Customer Relationship Management', 'Lead Management', 'Sales Pipeline', 'Contact Management', 'Customer Support'],
    route: '/workspaces/crm',
  },
  {
    key: 'inventory',
    title: 'Inventory',
    subtitle: 'Stock & Warehouse',
    description:
      'Real-time stock tracking, warehouse management, purchase orders, and supplier relationship management.',
    icon: <Package size={26} />,
    accentColor: '#ffb703',
    glowColor: 'rgba(255, 183, 3, 0.18)',
    features: ['Inventory Management', 'Stock Tracking', 'Warehouse Management', 'Purchase Orders', 'Supplier Management'],
    route: '/workspaces/inventory',
  },
  {
    key: 'operations',
    title: 'Operations',
    subtitle: 'Production & Assets',
    description:
      'Production planning, quality control workflows, asset lifecycle management, and maintenance scheduling.',
    icon: <Cog size={26} />,
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.18)',
    features: ['Operations Management', 'Production Planning', 'Quality Control', 'Asset Management', 'Maintenance Scheduling'],
    route: '/workspaces/operations',
  },
  {
    key: 'hr',
    title: 'HR',
    subtitle: 'Human Resources',
    description:
      'Employee lifecycle management, payroll processing, attendance and leave tracking, and performance reviews.',
    icon: <UserCheck size={26} />,
    accentColor: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.18)',
    features: ['Human Resources', 'Payroll Management', 'Attendance & Leave', 'Recruitment', 'Performance Management'],
    route: '/workspaces/hr',
  },
];

// ─── WorkspaceCard ────────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  workspace: WorkspaceDefinition;
  permitted: boolean;
  onClick: () => void;
}

function WorkspaceCard({ workspace, permitted, onClick }: WorkspaceCardProps) {
  const [hovered, setHovered] = useState(false);
  const { accentColor, glowColor } = workspace;

  return (
    <div
      id={`ws-card-${workspace.key}`}
      role={permitted ? 'button' : 'presentation'}
      tabIndex={permitted ? 0 : -1}
      aria-label={permitted ? `Open ${workspace.title} workspace` : `${workspace.title} workspace — access restricted`}
      onClick={permitted ? onClick : undefined}
      onKeyDown={(e) => permitted && e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: permitted
          ? hovered
            ? `linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)`
            : `linear-gradient(135deg, rgba(20, 30, 48, 0.85) 0%, rgba(12, 18, 36, 0.92) 100%)`
          : 'rgba(12, 18, 36, 0.45)',
        border: permitted
          ? hovered
            ? `1px solid ${accentColor}60`
            : '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.04)',
        borderRadius: '18px',
        padding: '1.75rem',
        cursor: permitted ? 'pointer' : 'not-allowed',
        opacity: permitted ? 1 : 0.45,
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: permitted && hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: permitted && hovered
          ? `0 16px 40px rgba(0,0,0,0.3), 0 0 30px ${glowColor}`
          : permitted
            ? '0 4px 20px rgba(0,0,0,0.2)'
            : 'none',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '260px',
      }}
    >
      {/* Corner accent glow */}
      {permitted && (
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            filter: 'blur(12px)',
            pointerEvents: 'none',
            transition: 'opacity 0.3s',
            opacity: hovered ? 1 : 0.5,
          }}
        />
      )}

      {/* Bottom accent bar */}
      {permitted && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      )}

      {/* Header: Icon & Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        {/* Icon container */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: permitted
              ? `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}08 100%)`
              : 'rgba(255,255,255,0.03)',
            border: permitted
              ? `1px solid ${accentColor}30`
              : '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: permitted ? accentColor : 'rgba(255,255,255,0.2)',
            transition: 'all 0.3s',
            transform: permitted && hovered ? 'scale(1.08)' : 'scale(1)',
          }}
        >
          {workspace.icon}
        </div>

        {/* Status Badge */}
        {permitted ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 245, 160, 0.1)',
              color: '#00f5a0',
              border: '1px solid rgba(0, 245, 160, 0.2)',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#00f5a0',
                boxShadow: '0 0 6px #00f5a0',
                animation: 'pulse-dot 2s infinite',
              }}
            />
            Active
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.25)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Lock size={9} />
            Restricted
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: permitted ? accentColor : 'rgba(255,255,255,0.2)',
            marginBottom: '0.35rem',
          }}
        >
          {workspace.subtitle}
        </p>
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: permitted ? '#ffffff' : 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-display)',
            marginBottom: '0.65rem',
            letterSpacing: '-0.02em',
          }}
        >
          {workspace.title}
        </h3>
        <p
          style={{
            fontSize: '0.82rem',
            color: permitted ? 'var(--text-muted)' : 'rgba(255,255,255,0.2)',
            lineHeight: '1.55',
          }}
        >
          {permitted ? workspace.description : 'Contact your system administrator to request access to this workspace.'}
        </p>
      </div>

      {/* Feature Pills (only shown when permitted) */}
      {permitted && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '1.1rem',
            marginBottom: '1.1rem',
          }}
        >
          {workspace.features.slice(0, 3).map((f) => (
            <span
              key={f}
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: `${accentColor}12`,
                color: accentColor,
                border: `1px solid ${accentColor}25`,
                fontWeight: 600,
              }}
            >
              {f}
            </span>
          ))}
          {workspace.features.length > 3 && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              +{workspace.features.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer CTA */}
      <div
        style={{
          borderTop: permitted ? '1px solid rgba(255,255,255,0.06)' : 'none',
          paddingTop: permitted ? '0.9rem' : '0',
          marginTop: permitted ? '0' : '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: permitted ? accentColor : 'rgba(255,255,255,0.15)',
            transition: 'color 0.2s',
          }}
        >
          {permitted ? 'Launch Application' : 'License Restricted'}
        </span>
        {permitted && (
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              transform: hovered ? 'translateX(4px)' : 'translateX(0)',
              transition: 'transform 0.25s',
            }}
          >
            <ArrowRight size={13} />
          </div>
        )}
        {!permitted && (
          <Lock size={14} color="rgba(255,255,255,0.15)" />
        )}
      </div>
    </div>
  );
}

// ─── Main ExecutiveHome Component ─────────────────────────────────────────────

export default function ExecutiveHome() {
  const { currentUser, activeWorkspace, token } = useAppContext();
  const navigate = useNavigate();

  const [revenueMtd, setRevenueMtd] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [activeCustomers, setActiveCustomers] = useState<number | null>(null);
  const [leadsCount, setLeadsCount] = useState<number | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [revRes, convRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspaces/finance/analytics/revenue-mtd`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/v1/workspaces/crm/analytics/conversion-rate`, { headers }),
        ]);

        if (revRes.ok) {
          const revData = await revRes.json();
          setRevenueMtd(revData.revenue_mtd);
        }
        if (convRes.ok) {
          const convData = await convRes.json();
          setConversionRate(convData.conversion_rate);
          setActiveCustomers(convData.active_customers);
          setLeadsCount(convData.leads);
        }
      } catch (err) {
        console.error('Error fetching executive analytics:', err);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  // Normalize permitted workspaces from auth session.
  // Tier 0 / Tier 1 → global access (all workspaces unlocked).
  const roleTier: number = currentUser?.role_tier ?? 99;
  const isSuperUser = roleTier <= 1;

  const permittedWorkspaces: string[] = isSuperUser
    ? WORKSPACE_DEFINITIONS.map((w) => w.key)
    : (currentUser?.workspaces as string[] | undefined) ?? [];

  const vertical = activeWorkspace?.industry_vertical || 'GENERAL_TRADING';
  const orgName = activeWorkspace?.organization_name || currentUser?.full_name || 'B-Core Nexus';

  const permittedCount = WORKSPACE_DEFINITIONS.filter((w) =>
    permittedWorkspaces.includes(w.key)
  ).length;

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes float-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ws-launcher-grid > * {
          animation: float-in 0.4s ease both;
        }
        .ws-launcher-grid > *:nth-child(1) { animation-delay: 0.05s; }
        .ws-launcher-grid > *:nth-child(2) { animation-delay: 0.10s; }
        .ws-launcher-grid > *:nth-child(3) { animation-delay: 0.15s; }
        .ws-launcher-grid > *:nth-child(4) { animation-delay: 0.20s; }
        .ws-launcher-grid > *:nth-child(5) { animation-delay: 0.25s; }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
        }}
      >
        {/* ── Hero Banner ── */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background:
              'linear-gradient(135deg, rgba(157,78,221,0.1) 0%, rgba(0,242,254,0.04) 60%, rgba(0,245,160,0.04) 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '20px',
            padding: '2.25rem 2.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          {/* BG radial glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(157,78,221,0.18) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-40px',
              left: '10%',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,242,254,0.08) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />

          {/* Left: Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1 }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '16px',
                background: 'rgba(157,78,221,0.18)',
                border: '1px solid rgba(157,78,221,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(157,78,221,0.25)',
              }}
            >
              <LayoutGrid size={28} color="#9d4edd" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.03em',
                  marginBottom: '0.3rem',
                }}
              >
                Workspace Launcher
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, maxWidth: '480px' }}>
                Your enterprise application hub for{' '}
                <span style={{ color: '#c8b6ff', fontWeight: 600 }}>{orgName}</span>. Select a workspace to begin.
              </p>
            </div>
          </div>

          {/* Right: Stats + Vertical Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(0,245,160,0.08)',
                border: '1px solid rgba(0,245,160,0.2)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#00f5a0',
                fontWeight: 700,
              }}
            >
              <Zap size={13} />
              <span>
                {permittedCount} / {WORKSPACE_DEFINITIONS.length} Workspaces Unlocked
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(157,78,221,0.1)',
                border: '1px solid rgba(157,78,221,0.25)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                color: '#c8b6ff',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={13} color="#00f5a0" />
              <span>Vertical: {vertical.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* ── Analytics KPI Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Revenue MTD Card */}
          <div 
            className="glass-panel"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.7) 0%, rgba(12, 18, 36, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Revenue (Month-to-Date)
              </span>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 245, 160, 0.1)', color: '#00f5a0', border: '1px solid rgba(0, 245, 160, 0.2)' }}>
                <DollarSign size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
                {loadingAnalytics ? '...' : revenueMtd !== null ? `$${revenueMtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                Real-time general ledger aggregate revenue balance
              </span>
            </div>
          </div>

          {/* Conversion Rate Card */}
          <div 
            className="glass-panel"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 30, 48, 0.7) 0%, rgba(12, 18, 36, 0.8) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                CRM Conversion Rate
              </span>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.1)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                <Users size={20} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
                {loadingAnalytics ? '...' : conversionRate !== null ? `${(conversionRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                {leadsCount !== null && activeCustomers !== null ? `${activeCustomers} Active Customers / ${leadsCount} Leads` : 'Ratio of active customers to leads'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Section Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '4px',
                height: '22px',
                background: 'linear-gradient(180deg, #9d4edd, #00f2fe)',
                borderRadius: '2px',
              }}
            />
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#ffffff',
                fontFamily: 'var(--font-display)',
              }}
            >
              Core Operational Workspaces
            </h2>
          </div>
          {isSuperUser && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'rgba(157,78,221,0.12)',
                color: '#c8b6ff',
                border: '1px solid rgba(157,78,221,0.25)',
              }}
            >
              <Compass size={11} />
              Global Access — Tier {roleTier}
            </span>
          )}
        </div>

        {/* ── Workspace Grid ── */}
        <div
          className="ws-launcher-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {WORKSPACE_DEFINITIONS.map((ws) => {
            const permitted = permittedWorkspaces.includes(ws.key);
            return (
              <WorkspaceCard
                key={ws.key}
                workspace={ws}
                permitted={permitted}
                onClick={() => navigate(ws.route)}
              />
            );
          })}
        </div>

        {/* ── Footer: Access Hint ── */}
        {!isSuperUser && permittedCount < WORKSPACE_DEFINITIONS.length && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              background: 'rgba(255,183,3,0.06)',
              border: '1px solid rgba(255,183,3,0.15)',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            <Lock size={14} color="#ffb703" />
            <span>
              <strong style={{ color: '#ffb703' }}>
                {WORKSPACE_DEFINITIONS.length - permittedCount} workspace
                {WORKSPACE_DEFINITIONS.length - permittedCount > 1 ? 's' : ''} restricted.
              </strong>{' '}
              Contact your Tier 1 Executive Administrator to request additional workspace access.
            </span>
          </div>
        )}
      </div>
    </>
  );
}
