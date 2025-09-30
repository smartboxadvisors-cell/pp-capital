// routes/list.js
const express = require('express');
const router = express.Router();
const DriveImport = require('../models/drive_imports');

const PROJECTION = {
  _id: 1,
  scheme_name: 1,
  instrument_name: 1,
  quantity: 1,
  pct_to_nav: 1,
  pct_to_NAV: 1,
  '% to NAV': 1,
  report_date: 1,        // original string like "Aug 31,2024"
  report_date_iso: 1,    // <== add in DB if possible (Date)
  isin: 1,
  rating: 1,
  ytm: 1,
  _modifiedTime: 1,
  market_value_lacs: 1,
};

router.get('/', (_req, res) => {
  res.send('working');
});

router.get('/imports', async (req, res) => {
  try {
    // paging
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip  = (page - 1) * limit;

    // query params
    const {
      scheme       = '',
      instrument   = '',
      isin         = '',
      rating       = '',
      ratings,
      from         = '',  // report date from (yyyy-mm-dd)
      to           = '',  // report date to   (yyyy-mm-dd)
      quantityMin,
      quantityMax,
      pctToNavMin,
      pctToNavMax,
      market_value_lacs,
      ytmMin,
      ytmMax,
      modifiedFrom = '',
      modifiedTo   = '',
    } = req.query;

    // helpers
    const addRegex = (field, val) => {
      if (!val || !String(val).trim()) return;
      // case-insensitive contains
      filter[field] = { $regex: String(val).trim(), $options: 'i' };
    };
    const addStartsWith = (field, val) => {
      if (!val || !String(val).trim()) return;
      // e.g., rating "AAA" should match "AAA (CE)"
      filter[field] = { $regex: `^${escapeRegex(String(val).trim())}`, $options: 'i' };
    };
    const addRange = (field, min, max, cast = Number) => {
      const hasMin = min !== undefined && min !== null && String(min) !== '';
      const hasMax = max !== undefined && max !== null && String(max) !== '';
      if (!hasMin && !hasMax) return;
      filter[field] = {};
      if (hasMin) filter[field].$gte = cast(min);
      if (hasMax) filter[field].$lte = cast(max);
    };
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // build filter
    const filter = {};
    addRegex('scheme_name', scheme);
    addRegex('instrument_name', instrument);
    addRegex('isin', isin);
    // Ratings filter: support multiple (ratings[]) and single (rating)
    const ratingsArray = [];
    if (Array.isArray(ratings)) {
      for (const v of ratings) {
        const t = String(v || '').trim();
        if (t) ratingsArray.push(t);
      }
    }
    const singleRating = String(rating || '').trim();
    if (singleRating) ratingsArray.push(singleRating);
    if (ratingsArray.length > 0) {
      // Use $in with regex so we can combine with other filters safely
      filter.rating = {
        $in: ratingsArray.map(v => new RegExp(`^${escapeRegex(v)}`, 'i')),
      };
    }
    // numeric ranges
    addRange('quantity',   quantityMin, quantityMax, Number);
    addRange('pct_to_nav', pctToNavMin, pctToNavMax, Number);
    addRange('ytm',        ytmMin, ytmMax, Number);

    // report date range
    if (from || to) {
      // Preferred: filter on normalized Date field (report_date_iso)
      if ('report_date_iso' in PROJECTION || true) {
        const range = {};
        if (from) range.$gte = new Date(from);
        if (to) {
          const t = new Date(to);
          t.setHours(23, 59, 59, 999);
          range.$lte = t;
        }
        // Try report_date_iso if present; fallback to _modifiedTime to avoid 0 hits if you haven't populated report_date_iso yet
        // Remove the fallback when you have report_date_iso populated.
        filter.$or = [
          { report_date_iso: range },
          { report_date_iso: { $exists: false }, _modifiedTime: range }, // weak fallback
        ];
      } else {
        // Fallback (not ideal): regex match month/year from "Aug 31,2024"
        // This is approximate; please add report_date_iso for accuracy.
        const rx = [];
        if (from) {
          const yyyy = from.slice(0, 4);
          rx.push(yyyy);
        }
        if (to) {
          const yyyy = to.slice(0, 4);
          rx.push(yyyy);
        }
        if (rx.length) {
          filter.report_date = { $regex: rx.map(escapeRegex).join('|'), $options: 'i' };
        }
      }
    }

    // modified date range (ISO timestamps)
    if (modifiedFrom || modifiedTo) {
      const range = {};
      if (modifiedFrom) range.$gte = new Date(modifiedFrom);
      if (modifiedTo) {
        const t = new Date(modifiedTo);
        t.setHours(23, 59, 59, 999);
        range.$lte = t;
      }
      filter._modifiedTime = range;
    }

    // sort
    const sort = { _modifiedTime: -1, _id: -1 };

    const [items, total] = await Promise.all([
      DriveImport.find(filter).sort(sort).skip(skip).limit(limit).select(PROJECTION).lean(),
      DriveImport.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'error', error: error.message });
  }
});

module.exports = router;
