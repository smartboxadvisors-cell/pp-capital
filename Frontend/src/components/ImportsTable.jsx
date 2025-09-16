import { useEffect, useMemo, useState } from 'react';
import { fetchImports } from '../api/imports';
import useDebounce from '../hooks/useDebounce';
import Filters from './Filters';
import Pagination from './Pagination';
import styles from '../styles/table.module.css';

export default function ImportsTable() {
  // Paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Inputs (controlled)
  const [schemeInput, setSchemeInput] = useState('');
  const [ratingInput, setRatingInput] = useState('');
  const [isinInput, setIsinInput] = useState('');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');

  // Debounced values
  const scheme = useDebounce(schemeInput);
  const rating = useDebounce(ratingInput);
  const isin = useDebounce(isinInput);
  const from = useDebounce(fromInput);
  const to = useDebounce(toInput);

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset page to 1 when filters change
  useEffect(() => { setPage(1); }, [scheme, rating, isin, from, to, limit]);

  const params = useMemo(() => ({
    page, limit, scheme, rating, isin, from, to
  }), [page, limit, scheme, rating, isin, from, to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { items, total, totalPages } = await fetchImports(params);
        if (!cancelled) {
          setRows(items);
          setTotal(total);
          setTotalPages(totalPages);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params]);

  const onReset = () => {
    setSchemeInput('');
    setRatingInput('');
    setIsinInput('');
    setFromInput('');
    setToInput('');
  };

  return (
    <div className={styles.wrapper}>
      <Filters
        schemeInput={schemeInput} setSchemeInput={setSchemeInput}
        ratingInput={ratingInput} setRatingInput={setRatingInput}
        isinInput={isinInput} setIsinInput={setIsinInput}
        fromInput={fromInput} setFromInput={setFromInput}
        toInput={toInput} setToInput={setToInput}
        limit={limit} setLimit={setLimit}
        onReset={onReset}
        total={total}
        loading={loading}
      />

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.card}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>{[
                (<th key="h1" className={styles.th}>Scheme</th>),
                (<th key="h2" className={styles.th}>Instrument</th>),
                (<th key="h3" className={styles.th}>Quantity</th>),
                (<th key="h4" className={styles.th}>% to NAV</th>),
                (<th key="h5" className={styles.th}>Market Value (₹)</th>),
                (<th key="h6" className={styles.th}>Report Date</th>),
                (<th key="h7" className={styles.th}>ISIN</th>),
                (<th key="h8" className={styles.th}>Rating</th>),
                (<th key="h9" className={styles.th}>YTM</th>),
                (<th key="h10" className={styles.th}>Modified</th>),
              ]}</tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={`${styles.tr} ${i % 2 ? styles.trOdd : ''}`}>{Array.from({ length: 10 }).map((__, j) => (<td key={j} className={styles.td}><div className={styles.skeleton} /></td>))}</tr>
                ))
              ) : rows.length === 0 ? (
                <tr className={styles.tr}><td className={styles.td} colSpan={10} style={{ textAlign: 'center', padding: '24px 8px', opacity: 0.7 }}>No results found.</td></tr>
              ) : (
                rows.map((r, i) => {
                  const modified = r._modifiedTime ? new Date(r._modifiedTime).toLocaleString() : '—';
                  const qty = (r.quantity ?? '—');
                  const pct = (r.pct_to_nav ?? r.pct_to_NAV ?? '—');
                  const marketValue = r.market_value ? r.market_value : (r.market_value_lacs ? r.market_value_lacs * 100000 : '—');

                  return (
                    <tr key={r._id} className={`${styles.tr} ${i % 2 ? styles.trOdd : ''} ${styles.rowHover}`} title={`Scheme: ${r.scheme_name || '—'}\nInstrument: ${r.instrument_name || '—'}\nQuantity: ${qty}\n% to NAV: ${pct}\nMarket Value: ₹ ${marketValue === '—' ? '—' : Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}\nISIN: ${r.isin || 'NA'}\nRating: ${r.rating || '—'}\nYTM: ${r.ytm ?? '—'}\nReport Date: ${r.report_date || '—'}`}>{[
                      (<td key="c1" className={`${styles.td} ${styles.tdClamp}`} title={r.scheme_name || ''}><strong>{r.scheme_name || '—'}</strong></td>),
                      (<td key="c2" className={`${styles.td} ${styles.tdClamp}`} title={r.instrument_name || ''}>{r.instrument_name || '—'}</td>),
                      (<td key="c3" className={styles.td}>{qty}</td>),
                      (<td key="c4" className={styles.td}>{pct}</td>),
                      (<td key="c5" className={styles.td}>{marketValue === '—' ? '—' : `₹ ${Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</td>),
                      (<td key="c6" className={styles.td}>{r.report_date || '—'}</td>),
                      (<td key="c7" className={`${styles.td} ${styles.tdClamp}`} title={r.isin || ''}>{r.isin || 'NA'}</td>),
                      (<td key="c8" className={styles.td}>{r.rating || '—'}</td>),
                      (<td key="c9" className={styles.td}>{r.ytm ?? '—'}</td>),
                      (<td key="c10" className={styles.td}>{modified}</td>),
                    ]}</tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} setPage={setPage} totalPages={totalPages} disabled={loading} />
      </div>
    </div>
  );
}

/** ------- helpers ------- */
const fmtMarketValue = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
};

const fmtNum = (n, opts = {}) =>
  typeof n === 'number'
    ? n.toLocaleString(undefined, { maximumFractionDigits: 2, ...opts })
    : n != null && !Number.isNaN(Number(n))
      ? Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, ...opts })
      : '—';

const fmtInt = (n) =>
  typeof n === 'number'
    ? Math.round(n).toLocaleString()
    : n != null && !Number.isNaN(Number(n))
      ? Math.round(Number(n)).toLocaleString()
      : '—';

const fmtPct = (v, digits = 2) => {
  if (v == null) return '—';
  const num = Number(v);
  if (Number.isNaN(num)) return '—';
  return `${(num * 100).toFixed(digits)}%`;
};

const fmtYTM = (v) => {
  if (v == null) return '—';
  const num = Number(v);
  if (Number.isNaN(num)) return '—';
  return `${(num * 100).toFixed(4)}%`;
};

const fmtDate = (report_date, modifiedISO) => {
  if (typeof report_date === 'string' && report_date.trim()) {
    return report_date.replace(/,(\d)/, ', $1');
  }
  if (typeof modifiedISO === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(modifiedISO)) {
    try {
      const d = new Date(modifiedISO);
      return d.toLocaleString();
    } catch {}
  }
  return '—';
};


