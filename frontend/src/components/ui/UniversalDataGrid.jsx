import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Eye, Pencil, Loader2, AlertCircle, DatabaseZap, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import './UniversalDataGrid.css';

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

// ── Helpers ────────────────────────────────────────────────────────────────────
function deepGet(obj, key) {
  // Supports dot-notation keys e.g. "custom_attributes.region"
  return key.split('.').reduce((acc, k) => acc?.[k], obj);
}

function highlight(text, query) {
  if (!query || !text) return text;
  const str   = String(text);
  const idx   = str.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return str;
  return (
    <>
      {str.slice(0, idx)}
      <mark className="udg-highlight">{str.slice(idx, idx + query.length)}</mark>
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
}) {
  const { token } = useAppContext();

  // ── State ──────────────────────────────────────────────────────────────────
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [sortKey,     setSortKey]     = useState(null);
  const [sortDir,     setSortDir]     = useState('asc'); // 'asc' | 'desc'

  const searchRef   = useRef(null);
  const abortRef    = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller  = new AbortController();
    abortRef.current  = controller;

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
      // Accept either a bare array or { items: [], total: n } envelope
      setData(Array.isArray(json) ? json : (json.items ?? json.data ?? []));
    } catch (err) {
      if (err.name === 'AbortError') return; // silently discard cancelled fetches
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

  // Reset to page 1 on search change
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
    if (raw === null || raw === undefined) return <span className="udg-null">—</span>;
    if (typeof raw === 'boolean') {
      return (
        <span className={`udg-bool udg-bool--${raw ? 'true' : 'false'}`}>
          {raw ? 'Yes' : 'No'}
        </span>
      );
    }
    if (typeof raw === 'object') {
      return <code className="udg-json">{JSON.stringify(raw)}</code>;
    }
    return highlight(String(raw), search);
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronUp size={12} className="udg-sort-idle" />;
    return sortDir === 'asc'
      ? <ChevronUp   size={12} className="udg-sort-active" />
      : <ChevronDown size={12} className="udg-sort-active" />;
  };

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`udg-root ${className}`}>
        <div className="udg-state udg-state--loading">
          <Loader2 size={28} className="udg-spinner" />
          <p>Loading {title}…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`udg-root ${className}`}>
        <div className="udg-state udg-state--error">
          <AlertCircle size={28} />
          <p>{error}</p>
          <button className="udg-retry-btn" onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Full render ────────────────────────────────────────────────────────────
  return (
    <div className={`udg-root ${className}`}>

      {/* ── Action Bar ────────────────────────────────────────────────────── */}
      <div className="udg-toolbar">
        <div className="udg-toolbar__left">
          {title && <h2 className="udg-title">{title}</h2>}
          <span className="udg-count">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            {search && ` matching "${search}"`}
          </span>
        </div>

        <div className="udg-toolbar__right">
          {/* Search */}
          <div className="udg-search-wrap">
            <Search size={14} className="udg-search-icon" aria-hidden="true" />
            <input
              ref={searchRef}
              id="udg-search-input"
              type="search"
              className="udg-search"
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
              className="udg-add-btn"
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
            className="udg-icon-btn"
            onClick={fetchData}
            title="Refresh"
            aria-label="Refresh data"
          >
            <DatabaseZap size={15} />
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="udg-table-wrap">
        <table className="udg-table" role="grid" aria-label={title}>
          <thead>
            <tr>
              <th className="udg-th udg-th--index" aria-label="Row number">#</th>

              {columns.map(col => (
                <th
                  key={col.key}
                  className={`udg-th ${col.sortable ? 'udg-th--sortable' : ''}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : col.sortable ? 'none' : undefined
                  }
                >
                  <span className="udg-th-inner">
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}

              <th className="udg-th udg-th--actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="udg-empty"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="udg-row"
                  tabIndex={0}
                  aria-rowindex={(page - 1) * pageSize + idx + 1}
                >
                  {/* Row index */}
                  <td className="udg-td udg-td--index">
                    {(page - 1) * pageSize + idx + 1}
                  </td>

                  {/* Data cells */}
                  {columns.map(col => (
                    <td key={col.key} className="udg-td">
                      {renderCell(row, col)}
                    </td>
                  ))}

                  {/* Actions cell */}
                  <td className="udg-td udg-td--actions">
                    {onView && (
                      <button
                        className="udg-action-btn udg-action-btn--view"
                        onClick={() => onView(row)}
                        aria-label={`View record ${row.id ?? idx + 1}`}
                      >
                        <Eye size={13} />
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        className="udg-action-btn udg-action-btn--edit"
                        onClick={() => onEdit(row)}
                        aria-label={`Edit record ${row.id ?? idx + 1}`}
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    )}
                    {!onView && !onEdit && (
                      <span className="udg-null">—</span>
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
        <div className="udg-pagination" role="navigation" aria-label="Pagination">
          <button
            className="udg-page-btn"
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="First page"
          >«</button>

          <button
            className="udg-page-btn"
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
                <span key={`ellipsis-${i}`} className="udg-page-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  className={`udg-page-btn ${p === page ? 'udg-page-btn--active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}

          <button
            className="udg-page-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >›</button>

          <button
            className="udg-page-btn"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
          >»</button>
        </div>
      )}

    </div>
  );
}
