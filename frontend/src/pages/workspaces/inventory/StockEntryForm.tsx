import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Package, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Scan,
  Calendar,
  Clock,
  Warehouse as WarehouseIcon
} from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

interface Item {
  id: string;
  sku: string;
  name: string;
  base_price: number;
}

interface FormItemRow {
  id: string; // local temporary uuid
  item_id: string;
  source_warehouse_id: string;
  target_warehouse_id: string;
  qty: number;
  basic_rate: number;
}

export default function StockEntryForm() {
  const navigate = useNavigate();

  // Master Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Form Fields
  const [series, setSeries] = useState('STE-');
  const [entryType, setEntryType] = useState('Material Receipt');
  const [editPostingDateTime, setEditPostingDateTime] = useState(false);
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [postingTime, setPostingTime] = useState(new Date().toTimeString().slice(0, 5));
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [itemRows, setItemRows] = useState<FormItemRow[]>([]);

  // Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_INVENTORY = `${import.meta.env.VITE_API_URL}/api/v1/workspaces/inventory`;

  useEffect(() => {
    // Keep date/time updated every minute if "Edit Posting Date and Time" is disabled
    let interval: NodeJS.Timeout;
    if (!editPostingDateTime) {
      setPostingDate(new Date().toISOString().slice(0, 10));
      setPostingTime(new Date().toTimeString().slice(0, 5));

      interval = setInterval(() => {
        setPostingDate(new Date().toISOString().slice(0, 10));
        setPostingTime(new Date().toTimeString().slice(0, 5));
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [editPostingDateTime]);

  useEffect(() => {
    const fetchMetaData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('bcore_token')}` };
        const [whResponse, itemsResponse] = await Promise.all([
          fetch(`${API_INVENTORY}/warehouses`, { headers }),
          fetch(`${API_INVENTORY}/items?limit=500`, { headers })
        ]);

        if (whResponse.ok) {
          const whData = await whResponse.json();
          setWarehouses(whData || []);
          if (whData?.length > 0) {
            setDefaultWarehouseId(whData[0].id);
          }
        }
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setItems(itemsData?.items || itemsData || []);
        }
      } catch (err) {
        console.error('Failed to load form meta data:', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetaData();
  }, []);

  const handleAddRow = (selectedItemId = '', rate = 0) => {
    const newRow: FormItemRow = {
      id: Math.random().toString(36).substr(2, 9),
      item_id: selectedItemId || (items[0]?.id || ''),
      source_warehouse_id: entryType === 'Material Receipt' ? '' : (defaultWarehouseId || warehouses[0]?.id || ''),
      target_warehouse_id: entryType === 'Material Issue' ? '' : (defaultWarehouseId || warehouses[0]?.id || ''),
      qty: 1,
      basic_rate: rate || (items.find(i => i.id === selectedItemId)?.base_price || items[0]?.base_price || 0)
    };
    setItemRows([...itemRows, newRow]);
  };

  const handleRemoveRow = (id: string) => {
    setItemRows(itemRows.filter(row => row.id !== id));
  };

  const handleRowChange = (id: string, field: keyof FormItemRow, value: any) => {
    setItemRows(
      itemRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          // If item_id changed, auto-update rate
          if (field === 'item_id') {
            const item = items.find(i => i.id === value);
            if (item) {
              updatedRow.basic_rate = item.base_price;
            }
          }
          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const matchedItem = items.find(
      item => item.sku.toLowerCase() === barcode.trim().toLowerCase()
    );

    if (matchedItem) {
      handleAddRow(matchedItem.id, matchedItem.base_price);
      setSuccessMessage(`Scanned: ${matchedItem.name} (${matchedItem.sku})`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(`Barcode/SKU "${barcode}" not found in inventory catalog.`);
      setTimeout(() => setErrorMessage(null), 4000);
    }
    setBarcode('');
  };

  const handleSaveOrSubmit = async (shouldSubmit: boolean) => {
    if (itemRows.length === 0) {
      setErrorMessage("Please add at least one item line to save the Stock Entry.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Prepare payload
    const payload = {
      series,
      entry_type: entryType,
      posting_date: postingDate,
      posting_time: postingTime + ":00",
      default_warehouse_id: defaultWarehouseId || null,
      status: 'Draft',
      items: itemRows.map(row => ({
        item_id: row.item_id,
        source_warehouse_id: row.source_warehouse_id || null,
        target_warehouse_id: row.target_warehouse_id || null,
        qty: Number(row.qty),
        basic_rate: Number(row.basic_rate),
        custom_attributes: {}
      }))
    };

    try {
      const token = localStorage.getItem('bcore_token');
      const response = await fetch(`${API_INVENTORY}/stock-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to save Stock Entry.');
      }

      const savedEntry = await response.json();

      if (shouldSubmit) {
        // Post submit call
        const submitResponse = await fetch(`${API_INVENTORY}/stock-entries/${savedEntry.id}/submit`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!submitResponse.ok) {
          const err = await submitResponse.json();
          throw new Error(err.detail || 'Stock Entry saved, but failed to submit to ledger.');
        }

        setSuccessMessage('Stock Entry saved and submitted successfully to the stock ledger.');
      } else {
        setSuccessMessage('Stock Entry saved successfully as a Draft.');
      }

      setTimeout(() => {
        navigate('/workspace/inventory/stock');
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', width: '100%', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-main)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Back and title bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/workspace/inventory/stock')}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.5rem 1rem',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => handleSaveOrSubmit(false)}
              disabled={submitting}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '40px',
                padding: '0 1.25rem',
                fontWeight: 600
              }}
            >
              <Save size={16} />
              Save Draft
            </button>
            <button
              onClick={() => handleSaveOrSubmit(true)}
              disabled={submitting}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                color: '#0b0f19',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '40px',
                padding: '0 1.5rem',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(212,175,55,0.3)'
              }}
            >
              <CheckCircle size={16} />
              Submit to Ledger
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#ef4444',
            padding: '1rem',
            borderRadius: '10px',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10b981',
            padding: '1rem',
            borderRadius: '10px',
            fontSize: '0.9rem'
          }}>
            <CheckCircle size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Master Box Form */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={22} color="#d4af37" />
              New Stock Entry
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Formulate entry registers to add, remove, or transfer items between warehouse storage pools.
            </p>
          </div>

          {/* Top Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Series</label>
              <select 
                value={series} 
                onChange={(e) => setSeries(e.target.value)}
                style={{ height: '42px', borderRadius: '8px' }}
              >
                <option value="STE-">STE-</option>
                <option value="STE-YYYY-">STE-YYYY-</option>
                <option value="STE-.####">STE-.####</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Stock Entry Type</label>
              <select 
                value={entryType} 
                onChange={(e) => {
                  setEntryType(e.target.value);
                  // Clear warehouse configurations that don't match entry type
                  setItemRows([]);
                }}
                style={{ height: '42px', borderRadius: '8px' }}
              >
                <option value="Material Receipt">Material Receipt</option>
                <option value="Material Issue">Material Issue</option>
                <option value="Material Transfer">Material Transfer</option>
                <option value="Manufacture">Manufacture</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Posting Date
              </label>
              <input 
                type="date" 
                value={postingDate} 
                disabled={!editPostingDateTime}
                onChange={(e) => setPostingDate(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', opacity: editPostingDateTime ? 1 : 0.6 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} /> Posting Time
              </label>
              <input 
                type="time" 
                value={postingTime} 
                disabled={!editPostingDateTime}
                onChange={(e) => setPostingTime(e.target.value)}
                style={{ height: '42px', borderRadius: '8px', opacity: editPostingDateTime ? 1 : 0.6 }}
              />
            </div>
          </div>

          {/* Toggle Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              id="toggle-edit-datetime"
              checked={editPostingDateTime} 
              onChange={(e) => setEditPostingDateTime(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="toggle-edit-datetime" style={{ fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
              Edit Posting Date and Time
            </label>
          </div>

          <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

          {/* Mid Section: Default Warehouse and Barcode Scan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WarehouseIcon size={14} /> Default Warehouse
              </label>
              {loadingMeta ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading warehouses...</div>
              ) : (
                <select 
                  value={defaultWarehouseId} 
                  onChange={(e) => setDefaultWarehouseId(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                >
                  <option value="">Select default warehouse...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scan size={14} /> Scan Barcode (SKU)
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Enter SKU (e.g. SKU-FG-001) & press Enter" 
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px', paddingRight: '40px' }}
                />
                <Scan size={18} style={{ position: 'absolute', right: '12px', top: '12px', opacity: 0.5 }} />
              </div>
            </form>
          </div>

          {/* Items Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={18} />
              Item Lines
            </h3>
            <button
              onClick={() => handleAddRow()}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.4rem 0.85rem',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <Plus size={14} />
              Add Row
            </button>
          </div>

          {/* Items Table */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem', width: '60px' }}>No.</th>
                    <th style={{ padding: '0.75rem 1rem', minWidth: '220px' }}>Item Code</th>
                    {entryType !== 'Material Receipt' && (
                      <th style={{ padding: '0.75rem 1rem', minWidth: '180px' }}>Source Warehouse</th>
                    )}
                    {entryType !== 'Material Issue' && (
                      <th style={{ padding: '0.75rem 1rem', minWidth: '180px' }}>Target Warehouse</th>
                    )}
                    <th style={{ padding: '0.75rem 1rem', width: '110px' }}>Qty</th>
                    <th style={{ padding: '0.75rem 1rem', width: '130px' }}>Basic Rate ($)</th>
                    <th style={{ padding: '0.75rem 1rem', width: '60px', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {itemRows.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={5 + (entryType !== 'Material Receipt' ? 1 : 0) + (entryType !== 'Material Issue' ? 1 : 0)} 
                        style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                      >
                        No items added yet. Click "Add Row" or scan a barcode to add stock movement lines.
                      </td>
                    </tr>
                  ) : (
                    itemRows.map((row, index) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <select
                            value={row.item_id}
                            onChange={(e) => handleRowChange(row.id, 'item_id', e.target.value)}
                            style={{ height: '36px', borderRadius: '6px', fontSize: '0.85rem' }}
                          >
                            {items.map(i => (
                              <option key={i.id} value={i.id}>{i.sku} — {i.name}</option>
                            ))}
                          </select>
                        </td>
                        {entryType !== 'Material Receipt' && (
                          <td style={{ padding: '0.5rem 1rem' }}>
                            <select
                              value={row.source_warehouse_id}
                              onChange={(e) => handleRowChange(row.id, 'source_warehouse_id', e.target.value)}
                              style={{ height: '36px', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                              <option value="">Select source warehouse...</option>
                              {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        {entryType !== 'Material Issue' && (
                          <td style={{ padding: '0.5rem 1rem' }}>
                            <select
                              value={row.target_warehouse_id}
                              onChange={(e) => handleRowChange(row.id, 'target_warehouse_id', e.target.value)}
                              style={{ height: '36px', borderRadius: '6px', fontSize: '0.85rem' }}
                            >
                              <option value="">Select target warehouse...</option>
                              {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <input
                            type="number"
                            min="0.0001"
                            step="any"
                            value={row.qty}
                            onChange={(e) => handleRowChange(row.id, 'qty', Number(e.target.value))}
                            style={{ height: '36px', borderRadius: '6px', fontSize: '0.85rem', width: '90px' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 1rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.basic_rate}
                            onChange={(e) => handleRowChange(row.id, 'basic_rate', Number(e.target.value))}
                            style={{ height: '36px', borderRadius: '6px', fontSize: '0.85rem', width: '110px' }}
                          />
                        </td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleRemoveRow(row.id)}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              color: '#ff3366',
                              opacity: 0.8
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
