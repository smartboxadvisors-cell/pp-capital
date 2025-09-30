// src/components/ImportsTable.jsx
import { useEffect, useMemo, useState } from 'react';
import { fetchImports } from '../api/imports';
import useDebounce from '../hooks/useDebounce';
import Filters from './Filters';
import Pagination from './Pagination';
import ResizableTable from './ResizableTable';
import styles from '../styles/table.module.css';

export default function ImportsTable() {
  // Paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // ----- Controlled inputs (all fields) -----
  const [schemeInput, setSchemeInput] = useState('');
  const [instrumentInput, setInstrumentInput] = useState('');
  const [ratings, setRatings] = useState([]); // Changed from ratingInput to ratings array
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
  const ratingsDebounced = useDebounce(ratings); // Debounce the ratings array
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
    scheme, instrument, ratingsDebounced, isin,
    from, to,
    quantityMinD, quantityMaxD,
    pctToNavMinD, pctToNavMaxD,
    ytmMinD, ytmMaxD,
    modifiedFromD, modifiedToD,
    limit, mvMinD, mvMaxD, 
  ]);

  const params = useMemo(() => ({
    page,
    limit,
    scheme,
    instrument,
    isin,
    ratings: ratingsDebounced, // Pass ratings array instead of single rating
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
    scheme, instrument, isin, ratingsDebounced,
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
    setRatings([]); // Reset ratings array
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
        ratings={ratings} setRatings={setRatings} // Pass ratings array instead of ratingInput
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

      <ResizableTable rows={rows} loading={loading} />

      <div style={{ padding: '12px' }}>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} disabled={loading} />
      </div>
    </div>
  );
}
