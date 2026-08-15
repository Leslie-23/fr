import express from 'express';
import cors from 'cors';
import { accountRouter } from './routes/account';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/business';
import { connectDb } from './db';
import { entriesRouter } from './routes/entries';

export const app = express();
app.use(cors());
app.use(express.json());

// On Vercel there's no long-lived startup phase to connect once before serving traffic —
// every request is its own invocation — so the connection is ensured per-request instead.
// connectDb() caches its promise, so this is a no-op after the first successful connect
// within a warm container. Local dev (src/index.ts) also connects at startup for a faster
// failure if Mongo isn't reachable; both paths share the same cached connection.
app.use(async (_req, res, next) => {
  try {
    await connectDb();
    next();
  } catch {
    res.status(503).json({ error: 'Database unavailable' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/account', accountRouter);
app.use('/business', businessRouter);
app.use('/entries', entriesRouter);
