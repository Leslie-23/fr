import 'dotenv/config';
import { app } from '../src/app';

// Vercel's Node.js runtime accepts an Express app as the default export directly — it calls
// it as a standard (req, res) handler per invocation. No listen() here; that's local-dev-only
// (see src/index.ts). DB connection is handled by app.ts's own middleware, not here.
export default app;
