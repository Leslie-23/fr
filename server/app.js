const express = require('express');
const cors = require('cors');
const { accountRouter } = require('./routes/account');
const { authRouter } = require('./routes/auth');
const { businessRouter } = require('./routes/business');
const { connectDb } = require('./db');
const { entriesRouter } = require('./routes/entries');

const app = express();
app.use(cors());
app.use(express.json());

// On Vercel there's no long-lived startup phase to connect once before serving traffic —
// every request is its own invocation — so the connection is ensured per-request instead.
// connectDb() caches its promise, so this is a no-op after the first successful connect
// within a warm container. Local dev (index.js) also connects at startup for a faster
// failure if Mongo isn't reachable; both paths share the same cached connection.
app.use(async (_req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('connectDb failed:', err);
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/business', businessRouter);
app.use('/entries', entriesRouter);

// Vercel's zero-config Express preset auto-detects app.{js,...} at the project root and
// requires a plain export of the app (or a port listener) — see
// https://vercel.com/docs/frameworks/backend/express. That's what actually gets invoked
// per-request on Vercel; index.js (app.listen) is local-dev-only.
module.exports = app;
