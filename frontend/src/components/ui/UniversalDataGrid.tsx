import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Eye, Pencil, Loader2, AlertCircle, DatabaseZap, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

/**
 * Column definition:
 *   { key: string, label: string, sortable?: boolean, render?: (value, row) => ReactNode }
 *
 * Usage example:
 *   <UniversalDataGrid
 *     endpointUrl="/api/v1/directory/profiles"
 *     columns={[
 *       { key: 'name',         label: 'Name',    sortable: true },
 *       { key: 'profile_type', label: 'Type',    sortable: true },
 *       { key: 'email',        label: 'Email' },
 *       { key: 'is_active',    label: 'Active',  render: (v) => v ? '✓' : '—' },
 *     ]}
 *     title="Directory Profiles"
 *     onAdd={() => {}}
 *     onView={(row) => {}}
 *     onEdit={(row) => {}}
 *   />
 */

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface UniversalDataGridProps {
  endpointUrl: string;
  columns?: ColumnDef[];
  title?: string;
  pageSize?: number;
  onAdd?: (() => void) | null;
  onView?: ((row: Record<string, unknown>) => void) | null;
  onEdit?: ((row: Record<string, unknown>) => void) | null;
  emptyMessage?: string;
  className?: string;
}

interface SortIconProps {
  colKey: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function deepGet(obj, key) {
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}

function highlight(text, query) {
  if (!query || !text) return text;
  const str = String(text);
  const idx = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    <>
      {str.slice(0, idx)}
      <mark className="bg-accent-primary/15 text-accent-primary rounded px-0.5">{str.slice(idx, idx + query.length)}</mark>
      {str.slice(idx + query.length)}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UniversalDataGrid({
  endpointUrl,
  columns       = [],
  title         = 'Records',
  pageSize      = 20,
  onAdd         = null,
  onView        = null,
  onEdit        = null,
  emptyMessage  = 'No records found.',
  className     = '',
}: UniversalDataGridProps) {
  const { token } = useAppContext();

  // ── State ──────────────────────────────────────────────────────────────────
  const [data,        setData]        = useState<Record<string, unknown>[]>([]);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState<string>('');
  const [page,        setPage]        = useState<number>(1);
  const [sortKey,     setSortKey]     = useState<string | null>(null);
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('asc');

  const searchRef   = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpointUrl}`, {
        signal:  controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? `Server error ${res.status}`);
      }

      const json = await res.json();
      setData(Array.isArray(json) ? json : (json.items ?? json.data ?? []));
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpointUrl, token]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  // ── Derived: sort → filter → paginate ────────────────────────────────────
  const sorted = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = deepGet(a, sortKey) ?? '';
      const bv = deepGet(b, sortKey) ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter(row =>
      columns.some(col => {
        const val = deepGet(row, col.key);
        return String(val ?? '').toLowerCase().includes(q);
      })
    );
  }, [sorted, search, columns]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, sortKey, sortDir]);

  // ── Sort handler ───────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderCell = (row, col) => {
    const raw = deepGet(row, col.key);
    if (col.render) return col.render(raw, row);
    if (raw === null || raw === undefined) return <span className="text-text-muted opacity-60 italic">—</span>;
    if (typeof raw === 'boolean') {
      return (
        <span className={`inline-flex py-1 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
          raw 
            ? 'bg-emerald-500/10 text-accent-green border border-emerald-500/20' 
            : 'bg-main text-text-muted border border-color'
        }`}>
          {raw ? 'Yes' : 'No'}
        </span>
      );
    }
    if (typeof raw === 'object') {
      return <code className="font-mono text-xs text-accent-primary bg-accent-primary/5 py-1 px-2 rounded">{JSON.stringify(raw)}</code>;
    }
    return highlight(String(raw), search);
  };

  const SortIcon = ({ colKey }: SortIconProps) => {
    if (sortKey !== colKey) return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="text-accent-primary" />
      : <ChevronDown size={12} className="text-accent-primary" />;
  };

  if (loading) {
    return (
      <div className={`flex flex-col gap-0 bg-card border border-color rounded-xl overflow-hidden font-body shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-[0.95rem] text-text-muted">
          <Loader2 size={28} className="animate-spin text-accent-primary" />
          <p>Loading {title}…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col gap-0 bg-card border border-color rounded-xl overflow-hidden font-body shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-[0.95rem] text-accent-danger">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="py-2 px-5 rounded-lg border border-red-500/40 bg-red-500/10 text-accent-danger text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:bg-red-500/20" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0 bg-card border border-color rounded-xl overflow-hidden font-body shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${className}`}>

      {/* ── Action Bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 p-4 md:py-4 md:px-6 border-b border-color flex-wrap bg-card">
        <div className="flex items-baseline gap-3 flex-wrap">
          {title && <h2 className="font-display text-[17px] font-extrabold text-text-main m-0 tracking-tight">{title}</h2>}
          <span className="text-xs font-mono bg-main py-0.5 px-2 rounded-full text-text-muted">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            {search && ` matching "${search}"`}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-text-muted pointer-events-none" aria-hidden="true" />
            <input
              ref={searchRef}
              id="udg-search-input"
              type="search"
              className="w-[240px] max-[640px]:w-[150px] py-2.5 pl-9 pr-4 bg-main border border-color rounded-xl text-text-main font-body text-[13px] transition-all duration-200 focus:outline-none focus:bg-card focus:border-accent-primary focus:ring-2 focus:ring-accent-primary focus:ring-opacity-20 appearance-none"
              placeholder="Search records…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label={`Search ${title}`}
            />
          </div>

          {/* Add New */}
          {onAdd && (
            <button
              id="udg-add-btn"
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border-none bg-accent-primary text-white font-display font-bold text-[13px] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(99,91,255,0.35)] shadow-[0_2px_8px_rgba(99,91,255,0.25)]"
              onClick={onAdd}
              aria-label={`Add new ${title}`}
            >
              <Plus size={15} />
              Add New
            </button>
          )}

          {/* Refresh */}
          <button
            id="udg-refresh-btn"
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-color bg-card text-text-muted cursor-pointer transition-all duration-200 hover:bg-main hover:text-text-main hover:border-black/20"
            onClick={fetchData}
            title="Refresh"
            aria-label="Refresh data"
          >
            <DatabaseZap size={15} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto overflow-y-auto max-h-[540px]">
        <table className="w-full border-collapse text-[14px] text-left table-auto" role="grid" aria-label={title}>
          <thead>
            <tr>
              <th className="py-3.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-text-muted bg-main border-b-2 border-color whitespace-nowrap sticky top-0 z-10 select-none w-12 text-center" aria-label="Row number">#</th>

              {columns.map(col => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-text-muted bg-main border-b-2 border-color whitespace-nowrap sticky top-0 z-10 select-none ${col.sortable ? 'cursor-pointer hover:text-text-main hover:bg-border' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}

              <th className="py-3.5 px-4 font-display text-xs font-bold uppercase tracking-wider text-text-muted bg-main border-b-2 border-color whitespace-nowrap sticky top-0 z-10 select-none w-[130px] text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="text-center py-16 px-4 text-text-muted text-[15px] font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="border-b border-color transition-colors duration-150 outline-none bg-card hover:bg-main focus-visible:bg-card-hover focus-visible:outline-2 focus-visible:outline-accent-primary/40 focus-visible:-outline-offset-2 last:border-b-0"
                  tabIndex={0}
                  aria-rowindex={(page - 1) * pageSize + idx + 1}
                >
                  {/* Row index */}
                  <td className="text-center font-mono text-xs text-text-muted w-12 py-3.5 px-4">
                    {(page - 1) * pageSize + idx + 1}
                  </td>

                  {/* Data cells */}
                  {columns.map(col => (
                    <td key={col.key} className="py-3.5 px-4 text-text-main align-middle max-w-[260px] max-[640px]:max-w-[140px] overflow-hidden truncate font-semibold">
                      {renderCell(row, col)}
                    </td>
                  ))}

                  {/* Actions cell */}
                  <td className="text-center whitespace-nowrap w-[130px] py-3.5 px-4">
                    {onView && (
                      <button
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-transparent text-xs font-bold font-display cursor-pointer transition-all duration-200 mx-1 text-accent-primary bg-accent-primary/5 hover:bg-accent-primary/10"
                        onClick={() => onView(row)}
                        aria-label={`View record ${row.id ?? idx + 1}`}
                      >
                        <Eye size={13} />
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-transparent text-xs font-bold font-display cursor-pointer transition-all duration-200 mx-1 text-accent-purple bg-accent-purple/5 hover:bg-accent-purple/10"
                        onClick={() => onEdit(row)}
                        aria-label={`Edit record ${row.id ?? idx + 1}`}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    )}
                    {!onView && !onEdit && (
                      <span className="text-text-muted opacity-60 italic">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 p-4 border-t border-color flex-wrap bg-card" role="navigation" aria-label="Pagination">
          <button
            className="min-w-[34px] h-[34px] px-2 rounded-lg border border-color bg-card text-text-muted text-[13px] font-semibold font-display cursor-pointer transition-all duration-200 inline-flex items-center justify-center hover:bg-main hover:text-text-main hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="First page"
          >«</button>

          <button
            className="min-w-[34px] h-[34px] px-2 rounded-lg border border-color bg-card text-text-muted text-[13px] font-semibold font-display cursor-pointer transition-all duration-200 inline-flex items-center justify-center hover:bg-main hover:text-text-main hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >‹</button>

          {/* Page number pills */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="text-text-muted text-[13px] px-1 pointer-events-none">…</span>
              ) : (
                <button
                  key={p}
                  className={`min-w-[34px] h-[34px] px-2 rounded-lg border border-color text-[13px] font-semibold font-display cursor-pointer transition-all duration-200 inline-flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                    p === page 
                      ? 'bg-accent-primary text-white border-accent-primary' 
                      : 'bg-card text-text-muted hover:bg-main hover:text-text-main hover:border-black/20'
                  }`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

          <button
            className="min-w-[34px] h-[34px] px-2 rounded-lg border border-color bg-card text-text-muted text-[13px] font-semibold font-display cursor-pointer transition-all duration-200 inline-flex items-center justify-center hover:bg-main hover:text-text-main hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >›</button>

          <button
            className="min-w-[34px] h-[34px] px-2 rounded-lg border border-color bg-card text-text-muted text-[13px] font-semibold font-display cursor-pointer transition-all duration-200 inline-flex items-center justify-center hover:bg-main hover:text-text-main hover:border-black/20 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
          >»</button>
        </div>
      )}

    </div>
  );
}
