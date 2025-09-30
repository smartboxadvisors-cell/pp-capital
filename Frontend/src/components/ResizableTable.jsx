// src/components/ResizableTable.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import styles from '../styles/table.module.css';

export default function ResizableTable({ rows, loading }) {
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({
    scheme: 200,
    instrument: 180,
    quantity: 100,
    pctToNav: 100,
    marketValue: 150,
    reportDate: 120,
    isin: 140,
    rating: 80,
    ytm: 80,
    modified: 140
  });

  // Row heights state
  const [rowHeights, setRowHeights] = useState({});

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeData, setResizeData] = useState(null);
  const tableRef = useRef(null);

  // Column definitions
  const columns = [
    { key: 'scheme', label: 'Scheme', field: 'scheme_name' },
    { key: 'instrument', label: 'Instrument', field: 'instrument_name' },
    { key: 'quantity', label: 'Quantity', field: 'quantity' },
    { key: 'pctToNav', label: '% to NAV', field: 'pct_to_nav' },
    { key: 'marketValue', label: 'Market Value (₹)', field: 'market_value' },
    { key: 'reportDate', label: 'Report Date', field: 'report_date' },
    { key: 'isin', label: 'ISIN', field: 'isin' },
    { key: 'rating', label: 'Rating', field: 'rating' },
    { key: 'ytm', label: 'YTM', field: 'ytm' },
    { key: 'modified', label: 'Modified', field: '_modifiedTime' }
  ];

  // Handle column resize start
  const handleColumnResizeStart = useCallback((e, columnKey) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeData({
      type: 'column',
      key: columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey]
    });
  }, [columnWidths]);

  // Handle row resize start
  const handleRowResizeStart = useCallback((e, rowIndex) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeData({
      type: 'row',
      key: rowIndex,
      startY: e.clientY,
      startHeight: rowHeights[rowIndex] || 40
    });
  }, [rowHeights]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizeData) return;

    if (resizeData.type === 'column') {
      const deltaX = e.clientX - resizeData.startX;
      const newWidth = Math.max(50, resizeData.startWidth + deltaX);
      
      setColumnWidths(prev => ({
        ...prev,
        [resizeData.key]: newWidth
      }));
    } else if (resizeData.type === 'row') {
      const deltaY = e.clientY - resizeData.startY;
      const newHeight = Math.max(30, resizeData.startHeight + deltaY);
      
      setRowHeights(prev => ({
        ...prev,
        [resizeData.key]: newHeight
      }));
    }
  }, [isResizing, resizeData]);

  // Handle mouse up (end resize)
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeData(null);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = resizeData?.type === 'column' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp, resizeData]);

  // Auto-fit column to content
  const autoFitColumn = useCallback((columnKey) => {
    if (!tableRef.current) return;
    
    const cells = tableRef.current.querySelectorAll(`[data-column="${columnKey}"]`);
    let maxWidth = 100;
    
    cells.forEach(cell => {
      const textWidth = cell.scrollWidth + 20; // Add padding
      maxWidth = Math.max(maxWidth, textWidth);
    });
    
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.min(maxWidth, 400) // Cap at 400px
    }));
  }, []);

  // Format cell value
  const formatCellValue = (row, column) => {
    const value = row[column.field];
    
    switch (column.key) {
      case 'quantity':
        return value ?? '—';
      case 'pctToNav':
        return row.pct_to_nav ?? row.pct_to_NAV ?? row['% to NAV'] ?? '—';
      case 'marketValue':
        const marketValue = row.market_value || (row.market_value_lacs ? row.market_value_lacs * 100000 : null);
        return marketValue ? `₹ ${Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '—';
      case 'modified':
        return value ? new Date(value).toLocaleString() : '—';
      case 'isin':
        return value || 'NA';
      default:
        return value || '—';
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.tableScroll}>
        <table ref={tableRef} className={`${styles.table} ${styles.resizableTable}`}>
          <thead className={styles.thead}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${styles.th} ${styles.resizableTh}`}
                  style={{ width: columnWidths[column.key] }}
                  data-column={column.key}
                >
                  <div className={styles.thContent}>
                    <span 
                      onDoubleClick={() => autoFitColumn(column.key)}
                      title="Double-click to auto-fit"
                    >
                      {column.label}
                    </span>
                    {index < columns.length - 1 && (
                      <div
                        className={styles.columnResizer}
                        onMouseDown={(e) => handleColumnResizeStart(e, column.key)}
                        title="Drag to resize column"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr 
                  key={`sk-${i}`} 
                  className={`${styles.tr} ${i % 2 ? styles.trOdd : ''}`}
                  style={{ height: rowHeights[i] || 'auto' }}
                >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={column.key} 
                        className={styles.td}
                        style={{ 
                          width: columnWidths[column.key],
                          position: colIndex === columns.length - 1 ? 'relative' : 'static'
                        }}
                        data-column={column.key}
                      >
                        <div className={styles.skeleton} />
                        {colIndex === columns.length - 1 && (
                          <div
                            className={styles.rowResizer}
                            onMouseDown={(e) => handleRowResizeStart(e, i)}
                            title="Drag to resize row"
                          />
                        )}
                      </td>
                    ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr className={styles.tr}>
                <td 
                  className={styles.td} 
                  colSpan={columns.length} 
                  style={{ textAlign: 'center', padding: '24px 8px', opacity: 0.7 }}
                >
                  No results found.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const rowHeight = rowHeights[i] || 'auto';
                
                return (
                  <tr
                    key={row._id}
                    className={`${styles.tr} ${i % 2 ? styles.trOdd : ''} ${styles.rowHover} ${styles.resizableRow}`}
                    style={{ height: rowHeight }}
                    title={
                      `Scheme: ${row.scheme_name || '—'}\n` +
                      `Instrument: ${row.instrument_name || '—'}\n` +
                      `Quantity: ${row.quantity ?? '—'}\n` +
                      `% to NAV: ${row.pct_to_nav ?? row.pct_to_NAV ?? '—'}\n` +
                      `Market Value: ${formatCellValue(row, { key: 'marketValue' })}\n` +
                      `ISIN: ${row.isin || 'NA'}\n` +
                      `Rating: ${row.rating || '—'}\n` +
                      `YTM: ${row.ytm ?? '—'}\n` +
                      `Report Date: ${row.report_date || '—'}`
                    }
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={column.key}
                        className={`${styles.td} ${column.key === 'scheme' || column.key === 'instrument' || column.key === 'isin' ? styles.tdClamp : ''}`}
                        style={{ 
                          width: columnWidths[column.key],
                          maxWidth: columnWidths[column.key],
                          position: colIndex === columns.length - 1 ? 'relative' : 'static'
                        }}
                        data-column={column.key}
                        title={column.key === 'scheme' || column.key === 'instrument' || column.key === 'isin' ? formatCellValue(row, column) : ''}
                      >
                        <div className={styles.cellContent}>
                          {column.key === 'scheme' ? (
                            <strong>{formatCellValue(row, column)}</strong>
                          ) : (
                            formatCellValue(row, column)
                          )}
                        </div>
                        {colIndex === columns.length - 1 && (
                          <div
                            className={styles.rowResizer}
                            onMouseDown={(e) => handleRowResizeStart(e, i)}
                            title="Drag to resize row"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
