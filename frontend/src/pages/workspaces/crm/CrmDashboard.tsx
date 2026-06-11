import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Layers,
  TrendingUp,
  History,
  RefreshCw,
  AlertCircle,
  PhoneCall,
  FileText,
  ShoppingBag,
  FileCheck,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { useAppContext } from '../../../context/AppContext';
import { CRM_SIDEBAR } from './crmSidebarConfig';

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  lifecycle_status: 'LEAD' | 'OPPORTUNITY' | 'ACTIVE_CUSTOMER' | 'INACTIVE';
  created_at: string;
}

export default function CrmDashboard() {
  const { authFetch, currentUser } = useAppContext();
  const navigate = useNavigate();

  // Greeting and Time states
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' | ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Local UI filters
  const [leadsFilterRange, setLeadsFilterRange] = useState('Last Quarter');
  const [leadsFilterInterval, setLeadsFilterInterval] = useState('Weekly');
  const [trendsFilterRange, setTrendsFilterRange] = useState('Last Quarter');
  const [trendsFilterInterval, setTrendsFilterInterval] = useState('Weekly');
  const [wonFilterRange, setWonFilterRange] = useState('Last Year');
  const [wonFilterInterval, setWonFilterInterval] = useState('Monthly');

  // Interactive Hover Tooltip for Charts
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  const fetchCrmData = async () => {
    setErrorMsg('');
    try {
      const data = await authFetch('/workspaces/crm/customers?limit=100');
      setCustomers(data.customers || []);
    } catch (err: any) {
      if (err.message && err.message.includes('403')) {
        setErrorMsg('Access Denied: You do not have permission to access the CRM workspace.');
      } else {
        setErrorMsg('Failed to retrieve customer records.');
      }
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await fetchCrmData();
      setLoading(false);
    };
    initData();
  }, []);

  // Compute live counts from DB
  const leadCount = customers.filter(c => c.lifecycle_status === 'LEAD').length;
  const opportunityCount = customers.filter(c => c.lifecycle_status === 'OPPORTUNITY').length;
  const wonOpportunityCount = customers.filter(c => c.lifecycle_status === 'ACTIVE_CUSTOMER').length;
  const openOpportunityCount = opportunityCount;

  // Helper to generate dynamic time series data from DB customers list
  const getLeadsChartData = (
    customersList: any[],
    status: string,
    range: string,
    interval: string
  ) => {
    const filtered = customersList.filter(c => c.lifecycle_status === status);
    const now = new Date();
    let startDate = new Date();

    if (range === 'Last Year') {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (range === 'Last Quarter') {
      startDate.setMonth(now.getMonth() - 3);
    } else {
      // Last Month
      startDate.setMonth(now.getMonth() - 1);
    }

    const points: { start: Date; end: Date; label: string; value: number }[] = [];

    if (interval === 'Daily') {
      const temp = new Date(startDate);
      while (temp <= now) {
        const start = new Date(temp);
        start.setHours(0, 0, 0, 0);
        const end = new Date(temp);
        end.setHours(23, 59, 59, 999);
        points.push({
          start,
          end,
          label: temp.toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
          value: 0
        });
        temp.setDate(temp.getDate() + 1);
      }
    } else if (interval === 'Monthly') {
      const temp = new Date(startDate);
      temp.setDate(1);
      while (temp <= now) {
        const start = new Date(temp);
        start.setHours(0, 0, 0, 0);
        const end = new Date(temp.getFullYear(), temp.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        points.push({
          start,
          end,
          label: temp.toLocaleDateString([], { month: 'short', year: '2-digit' }),
          value: 0
        });
        temp.setMonth(temp.getMonth() + 1);
      }
    } else {
      // Weekly
      const temp = new Date(startDate);
      temp.setDate(temp.getDate() - temp.getDay()); // align to start of week
      while (temp <= now) {
        const start = new Date(temp);
        start.setHours(0, 0, 0, 0);
        const end = new Date(temp);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        points.push({
          start,
          end,
          label: start.toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
          value: 0
        });
        temp.setDate(temp.getDate() + 7);
      }
    }

    filtered.forEach(item => {
      const createdDate = new Date(item.created_at);
      for (const pt of points) {
        if (createdDate >= pt.start && createdDate <= pt.end) {
          pt.value += 1;
          break;
        }
      }
    });

    // Make sure we have at least 2 points
    if (points.length === 0) {
      points.push({ start: now, end: now, label: now.toLocaleDateString([], { day: '2-digit', month: '2-digit' }), value: 0 });
    }
    if (points.length === 1) {
      const prev = new Date(points[0].start);
      prev.setDate(prev.getDate() - 1);
      points.unshift({ start: prev, end: prev, label: prev.toLocaleDateString([], { day: '2-digit', month: '2-digit' }), value: 0 });
    }

    return points.map(pt => ({ date: pt.label, value: pt.value }));
  };

  const incomingLeadsData = getLeadsChartData(customers, 'LEAD', leadsFilterRange, leadsFilterInterval);
  const opportunityTrendsData = getLeadsChartData(customers, 'OPPORTUNITY', trendsFilterRange, trendsFilterInterval);
  const wonOpportunitiesData = getLeadsChartData(customers, 'ACTIVE_CUSTOMER', wonFilterRange, wonFilterInterval);

  // Dynamic scaling functions for Incoming Leads Line Chart
  const leadsCount = incomingLeadsData.length;
  const getLeadsX = (index: number) => {
    if (leadsCount <= 1) return 500;
    return 50 + (index / (leadsCount - 1)) * 900;
  };
  const maxLeadsVal = Math.max(...incomingLeadsData.map(d => d.value), 0);
  const getLeadsY = (val: number) => {
    if (maxLeadsVal === 0) return 190;
    return 190 - (val / maxLeadsVal) * 150; // scales values up to height 150px (y from 40 to 190)
  };

  const leadsLinePath = incomingLeadsData.length > 0
    ? incomingLeadsData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getLeadsX(i)},${getLeadsY(d.value)}`).join(' ')
    : 'M 50,190 L 950,190';

  const leadsFillPath = incomingLeadsData.length > 0
    ? `${leadsLinePath} L ${getLeadsX(leadsCount - 1)},190 L ${getLeadsX(0)},190 Z`
    : 'M 50,190 L 950,190 Z';

  // Dynamic scaling functions for Opportunity Trends Bar Chart
  const trendsCount = opportunityTrendsData.length;
  const getTrendsX = (index: number) => {
    if (trendsCount <= 1) return 500;
    return 80 + (index / (trendsCount - 1)) * 840;
  };
  const maxTrendsVal = Math.max(...opportunityTrendsData.map(d => d.value), 0);
  const getTrendsHeight = (val: number) => {
    if (maxTrendsVal === 0) return 0;
    return (val / maxTrendsVal) * 150;
  };

  // Dynamic scaling functions for Won Opportunities Bar Chart
  const wonCount = wonOpportunitiesData.length;
  const getWonX = (index: number) => {
    if (wonCount <= 1) return 500;
    return 80 + (index / (wonCount - 1)) * 840;
  };
  const maxWonVal = Math.max(...wonOpportunitiesData.map(d => d.value), 0);
  const getWonHeight = (val: number) => {
    if (maxWonVal === 0) return 0;
    return (val / maxWonVal) * 150;
  };

  return (
    <WorkspaceLayout config={CRM_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        
        {/* Header Navigation Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {currentUser?.first_name || currentUser?.email?.split('@')[0] || 'User'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {currentDate}
            </span>
          </div>
          
          <button
            onClick={async () => {
              setLoading(true);
              await fetchCrmData();
              setLoading(false);
            }}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <RefreshCw size={12} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} />
            Sync Dashboard
          </button>
        </div>

        {/* Error notification if api fails */}
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,51,102,0.08)',
            border: '1px solid rgba(255,51,102,0.2)',
            color: '#ff3366',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            fontSize: '0.8rem'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ─── 4 Metric Cards Row (ERPNext Style) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {/* Card 1: New Lead */}
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '110px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  New Lead (Last 1 Month)
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
                {loading ? '...' : leadCount}
              </h2>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>0%</span> since yesterday
            </div>
          </div>

          {/* Card 2: New Opportunity */}
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '110px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  New Opportunity (Last 1 Month)
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
                {loading ? '...' : opportunityCount}
              </h2>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>0%</span> since yesterday
            </div>
          </div>

          {/* Card 3: Won Opportunity */}
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '110px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Won Opportunity (Last 1 Month)
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
                {loading ? '...' : wonOpportunityCount}
              </h2>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>0%</span> since yesterday
            </div>
          </div>

          {/* Card 4: Open Opportunity */}
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '110px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Open Opportunity
                </span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', fontFamily: 'var(--font-display)' }}>
                {loading ? '...' : openOpportunityCount}
              </h2>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{ fontWeight: 600 }}>0%</span> since yesterday
            </div>
          </div>
        </div>

        {/* ─── Chart 1: Incoming Leads (Line Chart) ─── */}
        <div className="glass-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Incoming Leads
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last synced just now</span>
            </div>

            {/* Filter selectors */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={leadsFilterRange}
                  onChange={(e) => setLeadsFilterRange(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Last Quarter">Last Quarter</option>
                  <option value="Last Month">Last Month</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={leadsFilterInterval}
                  onChange={(e) => setLeadsFilterInterval(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'visible' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 1000 220" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="70" x2="1000" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="1000" y2="120" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="170" x2="1000" y2="170" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Main Line path */}
              <path
                d={leadsLinePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Gradient area under the line */}
              <path
                d={leadsFillPath}
                fill="url(#green-gradient)"
                opacity="0.08"
              />

              {/* Gradient definitions */}
              <defs>
                <linearGradient id="green-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Data Interactive Dots & Invisible Hover zones */}
              {incomingLeadsData.map((d, index) => {
                const x = getLeadsX(index);
                const y = getLeadsY(d.value);

                return (
                  <g key={d.date}>
                    {/* Visual dot */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="4" 
                      fill="#059669" 
                      stroke="var(--bg-card)" 
                      strokeWidth="1.5" 
                      style={{ transition: 'all 0.2s' }}
                    />
                    {/* Hover detector */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="16" 
                      fill="transparent" 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        setHoveredPoint({
                          x: x,
                          y: y - 20,
                          label: d.date,
                          value: `${Math.round(d.value)} Leads`
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X Axis Labels */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px', 
              fontSize: '0.68rem', 
              color: 'var(--text-muted)',
              paddingLeft: '50px',
              paddingRight: '50px'
            }}>
              {incomingLeadsData.length > 0 && Array.from(new Set([
                incomingLeadsData[0].date,
                incomingLeadsData[Math.floor(incomingLeadsData.length * 0.25)].date,
                incomingLeadsData[Math.floor(incomingLeadsData.length * 0.5)].date,
                incomingLeadsData[Math.floor(incomingLeadsData.length * 0.75)].date,
                incomingLeadsData[incomingLeadsData.length - 1].date
              ])).map((date, i) => (
                <span key={i}>{date}</span>
              ))}
            </div>

            {/* Custom Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / 1000) * 100}%`,
                top: `${hoveredPoint.y - 15}px`,
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: '90px'
              }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>{hoveredPoint.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 700 }}>{hoveredPoint.value}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Chart 2: Opportunity Trends (Bar Chart) ─── */}
        <div className="glass-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Opportunity Trends
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last synced just now</span>
            </div>

            {/* Filter selectors */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={trendsFilterRange}
                  onChange={(e) => setTrendsFilterRange(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Last Quarter">Last Quarter</option>
                  <option value="Last Month">Last Month</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={trendsFilterInterval}
                  onChange={(e) => setTrendsFilterInterval(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Daily">Daily</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'visible' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 1000 220" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="70" x2="1000" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="1000" y2="120" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="170" x2="1000" y2="170" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Rendering Bar Columns (Opportunity values) */}
              {opportunityTrendsData.map((d, index) => {
                const colWidth = Math.max(6, Math.min(24, 700 / trendsCount));
                const x = getTrendsX(index);
                const height = getTrendsHeight(d.value);
                const y = 190 - height;

                return (
                  <g key={d.date}>
                    <rect
                      x={x - colWidth/2}
                      y={y}
                      width={colWidth}
                      height={height > 0 ? height : 1} // minimal 1px height line for zero state
                      rx="4"
                      fill={height > 0 ? '#ff3366' : 'rgba(255,255,255,0.03)'}
                      style={{ transition: 'all 0.3s' }}
                    />
                    {/* Hover zone */}
                    <rect
                      x={x - colWidth/2 - 10}
                      y="20"
                      width={colWidth + 20}
                      height="170"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        setHoveredPoint({
                          x: x,
                          y: y - 20,
                          label: d.date,
                          value: `${Math.round(d.value)} Opportunities`
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X Axis Labels */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px', 
              fontSize: '0.68rem', 
              color: 'var(--text-muted)',
              paddingLeft: '50px',
              paddingRight: '50px'
            }}>
              {opportunityTrendsData.length > 0 && Array.from(new Set([
                opportunityTrendsData[0].date,
                opportunityTrendsData[Math.floor(opportunityTrendsData.length * 0.25)].date,
                opportunityTrendsData[Math.floor(opportunityTrendsData.length * 0.5)].date,
                opportunityTrendsData[Math.floor(opportunityTrendsData.length * 0.75)].date,
                opportunityTrendsData[opportunityTrendsData.length - 1].date
              ])).map((date, i) => (
                <span key={i}>{date}</span>
              ))}
            </div>

            {/* Custom Bar Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / 1000) * 100}%`,
                top: `${hoveredPoint.y - 15}px`,
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: '110px'
              }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>{hoveredPoint.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 700 }}>{hoveredPoint.value}</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Chart 3: Won Opportunities (Bar Chart) ─── */}
        <div className="glass-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Won Opportunities
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last synced just now</span>
            </div>

            {/* Filter selectors */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={wonFilterRange}
                  onChange={(e) => setWonFilterRange(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Last Year">Last Year</option>
                  <option value="Last Quarter">Last Quarter</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select 
                  value={wonFilterInterval}
                  onChange={(e) => setWonFilterInterval(e.target.value)}
                  style={{
                    appearance: 'none',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '5px 24px 5px 12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: '8px', pointerEvents: 'none', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* SVG Bar Chart for Won Opportunities */}
          <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'visible' }}>
            <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 1000 220" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="1000" y2="20" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="70" x2="1000" y2="70" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="120" x2="1000" y2="120" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />
              <line x1="0" y1="170" x2="1000" y2="170" stroke="var(--border-color)" strokeDasharray="3,3" strokeWidth="0.5" />

              {/* Rendering Bar Columns (Won Opportunity values) */}
              {wonOpportunitiesData.map((d, index) => {
                const colWidth = Math.max(6, Math.min(24, 700 / wonCount));
                const x = getWonX(index);
                const height = getWonHeight(d.value);
                const y = 190 - height;

                return (
                  <g key={d.date}>
                    <rect
                      x={x - colWidth/2}
                      y={y}
                      width={colWidth}
                      height={height > 0 ? height : 1}
                      rx="4"
                      fill={height > 0 ? '#38bdf8' : 'rgba(255,255,255,0.03)'}
                      style={{ transition: 'all 0.3s' }}
                    />
                    <rect
                      x={x - colWidth/2 - 10}
                      y="20"
                      width={colWidth + 20}
                      height="170"
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        setHoveredPoint({
                          x: x,
                          y: y - 20,
                          label: d.date,
                          value: `${Math.round(d.value)} Won Opportunities`
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* X Axis Labels */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '8px', 
              fontSize: '0.68rem', 
              color: 'var(--text-muted)',
              paddingLeft: '50px',
              paddingRight: '50px'
            }}>
              {wonOpportunitiesData.length > 0 && Array.from(new Set([
                wonOpportunitiesData[0].date,
                wonOpportunitiesData[Math.floor(wonOpportunitiesData.length * 0.25)].date,
                wonOpportunitiesData[Math.floor(wonOpportunitiesData.length * 0.5)].date,
                wonOpportunitiesData[Math.floor(wonOpportunitiesData.length * 0.75)].date,
                wonOpportunitiesData[wonOpportunitiesData.length - 1].date
              ])).map((date, i) => (
                <span key={i}>{date}</span>
              ))}
            </div>

            {/* Custom Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                left: `${(hoveredPoint.x / 1000) * 100}%`,
                top: `${hoveredPoint.y - 15}px`,
                transform: 'translateX(-50%)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                borderRadius: '6px',
                padding: '6px 10px',
                pointerEvents: 'none',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                minWidth: '110px'
              }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}>{hoveredPoint.label}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 700 }}>{hoveredPoint.value}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </WorkspaceLayout>
  );
}
