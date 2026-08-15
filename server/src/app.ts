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

// Vercel's zero-config Express preset auto-detects src/app.{ts,js} specifically and requires
// a default export (see https://vercel.com/docs/frameworks/backend/express) — this is what it
// actually invokes per-request, not api/index.ts (removed; it was redundant with this, and
// the two were conflicting: Vercel found this file's old named-only export invalid and Node
// exited before api/index.ts's rewrite ever ran).
export default app;
