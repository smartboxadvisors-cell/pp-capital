require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDb = require('./config/db');
const listRouter = require('./routes/list');

const app = express();

app.use(cors());
app.use(express.json());

connectDb();

// ✅ this must be `use`, not `get`
app.use('/api', listRouter);
app.use('/api/auth', require('./routes/auth'));

// optional health check
app.get('/', (req, res) => res.json({ ok: true }));

// 404 fallback (helps you see what path was missed)
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

app.listen(5000, () => console.log('server is listening on port 5000'));
