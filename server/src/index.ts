import 'dotenv/config';
import { app } from './app';
import { connectDb } from './db';

// Local development entrypoint only — `npm run dev` / `npm start`. The Vercel deployment
// uses api/index.ts instead, which doesn't call listen() at all (see that file for why).
async function main() {
  await connectDb();

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => console.log(`Ledger server listening on :${port}`));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
