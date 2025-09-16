require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDb = require('./config/db');
const listRouter = require('./routes/list');
const authRouter = require('./routes/auth');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5175',
    'https://pp-capital-cv100t08r-ppcapitals-projects.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

connectDb();

// Auth routes
app.use('/api/auth', authRouter);

// List routes
app.use('/api', listRouter);

// optional health check
app.get('/', (req, res) => res.json({ ok: true }));

// 404 fallback (helps you see what path was missed)
app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server is listening on port ${PORT}`));
