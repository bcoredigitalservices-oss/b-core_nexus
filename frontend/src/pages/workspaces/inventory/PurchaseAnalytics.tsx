/**
 * PurchaseAnalytics — ERPNext-style Procurement Report Page
 *
 * Layout:
 *  1. Header with title and export action
 *  2. Filter bar: Supplier, Invoice Status, Date Range (From / To)
 *  3. Summary KPI strip
 *  4. Results table (populated after "Run Report")
 *
 * Data flows from the backend /procurement endpoints.
 * The component degrades gracefully when the API has no data.
 */

import React, { useState } from 'react';
import {
  PieChart,
  Filter,
  Download,
  RefreshCw,
  Building2,
  Receipt,
  Calendar,
  ChevronDown,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import WorkspaceLayout from '../../../layouts/WorkspaceLayout';
import { BUYING_SIDEBAR } from './buyingSidebarConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsRow {
  supplier_name: string;
  po_count: number;
  grn_count: number;
  invoice_count: number;
  total_po_amount: number;
  total_invoiced: number;
  pending_invoices: number;
}

interface FilterState {
  supplier_id: string;
  invoice_status: string;
  date_from: string;
  date_to: string;
}

type RunState = 'idle' | 'loading' | 'done' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#d4af37';
const ACCENT_DIM = 'rgba(212, 175, 55, 0.10)';
const ACCENT_BORDER = 'rgba(212, 175, 55, 0.22)';

const INVOICE_STATUSES = [
  { value: '',          label: 'All Statuses' },
  { value: 'Draft',     label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Paid',      label: 'Paid' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Draft:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', icon: <Clock size={12} /> },
  Submitted: { bg: 'rgba(99,91,255,0.12)',   color: '#6366f1', icon: <ChevronDown size={12} /> },
  Paid:      { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', icon: <CheckCircle2 size={12} /> },
  Cancelled: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', icon: <AlertCircle size={12} /> },
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon: React.ReactNode;
}

function FilterDropdown({ id, label, value, onChange, options, icon }: FilterDropdownProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 180px' }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        {icon}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 2.2rem 0.6rem 0.85rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            color: value ? 'var(--text-main)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            fontFamily: 'var(--font-body)',
            appearance: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
          }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

// ─── Date Field ───────────────────────────────────────────────────────────────

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function DateField({ id, label, value, onChange }: DateFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 160px' }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <Calendar size={11} />
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem 0.85rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-body)',
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

interface KpiStripItemProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function KpiStripItem({ label, value, icon, color }: KpiStripItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '1rem 1.25rem',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      flex: '1 1 180px',
    }}>
      <div style={{
        width: '36px', height: '36px',
        borderRadius: '10px',
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginTop: '1px' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PurchaseAnalytics() {
  const { authFetch } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [filters, setFilters] = useState<FilterState>({
    supplier_id: '',
    invoice_status: '',
    date_from: sixMonthsAgo,
    date_to: today,
  });

  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Derived aggregates from rows
  const totalPOAmount  = rows.reduce((s, r) => s + r.total_po_amount, 0);
  const totalInvoiced  = rows.reduce((s, r) => s + r.total_invoiced, 0);
  const totalPOCount   = rows.reduce((s, r) => s + r.po_count, 0);
  const totalPending   = rows.reduce((s, r) => s + r.pending_invoices, 0);

  const handleRunReport = async () => {
    setRunState('loading');
    setErrorMsg('');
    try {
      // Fetch purchase invoices to aggregate by supplier
      const [invoicesRes, ordersRes] = await Promise.all([
        authFetch('/procurement/purchase-invoices'),
        authFetch('/procurement/purchase-orders'),
      ]);

      // Build a supplier-keyed aggregation map from real API data
      const map: Record<string, AnalyticsRow> = {};

      const orders = Array.isArray(ordersRes) ? ordersRes : [];
      const invoices = Array.isArray(invoicesRes) ? invoicesRes : [];

      // Apply date / status filters
      const filterFrom = filters.date_from ? new Date(filters.date_from) : null;
      const filterTo   = filters.date_to   ? new Date(filters.date_to)   : null;
      const filterStatus = filters.invoice_status;

      for (const po of orders) {
        const poDate = new Date(po.order_date);
        if (filterFrom && poDate < filterFrom) continue;
        if (filterTo   && poDate > filterTo)   continue;
        if (filters.supplier_id && po.supplier_id !== filters.supplier_id) continue;

        const key = po.supplier_id;
        if (!map[key]) {
          map[key] = {
            supplier_name: po.supplier_id.slice(0, 8) + '…', // fallback; enriched below
            po_count: 0,
            grn_count: 0,
            invoice_count: 0,
            total_po_amount: 0,
            total_invoiced: 0,
            pending_invoices: 0,
          };
        }
        map[key].po_count += 1;
        map[key].total_po_amount += Number(po.total_amount) || 0;
      }

      for (const inv of invoices) {
        if (filterStatus && inv.status !== filterStatus) continue;
        const invDate = new Date(inv.invoice_date);
        if (filterFrom && invDate < filterFrom) continue;
        if (filterTo   && invDate > filterTo)   continue;
        if (filters.supplier_id && inv.supplier_id !== filters.supplier_id) continue;

        const key = inv.supplier_id;
        if (!map[key]) {
          map[key] = {
            supplier_name: inv.supplier_id.slice(0, 8) + '…',
            po_count: 0, grn_count: 0, invoice_count: 0,
            total_po_amount: 0, total_invoiced: 0, pending_invoices: 0,
          };
        }
        map[key].invoice_count += 1;
        map[key].total_invoiced += Number(inv.amount) || 0;
        if (inv.status === 'Draft' || inv.status === 'Submitted') {
          map[key].pending_invoices += 1;
        }
      }

      setRows(Object.values(map));
      setRunState('done');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load analytics data.');
      setRunState('error');
    }
  };

  const handleReset = () => {
    setFilters({ supplier_id: '', invoice_status: '', date_from: sixMonthsAgo, date_to: today });
    setRows([]);
    setRunState('idle');
    setErrorMsg('');
  };

  return (
    <WorkspaceLayout config={BUYING_SIDEBAR}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>

        {/* ── 1. Header ───────────────────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg-card)',
          border: `1px solid ${ACCENT_BORDER}`,
          borderRadius: '18px',
          padding: '1.75rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: `radial-gradient(circle, ${ACCENT_DIM} 0%, transparent 65%)`,
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1 }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${ACCENT}18`,
            }}>
              <PieChart size={22} color={ACCENT} />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)',
                fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', marginBottom: '2px',
              }}>
                Purchase Analytics
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Supplier-level spend analysis across Purchase Orders, GRNs, and Invoices.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', zIndex: 1 }}>
            <button
              id="analytics-export-btn"
              title="Export CSV — coming soon"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px',
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px', color: 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'not-allowed',
                opacity: 0.6,
              }}
            >
              <Download size={13} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── 2. Filter Bar ────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <Filter size={14} color={ACCENT} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              Report Filters
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            {/* Supplier — free-text UUID for now; swap with typeahead when supplier list is wired */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
              <label
                htmlFor="analytics-supplier"
                style={{
                  fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                <Building2 size={11} />
                Supplier
              </label>
              <input
                id="analytics-supplier"
                type="text"
                placeholder="Supplier ID or leave blank for all"
                value={filters.supplier_id}
                onChange={(e) => setFilters((f) => ({ ...f, supplier_id: e.target.value }))}
                style={{
                  padding: '0.6rem 0.85rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <FilterDropdown
              id="analytics-invoice-status"
              label="Invoice Status"
              value={filters.invoice_status}
              onChange={(v) => setFilters((f) => ({ ...f, invoice_status: v }))}
              options={INVOICE_STATUSES}
              icon={<Receipt size={11} />}
            />

            <DateField
              id="analytics-date-from"
              label="Date From"
              value={filters.date_from}
              onChange={(v) => setFilters((f) => ({ ...f, date_from: v }))}
            />

            <DateField
              id="analytics-date-to"
              label="Date To"
              value={filters.date_to}
              onChange={(v) => setFilters((f) => ({ ...f, date_to: v }))}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '1px' }}>
              <button
                id="analytics-run-btn"
                onClick={handleRunReport}
                disabled={runState === 'loading'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '0.6rem 1.1rem',
                  background: runState === 'loading'
                    ? 'var(--bg-card-hover)'
                    : `linear-gradient(135deg, ${ACCENT}, #b8860b)`,
                  border: 'none', borderRadius: '8px',
                  color: runState === 'loading' ? 'var(--text-muted)' : '#0b0f19',
                  fontSize: '0.85rem', fontWeight: 700,
                  cursor: runState === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: runState === 'loading' ? 'none' : `0 4px 12px ${ACCENT}28`,
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={13} style={{ animation: runState === 'loading' ? 'spin 1s linear infinite' : 'none' }} />
                {runState === 'loading' ? 'Running…' : 'Run Report'}
              </button>

              {runState !== 'idle' && (
                <button
                  id="analytics-reset-btn"
                  onClick={handleReset}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '0.6rem 0.9rem',
                    background: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px', color: 'var(--text-muted)',
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. Error Banner ─────────────────────────────────────────────── */}
        {runState === 'error' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '0.9rem 1.1rem',
            color: '#ef4444', fontSize: '0.85rem',
          }}>
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* ── 4. KPI Strip (visible after run) ────────────────────────────── */}
        {runState === 'done' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <KpiStripItem
              label="Purchase Orders"
              value={totalPOCount.toString()}
              icon={<ShoppingCart size={16} />}
              color={ACCENT}
            />
            <KpiStripItem
              label="Total PO Amount"
              value={formatCurrency(totalPOAmount)}
              icon={<DollarSign size={16} />}
              color="#818cf8"
            />
            <KpiStripItem
              label="Total Invoiced"
              value={formatCurrency(totalInvoiced)}
              icon={<Receipt size={16} />}
              color="#34d399"
            />
            <KpiStripItem
              label="Pending Invoices"
              value={totalPending.toString()}
              icon={<TrendingUp size={16} />}
              color={totalPending > 0 ? '#f59e0b' : '#34d399'}
            />
          </div>
        )}

        {/* ── 5. Results Table ─────────────────────────────────────────────── */}
        {runState === 'done' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-card-hover)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={16} color={ACCENT} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                  Supplier-wise Procurement Summary
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {rows.length} supplier{rows.length !== 1 ? 's' : ''}
              </span>
            </div>

            {rows.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <PieChart size={40} style={{ margin: '0 auto 1rem', opacity: 0.18 }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>No data in the selected date range</p>
                <p style={{ fontSize: '0.8rem' }}>Try expanding the date range or removing filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card-hover)' }}>
                      {[
                        'Supplier',
                        'Purchase Orders',
                        'Receipts (GRN)',
                        'Invoices',
                        'Total PO Amount',
                        'Total Invoiced',
                        'Pending Invoices',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '0.75rem 1rem',
                            textAlign: h === 'Supplier' ? 'left' : 'right',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: 'var(--text-muted)',
                            borderBottom: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px',
                              background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Building2 size={13} color={ACCENT} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                              {row.supplier_name}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>
                          {row.po_count}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {row.grn_count}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {row.invoice_count}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>
                          {formatCurrency(row.total_po_amount)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                          {formatCurrency(row.total_invoiced)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          {row.pending_invoices > 0 ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              padding: '2px 8px', borderRadius: '8px',
                              background: 'rgba(245,158,11,0.12)',
                              color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem',
                            }}>
                              <Clock size={10} />
                              {row.pending_invoices}
                            </span>
                          ) : (
                            <span style={{ color: '#34d399', fontWeight: 600 }}>0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals footer */}
                  <tfoot>
                    <tr style={{ background: 'var(--bg-card-hover)', borderTop: `2px solid ${ACCENT_BORDER}` }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                        Totals
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>{totalPOCount}</td>
                      <td style={{ padding: '0.85rem 1rem' }} />
                      <td style={{ padding: '0.85rem 1rem' }} />
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: ACCENT }}>{formatCurrency(totalPOAmount)}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#34d399' }}>{formatCurrency(totalInvoiced)}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: totalPending > 0 ? '#f59e0b' : '#34d399' }}>
                        {totalPending}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Idle state CTA */}
        {runState === 'idle' && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px dashed var(--border-color)',
            borderRadius: '14px',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <PieChart size={42} style={{ margin: '0 auto 1rem', opacity: 0.15 }} />
            <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px', color: 'var(--text-main)' }}>
              Set your filters and click "Run Report"
            </p>
            <p style={{ fontSize: '0.82rem' }}>
              Results will show supplier-level spend analytics across POs, GRNs, and Invoices.
            </p>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select:focus, input:focus { outline: none; border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${ACCENT}18; }
      `}</style>
    </WorkspaceLayout>
  );
}
