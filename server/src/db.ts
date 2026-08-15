import mongoose from 'mongoose';

let connectPromise: Promise<typeof mongoose> | null = null;

/**
 * Cached across invocations within the same warm serverless container — on Vercel this
 * function gets called on every request (there's no long-lived startup phase to connect
 * once), so without caching, concurrent invocations would each open their own connection
 * and exhaust MongoDB's connection limit. mongoose.connect() itself is safe to call
 * repeatedly once connected, but caching the promise also avoids redundant connect races
 * during cold starts.
 */
export async function connectDb(): Promise<void> {
  if (!connectPromise) {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ledger';
    connectPromise = mongoose.connect(uri);
  }
  await connectPromise;
}
