import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Eye, Pencil, Loader2, AlertCircle, DatabaseZap, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

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
  refreshTrigger?: number; // Added to trigger re-fetch from parent
}

interface SortIconProps {
  colKey: string;
}

function deepGet(obj: any, key: string) {
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}

function highlight(text: any, query: string) {
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
  refreshTrigger = 0,
}: UniversalDataGridProps) {
  const { token } = useAppContext();

  const [data,        setData]        = useState<Record<string, unknown>[]>([]);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState<string>('');
  const [page,        setPage]        = useState<number>(1);
  const [sortKey,     setSortKey]     = useState<string | null>(null);
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('asc');

  const searchRef   = useRef<HTMLInputElement>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}${endpointUrl}`, {
        signal: controller.signal,
        cache: 'no-store', // Ensures fresh data
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
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [endpointUrl, token]);

  // Re-fetch when endpoint changes OR when refreshTrigger changes
  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData, refreshTrigger]);

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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderCell = (row: any, col: ColumnDef) => {
    const raw = deepGet(row, col.key);
    if (col.render) return col.render(raw, row);
    if (raw === null || raw === undefined) return <span className="text-text-muted opacity-60 italic">—</span>;
    if (typeof raw === 'boolean') {
      return (
        <span className={`inline-flex py-1 px-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
          raw ? 'bg-emerald-500/10 text-accent-green border border-emerald-500/20' : 'bg-main text-text-muted border border-color'
        }`}>
          {raw ? 'Yes' : 'No'}
        </span>
      );
    }
    return highlight(String(raw), search);
  };

  const SortIcon = ({ colKey }: SortIconProps) => {
    if (sortKey !== colKey) return <ChevronUp size={12} className="opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="text-accent-primary" />
      : <ChevronDown size={12} className="text-accent-primary" />;
  };

  if (loading && data.length === 0) {
    return (
      <div className={`flex flex-col gap-0 bg-card border border-color rounded-xl overflow-hidden font-body shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-[0.95rem] text-text-muted">
          <Loader2 size={28} className="animate-spin text-accent-primary" />
          <p>Loading {title}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-0 bg-card border border-color rounded-xl overflow-hidden font-body shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${className}`}>
      <div className="flex items-center justify-between gap-4 p-4 md:py-4 md:px-6 border-b border-color flex-wrap bg-card">
        <div className="flex items-baseline gap-3 flex-wrap">
          {title && <h2 className="font-display text-[17px] font-extrabold text-text-main m-0 tracking-tight">{title}</h2>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            ref={searchRef}
            type="search"
            className="w-[240px] py-2.5 pl-9 pr-4 bg-main border border-color rounded-xl text-[13px] outline-none focus:border-accent-primary"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {onAdd && (
            <button className="flex items-center gap-2 py-2 px-4 rounded-xl bg-accent-primary text-white font-bold text-[13px]" onClick={onAdd}>
              <Plus size={15} /> Add New
            </button>
          )}
          <button className="w-9 h-9 flex items-center justify-center rounded-xl border bg-card text-text-muted" onClick={fetchData}>
            <DatabaseZap size={15} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[540px]">
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr>
              <th className="py-3.5 px-4 bg-main border-b-2">#</th>
              {columns.map(col => (
                <th key={col.key} className="py-3.5 px-4 bg-main border-b-2 cursor-pointer" onClick={col.sortable ? () => handleSort(col.key) : undefined}>
                  {col.label} <SortIcon colKey={col.key} />
                </th>
              ))}
              <th className="py-3.5 px-4 bg-main border-b-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, idx) => (
              <tr key={idx} className="border-b border-color bg-card hover:bg-main">
                <td className="py-3.5 px-4 text-center">{(page - 1) * pageSize + idx + 1}</td>
                {columns.map(col => <td key={col.key} className="py-3.5 px-4">{renderCell(row, col)}</td>)}
                <td className="py-3.5 px-4 text-center">
                  {onView && <button onClick={() => onView(row)}><Eye size={15}/></button>}
                  {onEdit && <button onClick={() => onEdit(row)}><Pencil size={15}/></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}