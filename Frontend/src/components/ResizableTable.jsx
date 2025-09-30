// src/components/ResizableTable.jsx
import { useState, useRef, useCallback, useEffect } from 'react';
import styles from '../styles/table.module.css';

export default function ResizableTable({ rows, loading }) {
  // View mode state
  const [viewMode, setViewMode] = useState('compact'); // 'compact', 'expanded', 'auto', 'fit-window'
  
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
  
  // Auto-calculated dimensions based on content
  const [autoColumnWidths, setAutoColumnWidths] = useState({});
  const [autoRowHeights, setAutoRowHeights] = useState({});
  
  // Window-fit dimensions
  const [windowFitWidths, setWindowFitWidths] = useState({});
  const [availableWidth, setAvailableWidth] = useState(0);

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

  // Calculate optimal dimensions based on content
  const calculateOptimalDimensions = useCallback(() => {
    if (!tableRef.current || !rows.length) return;
    
    const newAutoColumnWidths = {};
    const newAutoRowHeights = {};
    
    // Calculate column widths based on content
    columns.forEach(column => {
      const cells = tableRef.current.querySelectorAll(`[data-column="${column.key}"]`);
      let maxWidth = 80; // Minimum width
      
      cells.forEach(cell => {
        const content = cell.textContent || '';
        // Estimate width based on content length and font size
        const estimatedWidth = Math.max(
          content.length * 8 + 20, // 8px per character + padding
          column.label.length * 10 + 20 // Header width
        );
        maxWidth = Math.max(maxWidth, estimatedWidth);
      });
      
      newAutoColumnWidths[column.key] = Math.min(maxWidth, 500); // Cap at 500px
    });
    
    // Calculate row heights based on content
    rows.forEach((row, index) => {
      let maxHeight = 40; // Minimum height
      
      columns.forEach(column => {
        const content = formatCellValue(row, column);
        const contentLength = String(content).length;
        
        // Estimate height based on content length and column width
        const columnWidth = newAutoColumnWidths[column.key] || columnWidths[column.key];
        const estimatedLines = Math.ceil(contentLength * 8 / (columnWidth - 20));
        const estimatedHeight = Math.max(40, estimatedLines * 20 + 10);
        
        maxHeight = Math.max(maxHeight, estimatedHeight);
      });
      
      newAutoRowHeights[index] = Math.min(maxHeight, 200); // Cap at 200px
    });
    
    setAutoColumnWidths(newAutoColumnWidths);
    setAutoRowHeights(newAutoRowHeights);
  }, [rows, columns, columnWidths]);

  // Calculate window-fit dimensions
  const calculateWindowFitDimensions = useCallback(() => {
    if (!tableRef.current) return;
    
    const tableContainer = tableRef.current.closest(`.${styles.tableScroll}`);
    if (!tableContainer) return;
    
    const containerWidth = tableContainer.clientWidth;
    const scrollbarWidth = 20; // Account for potential scrollbar
    const padding = 40; // Account for padding and borders
    const usableWidth = containerWidth - scrollbarWidth - padding;
    
    setAvailableWidth(usableWidth);
    
    // Define column priorities and minimum widths
    const columnPriorities = {
      scheme: { priority: 1, minWidth: 120, idealRatio: 0.25 },
      instrument: { priority: 2, minWidth: 100, idealRatio: 0.20 },
      marketValue: { priority: 3, minWidth: 80, idealRatio: 0.15 },
      isin: { priority: 4, minWidth: 80, idealRatio: 0.12 },
      rating: { priority: 5, minWidth: 60, idealRatio: 0.08 },
      quantity: { priority: 6, minWidth: 60, idealRatio: 0.08 },
      pctToNav: { priority: 7, minWidth: 60, idealRatio: 0.08 },
      reportDate: { priority: 8, minWidth: 70, idealRatio: 0.10 },
      ytm: { priority: 9, minWidth: 50, idealRatio: 0.06 },
      modified: { priority: 10, minWidth: 80, idealRatio: 0.12 }
    };
    
    // Calculate total minimum width needed
    const totalMinWidth = Object.values(columnPriorities).reduce((sum, col) => sum + col.minWidth, 0);
    
    const newWindowFitWidths = {};
    
    if (usableWidth >= totalMinWidth) {
      // We have enough space, distribute proportionally
      let remainingWidth = usableWidth;
      
      // First pass: assign minimum widths
      columns.forEach(column => {
        const colConfig = columnPriorities[column.key];
        newWindowFitWidths[column.key] = colConfig.minWidth;
        remainingWidth -= colConfig.minWidth;
      });
      
      // Second pass: distribute remaining width based on ideal ratios
      const totalIdealRatio = Object.values(columnPriorities).reduce((sum, col) => sum + col.idealRatio, 0);
      
      columns.forEach(column => {
        const colConfig = columnPriorities[column.key];
        const additionalWidth = Math.floor((remainingWidth * colConfig.idealRatio) / totalIdealRatio);
        newWindowFitWidths[column.key] += additionalWidth;
      });
      
      // Handle any remaining pixels due to rounding
      const totalAssigned = Object.values(newWindowFitWidths).reduce((sum, width) => sum + width, 0);
      const leftover = usableWidth - totalAssigned;
      if (leftover > 0) {
        // Give leftover pixels to the highest priority column
        newWindowFitWidths.scheme += leftover;
      }
    } else {
      // Not enough space, use minimum widths and let it scroll
      columns.forEach(column => {
        const colConfig = columnPriorities[column.key];
        newWindowFitWidths[column.key] = colConfig.minWidth;
      });
    }
    
    setWindowFitWidths(newWindowFitWidths);
  }, [columns]);

  // Handle window resize
  const handleWindowResize = useCallback(() => {
    if (viewMode === 'fit-window') {
      calculateWindowFitDimensions();
    }
  }, [viewMode, calculateWindowFitDimensions]);

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

  // Auto-fit all columns
  const autoFitAllColumns = useCallback(() => {
    columns.forEach(column => {
      autoFitColumn(column.key);
    });
  }, [columns, autoFitColumn]);

  // Get effective dimensions based on view mode
  const getEffectiveColumnWidth = useCallback((columnKey) => {
    switch (viewMode) {
      case 'auto':
        return autoColumnWidths[columnKey] || columnWidths[columnKey];
      case 'expanded':
        return Math.max(columnWidths[columnKey], 200);
      case 'fit-window':
        return windowFitWidths[columnKey] || columnWidths[columnKey];
      default:
        return columnWidths[columnKey];
    }
  }, [viewMode, autoColumnWidths, columnWidths, windowFitWidths]);

  const getEffectiveRowHeight = useCallback((rowIndex) => {
    switch (viewMode) {
      case 'auto':
        return autoRowHeights[rowIndex] || rowHeights[rowIndex] || 'auto';
      case 'expanded':
        return Math.max(rowHeights[rowIndex] || 60, 60);
      default:
        return rowHeights[rowIndex] || 'auto';
    }
  }, [viewMode, autoRowHeights, rowHeights]);

  // Calculate dimensions when data changes
  useEffect(() => {
    if (viewMode === 'auto' && rows.length > 0) {
      // Delay calculation to ensure DOM is updated
      const timer = setTimeout(calculateOptimalDimensions, 100);
      return () => clearTimeout(timer);
    }
  }, [rows, viewMode, calculateOptimalDimensions]);

  // Calculate window-fit dimensions when needed
  useEffect(() => {
    if (viewMode === 'fit-window') {
      // Delay calculation to ensure DOM is updated
      const timer = setTimeout(calculateWindowFitDimensions, 100);
      return () => clearTimeout(timer);
    }
  }, [viewMode, calculateWindowFitDimensions]);

  // Add window resize listener
  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [handleWindowResize]);

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
      {/* View Mode Controls */}
      <div className={styles.tableControls}>
        <div className={styles.viewModeControls}>
          <label className={styles.controlLabel}>View Mode:</label>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.modeButton} ${viewMode === 'compact' ? styles.active : ''}`}
              onClick={() => setViewMode('compact')}
              title="Compact view - minimal space"
            >
              Compact
            </button>
            <button
              className={`${styles.modeButton} ${viewMode === 'expanded' ? styles.active : ''}`}
              onClick={() => setViewMode('expanded')}
              title="Expanded view - more space for content"
            >
              Expanded
            </button>
            <button
              className={`${styles.modeButton} ${viewMode === 'auto' ? styles.active : ''}`}
              onClick={() => setViewMode('auto')}
              title="Auto view - size based on content"
            >
              Auto-fit
            </button>
            <button
              className={`${styles.modeButton} ${viewMode === 'fit-window' ? styles.active : ''}`}
              onClick={() => setViewMode('fit-window')}
              title="Fit to window - all columns fit in viewport width"
            >
              Fit Window
            </button>
          </div>
        </div>
        <div className={styles.tableActions}>
          <button
            className={styles.actionButton}
            onClick={autoFitAllColumns}
            title="Auto-fit all columns to content"
          >
            Auto-fit All
          </button>
        </div>
      </div>
      
      <div className={styles.tableScroll}>
        <table ref={tableRef} className={`${styles.table} ${styles.resizableTable} ${
          viewMode === 'fit-window' ? styles.fitWindowMode : 
          viewMode === 'expanded' ? styles.expandedMode :
          viewMode === 'auto' ? styles.autoMode : ''
        }`}>
          <thead className={styles.thead}>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`${styles.th} ${styles.resizableTh}`}
                  style={{ width: getEffectiveColumnWidth(column.key) }}
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
                  style={{ height: getEffectiveRowHeight(i) }}
                >
                    {columns.map((column, colIndex) => (
                      <td 
                        key={column.key} 
                        className={`${styles.td} ${viewMode !== 'compact' ? styles.tdExpanded : ''}`}
                        style={{ 
                          width: getEffectiveColumnWidth(column.key),
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
                    style={{ height: getEffectiveRowHeight(i) }}
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
                        className={`${styles.td} ${
                          viewMode === 'compact' && (column.key === 'scheme' || column.key === 'instrument' || column.key === 'isin') 
                            ? styles.tdClamp 
                            : styles.tdExpanded
                        }`}
                        style={{ 
                          width: getEffectiveColumnWidth(column.key),
                          maxWidth: getEffectiveColumnWidth(column.key),
                          position: colIndex === columns.length - 1 ? 'relative' : 'static'
                        }}
                        data-column={column.key}
                        title={viewMode === 'compact' ? formatCellValue(row, column) : ''}
                      >
                        <div className={`${styles.cellContent} ${viewMode !== 'compact' ? styles.cellContentExpanded : ''}`}>
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
