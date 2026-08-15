require('dotenv/config');
const app = require('./app');
const { connectDb } = require('./db');

// Local development entrypoint only — `npm run dev` / `npm start`. Vercel invokes app.js
// directly instead (zero-config Express detection), never calling listen() at all.
async function main() {
  await connectDb();

  const port = Number(process.env.PORT ?? 4000);
  app.listen(port, () => console.log(`Ledger server listening on :${port}`));
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
