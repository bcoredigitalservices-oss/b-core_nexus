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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999] p-6">
      <div className="glass-panel w-full max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border border-color rounded-2xl p-8 shadow-xl flex flex-col gap-6 relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 bg-card-hover border border-color text-text-muted cursor-pointer p-1.5 rounded-full flex items-center justify-center transition-all duration-200 hover:text-text-main hover:border-accent-primary"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex flex-col gap-1.5 border-b border-color pb-4">
          <h3 className="text-[1.25rem] font-extrabold text-text-main flex items-center gap-2 font-display m-0">
            <FileSpreadsheet size={20} className="text-accent-primary" />
            Bulk Import CSV
          </h3>
          <p className="text-[0.8rem] text-text-muted m-0">
            Upload a .csv file containing columns: SKU, Name, Type, UOM to register items in bulk.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[0.85rem]">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {importResult && (
          <div className={`flex flex-col gap-2 p-4 rounded-lg text-[0.85rem] border ${
            importResult.errors.length > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className={`flex items-center gap-1.5 font-bold ${
              importResult.errors.length > 0 ? 'text-amber-500' : 'text-[#00f5a0]'
            }`}>
              <CheckCircle2 size={16} />
              <span>Import Completed: {importResult.imported_count} item(s) created!</span>
            </div>
            {importResult.errors.length > 0 && (
              <div className="flex flex-col gap-1 mt-1.5">
                <span className="text-[0.75rem] font-semibold text-text-muted">Duplicate/Error details:</span>
                <ul className="max-h-[100px] overflow-y-auto pl-5 text-red-400 text-[0.75rem] flex flex-col gap-0.5 list-disc">
                  {importResult.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* File select / Drag & Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`border-2 border-dashed rounded-xl py-10 px-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
              isDragging ? 'border-accent-primary bg-accent-primary/5' : 'border-color bg-card-hover'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Upload size={32} className={isDragging ? 'text-accent-primary' : 'text-text-muted'} />

            <div className="flex flex-col gap-1">
              <span className="text-[0.9rem] font-bold">
                {file ? 'File selected' : 'Drag & drop your CSV file here'}
              </span>
              <span className="text-[0.75rem] text-text-muted">
                {file ? file.name : 'or click to browse local files'}
              </span>
            </div>

            {file && (
              <div className="mt-2 text-[0.75rem] text-accent-primary bg-accent-primary/10 py-1 px-2.5 rounded-full flex items-center gap-1.5">
                <FileText size={12} />
                <span>{parsedItems.length} items parsed</span>
              </div>
            )}
          </div>

          {/* Template Info / Instructions */}
          {!file && (
            <div className="bg-card-hover border border-color rounded-lg p-4 text-[0.75rem]">
              <div className="font-bold mb-1.5 flex items-center gap-1">
                <FileSpreadsheet size={14} className="text-accent-primary" />
                CSV Format Instructions
              </div>
              <p className="m-0 mb-2 text-text-muted leading-relaxed">
                The CSV file must contain a header row. Columns mapped: **SKU**, **Name**, **Type** (e.g. stock, service, raw_material, consumable), and **UOM** (e.g. Nos, Kg, L, Box, Hr).
              </p>
              <div className="font-mono text-text-muted bg-input p-2 rounded border border-color leading-relaxed overflow-x-auto whitespace-pre">
{`SKU,Name,Type,UOM
ITEM-101,Wrench Tool,stock,Nos
ITEM-102,Standard Shipping,service,Hr
ITEM-103,Lubricating Gel,consumable,L`}
              </div>
            </div>
          )}

          {/* Parsed items preview list */}
          {file && parsedItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.75rem] font-bold text-text-muted">Import Preview (Showing up to 3 items)</span>
              <div className="border border-color rounded-lg overflow-hidden text-[0.75rem] bg-input">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-color bg-card-hover text-text-muted">
                      <th className="py-2 px-3.5 font-semibold">SKU</th>
                      <th className="py-2 px-3.5 font-semibold">Name</th>
                      <th className="py-2 px-3.5 font-semibold">Type</th>
                      <th className="py-2 px-3.5 font-semibold">UOM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 3).map((item, idx) => (
                      <tr key={idx} className={idx < 2 ? 'border-b border-color' : ''}>
                        <td className="py-2 px-3.5 font-mono">{item.sku}</td>
                        <td className="py-2 px-3.5">{item.name}</td>
                        <td className="py-2 px-3.5">
                          <span className="badge badge-t3 text-[0.65rem] uppercase">
                            {item.catalog_type}
                          </span>
                        </td>
                        <td className="py-2 px-3.5">{item.default_uom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex gap-4 border-t border-color pt-5">
            <button 
              type="button" 
              className="btn btn-secondary flex-1" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary flex-1" 
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

