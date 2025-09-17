// src/api/imports.js
const RAW_API_BASE =
  import.meta.env?.VITE_API_URL || 'https://pp-capital-zdto.vercel.app/api';

const API_BASE = /\/api\/?$/.test(RAW_API_BASE)
  ? RAW_API_BASE.replace(/\/$/, '')
  : `${RAW_API_BASE.replace(/\/$/, '')}/api`;

function setIfPresent(params, key, val) {
  if (val === null || val === undefined) return;
  if (typeof val === 'string') {
    const t = val.trim();
    if (t) params.set(key, t);
  } else {
    params.set(key, String(val));
  }
}

async function tryFetch(url, token, signal) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.replace('/login');
    return { aborted: true };
  }

  const body = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`Expected JSON, got: ${body.slice(0, 200)}…`);
  }

  let json;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error(`Invalid JSON: ${body.slice(0, 200)}…`);
  }

  if (!res.ok) {
    throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
  }

  return { json };
}

/**
 * Fetch paged, filtered imports.
 */
export async function fetchImports(
  {
    page = 1,
    limit = 50,

    scheme = '',
    instrument = '',
    isin = '',
    rating = '',

    from = '',
    to = '',

    quantityMin = null,
    quantityMax = null,
    pctToNavMin = null,
    pctToNavMax = null,
    ytmMin = null,
    ytmMax = null,

    modifiedFrom = '',
    modifiedTo = '',

    // IMPORTANT: default FALSE so we don’t accidentally filter out everything
    hideIncomplete = false,

    // optional hooks
    mvMin = null,
    mvMax = null,
  } = {},
  { signal } = {}
) {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('limit', String(limit));

  setIfPresent(params, 'scheme', scheme);
  setIfPresent(params, 'instrument', instrument);
  setIfPresent(params, 'isin', isin);
  setIfPresent(params, 'rating', rating);

  setIfPresent(params, 'from', from);
  setIfPresent(params, 'to', to);

  setIfPresent(params, 'quantityMin', quantityMin);
  setIfPresent(params, 'quantityMax', quantityMax);
  setIfPresent(params, 'pctToNavMin', pctToNavMin);
  setIfPresent(params, 'pctToNavMax', pctToNavMax);
  setIfPresent(params, 'ytmMin', ytmMin);
  setIfPresent(params, 'ytmMax', ytmMax);

  setIfPresent(params, 'mvMin', mvMin);
  setIfPresent(params, 'mvMax', mvMax);

  setIfPresent(params, 'modifiedFrom', modifiedFrom);
  setIfPresent(params, 'modifiedTo', modifiedTo);

  params.set('hideIncomplete', hideIncomplete ? '1' : '0');

  // Try /list/imports first; if it 404s or returns shape we don't expect, fall back to /imports
  const urls = [
    `${API_BASE}/list/imports?${params.toString()}`,
    `${API_BASE}/imports?${params.toString()}`,
  ];

  let lastErr;
  for (const url of urls) {
    try {
      const res = await tryFetch(url, token, signal);
      if (!res || res.aborted) return;
      const { json } = res;

      // Normalize response
      const items = Array.isArray(json.items) ? json.items : [];
      const total = Number(json.total || 0);
      const totalPages = Math.max(1, Math.ceil(total / Number(limit || 50)));

      // If we got items or total reported, accept and return
      if (items.length > 0 || total > 0 || json.ok) {
        return { items, total, totalPages };
      }
      // If empty here, still return—caller can show “No results”.
      return { items, total, totalPages };
    } catch (e) {
      lastErr = e;
      // continue to next url
    }
  }

  // If both attempts failed:
  throw lastErr || new Error('Failed to fetch imports');
}
