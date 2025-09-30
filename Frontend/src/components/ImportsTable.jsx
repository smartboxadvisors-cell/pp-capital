// src/components/ImportsTable.jsx
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

  // ----- Controlled inputs (all fields) -----
  const [schemeInput, setSchemeInput] = useState('');
  const [instrumentInput, setInstrumentInput] = useState('');
  const [ratingsInput, setRatingsInput] = useState([]);
  const [isinInput, setIsinInput] = useState('');
  const [fromInput, setFromInput] = useState(''); // report date from (yyyy-mm-dd)
  const [toInput, setToInput] = useState('');     // report date to   (yyyy-mm-dd)

  // Ranges
  const [quantityMin, setQuantityMin] = useState(null);
  const [quantityMax, setQuantityMax] = useState(null);
  const [pctToNavMin, setPctToNavMin] = useState(null);
  const [pctToNavMax, setPctToNavMax] = useState(null);
  const [ytmMin, setYtmMin] = useState(null);
  const [ytmMax, setYtmMax] = useState(null);
  const [mvMin, setMvMin] = useState(null);   // rupees
  const [mvMax, setMvMax] = useState(null);

  // Modified window
  const [modifiedFrom, setModifiedFrom] = useState('');
  const [modifiedTo, setModifiedTo] = useState('');

  // ----- Debounced values (to avoid refetch every keystroke) -----
  const scheme = useDebounce(schemeInput);
  const instrument = useDebounce(instrumentInput);
  const ratings = useDebounce(ratingsInput);
  const isin = useDebounce(isinInput);
  const from = useDebounce(fromInput);
  const to = useDebounce(toInput);

  const quantityMinD = useDebounce(quantityMin);
  const quantityMaxD = useDebounce(quantityMax);
  const pctToNavMinD = useDebounce(pctToNavMin);
  const pctToNavMaxD = useDebounce(pctToNavMax);
  const ytmMinD = useDebounce(ytmMin);
  const ytmMaxD = useDebounce(ytmMax);
  const mvMinD = useDebounce(mvMin);
  const mvMaxD = useDebounce(mvMax);

  const modifiedFromD = useDebounce(modifiedFrom);
  const modifiedToD = useDebounce(modifiedTo);

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reset page to 1 when ANY filter changes
  useEffect(() => {
    setPage(1);
  }, [
    scheme, instrument, ratings, isin,
    from, to,
    quantityMinD, quantityMaxD,
    pctToNavMinD, pctToNavMaxD,
    ytmMinD, ytmMaxD,
    modifiedFromD, modifiedToD,
    limit,mvMinD, mvMaxD, 
  ]);

  const params = useMemo(() => ({
    page,
    limit,
    scheme,
    instrument,
    isin,
    ratings,
    from,
    to,
    quantityMin: quantityMinD,
    quantityMax: quantityMaxD,
    pctToNavMin: pctToNavMinD,
    pctToNavMax: pctToNavMaxD,
    ytmMin: ytmMinD,
    ytmMax: ytmMaxD,
    modifiedFrom: modifiedFromD,
    modifiedTo: modifiedToD,
    mvMin: mvMinD,          
    mvMax: mvMaxD,
    // hideIncomplete: false, // keep false unless your DB is clean
  }), [
    page, limit,
    scheme, instrument, isin, ratings,
    from, to,
    quantityMinD, quantityMaxD,
    pctToNavMinD, pctToNavMaxD,
    ytmMinD, ytmMaxD,
    modifiedFromD, modifiedToD,
    mvMinD, mvMaxD,  
  ]);

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
    setInstrumentInput('');
    setRatingsInput([]);
    setIsinInput('');
    setFromInput('');
    setToInput('');
    setQuantityMin(null);
    setQuantityMax(null);
    setPctToNavMin(null);
    setPctToNavMax(null);
    setYtmMin(null);
    setYtmMax(null);
    setModifiedFrom('');
    setModifiedTo('');
    setMvMin(null);
    setMvMax(null);
  };

  return (
    <div className={styles.wrapper}>
      <Filters
        // text
        schemeInput={schemeInput} setSchemeInput={setSchemeInput}
        instrumentInput={instrumentInput} setInstrumentInput={setInstrumentInput}
        ratingsInput={ratingsInput} setRatingsInput={setRatingsInput}
        isinInput={isinInput} setIsinInput={setIsinInput}

        // ranges
        quantityMin={quantityMin} setQuantityMin={setQuantityMin}
        quantityMax={quantityMax} setQuantityMax={setQuantityMax}
        pctToNavMin={pctToNavMin} setPctToNavMin={setPctToNavMin}
        pctToNavMax={pctToNavMax} setPctToNavMax={setPctToNavMax}
        ytmMin={ytmMin} setYtmMin={setYtmMin}
        ytmMax={ytmMax} setYtmMax={setYtmMax}
        mvMin={mvMin} setMvMin={setMvMin}       
        mvMax={mvMax} setMvMax={setMvMax} 

        // dates
        fromInput={fromInput} setFromInput={setFromInput}
        toInput={toInput} setToInput={setToInput}
        modifiedFrom={modifiedFrom} setModifiedFrom={setModifiedFrom}
        modifiedTo={modifiedTo} setModifiedTo={setModifiedTo}

        // meta
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
              <tr>
                <th className={styles.th}>Scheme</th>
                <th className={styles.th}>Instrument</th>
                <th className={styles.th}>Quantity</th>
                <th className={styles.th}>% to NAV</th>
                <th className={styles.th}>Market Value (₹)</th>
                <th className={styles.th}>Report Date</th>
                <th className={styles.th}>ISIN</th>
                <th className={styles.th}>Rating</th>
                <th className={styles.th}>YTM</th>
                <th className={styles.th}>Modified</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={`${styles.tr} ${i % 2 ? styles.trOdd : ''}`}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className={styles.td}><div className={styles.skeleton} /></td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr className={styles.tr}>
                  <td className={styles.td} colSpan={10} style={{ textAlign: 'center', padding: '24px 8px', opacity: 0.7 }}>
                    No results found.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const modified = r._modifiedTime ? new Date(r._modifiedTime).toLocaleString() : '—';
                  const qty = (r.quantity ?? '—');
                  const pct = (r.pct_to_nav ?? r.pct_to_NAV ?? '—');
                  const marketValue = r.market_value
                    ? r.market_value
                    : (r.market_value_lacs ? r.market_value_lacs * 100000 : '—');

                  return (
                    <tr
                      key={r._id}
                      className={`${styles.tr} ${i % 2 ? styles.trOdd : ''} ${styles.rowHover}`}
                      title={
                        `Scheme: ${r.scheme_name || '—'}\n` +
                        `Instrument: ${r.instrument_name || '—'}\n` +
                        `Quantity: ${qty}\n` +
                        `% to NAV: ${pct}\n` +
                        `Market Value: ₹ ${marketValue === '—' ? '—' : Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n` +
                        `ISIN: ${r.isin || 'NA'}\n` +
                        `Rating: ${r.rating || '—'}\n` +
                        `YTM: ${r.ytm ?? '—'}\n` +
                        `Report Date: ${r.report_date || '—'}`
                      }
                    >
                      <td className={`${styles.td} ${styles.tdClamp}`} title={r.scheme_name || ''}><strong>{r.scheme_name || '—'}</strong></td>
                      <td className={`${styles.td} ${styles.tdClamp}`} title={r.instrument_name || ''}>{r.instrument_name || '—'}</td>
                      <td className={styles.td}>{qty}</td>
                      <td className={styles.td}>{pct}</td>
                      <td className={styles.td}>{marketValue === '—' ? '—' : `₹ ${Number(marketValue).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}</td>
                      <td className={styles.td}>{r.report_date || '—'}</td>
                      <td className={`${styles.td} ${styles.tdClamp}`} title={r.isin || ''}>{r.isin || 'NA'}</td>
                      <td className={styles.td}>{r.rating || '—'}</td>
                      <td className={styles.td}>{r.ytm ?? '—'}</td>
                      <td className={styles.td}>{modified}</td>
                    </tr>
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
