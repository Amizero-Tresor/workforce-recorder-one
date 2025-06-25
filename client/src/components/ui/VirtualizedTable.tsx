'use client';

import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps {
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    width: number;
    render?: (value: any, row: any) => React.ReactNode;
  }>;
  height: number;
  rowHeight?: number;
  onRowClick?: (row: any) => void;
}

export function VirtualizedTable({
  data,
  columns,
  height,
  rowHeight = 50,
  onRowClick
}: VirtualizedTableProps) {
  const totalWidth = useMemo(() => 
    columns.reduce((sum, col) => sum + col.width, 0), 
    [columns]
  );

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = data[index];
    
    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors ${
          onRowClick ? 'cursor-pointer' : ''
        }`}
        onClick={() => onRowClick?.(row)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-2 text-sm text-gray-900 truncate"
          >
            {column.render ? column.render(row[column.key], row) : row[column.key]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {columns.map((column) => (
          <div
            key={column.key}
            style={{ width: column.width }}
            className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            {column.label}
          </div>
        ))}
      </div>
      
      {/* Virtualized Rows */}
      <List
        height={height}
        itemCount={data.length}
        itemSize={rowHeight}
        width={totalWidth}
      >
        {Row}
      </List>
    </div>
  );
}