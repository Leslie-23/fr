import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db';
import { accountRouter } from './routes/account';
import { authRouter } from './routes/auth';
import { businessRouter } from './routes/business';
import { entriesRouter } from './routes/entries';

async function main() {
  await connectDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/auth', authRouter);
  app.use('/account', accountRouter);
  app.use('/business', businessRouter);
  app.use('/entries', entriesRouter);

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => console.log(`Ledger server listening on :${port}`));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
