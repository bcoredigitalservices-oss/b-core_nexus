import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const { token, authFetch } = useAppContext();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  
  // Submit and status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [importResult, setImportResult] = useState<{ imported_count: number; errors: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCsvParse = (text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one item data row.');
    }
    
    // Clean headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    
    // Map columns (SKU, Name, Type, UOM) case-insensitively or with fallback naming
    const skuIdx = headers.findIndex(h => h === 'sku' || h.includes('sku'));
    const nameIdx = headers.findIndex(h => h === 'name' || h.includes('name') || h.includes('title'));
    const typeIdx = headers.findIndex(h => h === 'type' || h.includes('type') || h.includes('catalog'));
    const uomIdx = headers.findIndex(h => h === 'uom' || h.includes('uom') || h.includes('unit'));

    if (skuIdx === -1) throw new Error("CSV Header must contain 'SKU' column.");
    if (nameIdx === -1) throw new Error("CSV Header must contain 'Name' column.");
    if (typeIdx === -1) throw new Error("CSV Header must contain 'Type' (or 'Catalog Type') column.");
    if (uomIdx === -1) throw new Error("CSV Header must contain 'UOM' (or 'Default UOM') column.");

    const items = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cells: string[] = [];
      let insideQuote = false;
      let currentCell = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cells.push(currentCell.trim());
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim());

      if (cells.length < headers.length) {
        continue; // Skip malformed/empty rows silently
      }

      const skuVal = cells[skuIdx].replace(/['"]/g, '').trim();
      const nameVal = cells[nameIdx].replace(/['"]/g, '').trim();
      const typeVal = cells[typeIdx].replace(/['"]/g, '').trim().toLowerCase();
      const uomVal = cells[uomIdx].replace(/['"]/g, '').trim();

      if (!skuVal && !nameVal) continue; // Skip empty rows
      if (!skuVal) throw new Error(`Row ${i + 1}: SKU field is required.`);
      if (!nameVal) throw new Error(`Row ${i + 1}: Name field is required.`);

      items.push({
        sku: skuVal,
        name: nameVal,
        catalog_type: typeVal || 'stock',
        default_uom: uomVal || 'Nos',
        barcode: null,
        item_group_id: null
      });
    }

    if (items.length === 0) {
      throw new Error('No valid rows found in the CSV file.');
    }

    return items;
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setFile(selectedFile);
    setErrorMsg('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = handleCsvParse(text);
        setParsedItems(parsed);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error parsing CSV file.');
        setFile(null);
        setParsedItems([]);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
      setFile(null);
      setParsedItems([]);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) return;

    setSubmitting(true);
    setErrorMsg('');
    setImportResult(null);

    try {
      const res = await authFetch('/catalog/items/import', {
        method: 'POST',
        body: JSON.stringify(parsedItems)
      });

      if (res && res.status === 'success') {
        setImportResult({
          imported_count: res.imported_count,
          errors: res.errors || []
        });
        
        // Success feedback
        if (!res.errors || res.errors.length === 0) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Import process encountered an error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '1.5rem'
      }}
    >
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: '600px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-card-hover)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)', margin: 0 }}>
            <FileSpreadsheet size={20} color="var(--accent-primary)" />
            Bulk Import CSV
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Upload a .csv file containing columns: SKU, Name, Type, UOM to register items in bulk.
          </p>
        </div>

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {importResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', backgroundColor: importResult.errors.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)', border: importResult.errors.length > 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: importResult.errors.length > 0 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
              <CheckCircle2 size={16} />
              <span>Import Completed: {importResult.imported_count} item(s) created!</span>
            </div>
            {importResult.errors.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Duplicate/Error details:</span>
                <ul style={{ maxHeight: '100px', overflowY: 'auto', paddingLeft: '1.25rem', color: 'var(--accent-danger)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {importResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* File select / Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'rgba(99, 91, 255, 0.04)' : 'var(--bg-card-hover)',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Upload size={32} color={isDragging ? 'var(--accent-primary)' : 'var(--text-muted)'} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {file ? 'File selected' : 'Drag & drop your CSV file here'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {file ? file.name : 'or click to browse local files'}
              </span>
            </div>

            {file && (
              <div 
                style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.75rem', 
                  color: 'var(--accent-primary)',
                  backgroundColor: 'rgba(99, 91, 255, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={12} />
                <span>{parsedItems.length} items parsed</span>
              </div>
            )}
          </div>

          {/* Template Info / Instructions */}
          {!file && (
            <div style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', fontSize: '0.75rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileSpreadsheet size={14} color="var(--accent-primary)" />
                CSV Format Instructions
              </div>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>
                The CSV file must contain a header row. Columns mapped: **SKU**, **Name**, **Type** (e.g. stock, service, raw_material, consumable), and **UOM** (e.g. Nos, Kg, L, Box, Hr).
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-input)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', whiteSpace: 'pre' }}>
{`SKU,Name,Type,UOM
ITEM-101,Wrench Tool,stock,Nos
ITEM-102,Standard Shipping,service,Hr
ITEM-103,Lubricating Gel,consumable,L`}
              </div>
            </div>
          )}

          {/* Parsed items preview list */}
          {file && parsedItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Import Preview (Showing up to 3 items)</span>
              <div 
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  fontSize: '0.75rem',
                  backgroundColor: 'var(--bg-input)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card-hover)' }}>
                      <th style={{ padding: '6px 10px', fontWeight: 600 }}>SKU</th>
                      <th style={{ padding: '6px 10px', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '6px 10px', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '6px 10px', fontWeight: 600 }}>UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 3).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < 2 ? '1px solid var(--border-color)' : 'none' }}>
                        <td style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)' }}>{item.sku}</td>
                        <td style={{ padding: '6px 10px' }}>{item.name}</td>
                        <td style={{ padding: '6px 10px' }}>
                          <span className="badge badge-t3" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            {item.catalog_type}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px' }}>{item.default_uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={submitting || parsedItems.length === 0}
            >
              {submitting ? 'Importing...' : `Import ${parsedItems.length} Item(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
