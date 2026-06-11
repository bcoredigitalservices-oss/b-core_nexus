import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Activity } from 'lucide-react';

const VIRTUAL_LIST_SIZE = 100000;
const VIRTUAL_ITEMS = Array.from({ length: VIRTUAL_LIST_SIZE }, (_, i) => ({
  index: i,
  sku: `SKU-NEX-${String(i + 1).padStart(6, '0')}`,
  title: `Industrial Core Nexus Module Unit #${i + 1}`,
  custom_attributes: {
    criticality: i % 10 === 0 ? 'High' : 'Normal',
    power_draw_w: 120 + (i % 8) * 15,
    factory_batch: `B-${1000 + Math.floor(i / 100)}`
  }
}));

export default function VirtualGridTab() {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: VIRTUAL_LIST_SIZE,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} /> Asynchronous DOM Virtualization Grid
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
          Rendering **100,000 grid records** smoothly at 60 FPS using `@tanstack/react-virtual`.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', margin: '0.5rem 0' }}>
        <div style={{ background: 'rgba(14, 19, 34, 0.6)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Records Injected</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-display)' }}>100,000</div>
        </div>
        <div style={{ background: 'rgba(14, 19, 34, 0.6)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active DOM Elements</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-display)' }}>~15-20 rows</div>
        </div>
        <div style={{ background: 'rgba(14, 19, 34, 0.6)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Render Performance</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-display)' }}>&lt; 1ms</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="grid-header">
          <div>Grid Index</div>
          <div>SKU & Title</div>
          <div>Attributes (JSONB payload)</div>
        </div>
        <div
          ref={parentRef}
          style={{
            height: '400px',
            overflow: 'auto',
            border: '1px solid var(--border-color)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            backgroundColor: 'var(--bg-input)'
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative'
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = VIRTUAL_ITEMS[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  className="grid-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    borderBottom: '1px solid #1c253b'
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    # {item.index + 1}
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)', marginRight: '0.75rem' }}>
                      {item.sku}
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>{item.title}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(item.custom_attributes)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
