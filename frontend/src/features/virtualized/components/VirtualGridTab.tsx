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
    factory_batch: `B-${1000 + Math.floor(i / 100)}`,
  },
}));

const STATS = [
  { label: 'Total Records Injected', value: '100,000', color: 'var(--accent-purple)' },
  { label: 'Active DOM Elements', value: '~15-20 rows', color: 'var(--accent-blue)' },
  { label: 'Render Performance', value: '< 1ms', color: 'var(--accent-green)' },
];

export default function VirtualGridTab() {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: VIRTUAL_LIST_SIZE,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  return (
    <div className="glass-panel flex flex-col gap-4">
      <div>
        <h3 className="flex items-center gap-2 text-[var(--accent-blue)]">
          <Activity size={20} /> Asynchronous DOM Virtualization Grid
        </h3>
        <p className="mt-1 text-[0.85rem] leading-[1.4] text-[var(--text-muted)]">
          Rendering <strong>100,000 grid records</strong> smoothly at 60 FPS using <code>@tanstack/react-virtual</code>.
        </p>
      </div>

      <div className="my-2 grid grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-md border border-[var(--border-color)] bg-[rgba(14,19,34,0.6)] p-3">
            <span className="text-[0.7rem] uppercase text-[var(--text-muted)]">{stat.label}</span>
            <div className="font-[family-name:var(--font-display)] text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        <div className="grid-header">
          <div>Grid Index</div>
          <div>SKU & Title</div>
          <div>Attributes (JSONB payload)</div>
        </div>
        <div
          ref={parentRef}
          className="h-[400px] overflow-auto rounded-b-lg border border-t-0 border-[var(--border-color)] bg-[var(--bg-input)]"
        >
          <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const item = VIRTUAL_ITEMS[virtualItem.index];
              const isHighCriticality = item.custom_attributes.criticality === 'High';
              return (
                <div
                  key={virtualItem.key}
                  className="grid-row absolute left-0 top-0 w-full border-b border-[#1c253b]"
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                    backgroundColor: isHighCriticality ? 'rgba(255, 51, 102, 0.05)' : undefined,
                  }}
                >
                  <div className="font-[family-name:var(--font-mono)] text-[0.8rem] text-[var(--text-muted)]">
                    # {item.index + 1}
                  </div>
                  <div>
                    <span className="mr-3 font-[family-name:var(--font-mono)] font-semibold text-[var(--accent-blue)]">
                      {item.sku}
                    </span>
                    <span className="text-[0.85rem]">{item.title}</span>
                    {isHighCriticality && (
                      <span className="ml-2 rounded-full border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 px-1.5 py-px text-[0.6rem] font-semibold text-[var(--accent-danger)]">
                        HIGH
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap font-[family-name:var(--font-mono)] text-[0.75rem] text-[#818cf8]">
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
