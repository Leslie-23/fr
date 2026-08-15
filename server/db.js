const mongoose = require('mongoose');

let connectPromise = null;

/**
 * Cached across invocations within the same warm serverless container — on Vercel this
 * function gets called on every request (there's no long-lived startup phase to connect
 * once), so without caching, concurrent invocations would each open their own connection
 * and exhaust MongoDB's connection limit.
 */
async function connectDb() {
  if (!connectPromise) {
    const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ledger';
    connectPromise = mongoose.connect(uri).catch((err) => {
      // Let the next request try again instead of caching a permanently-rejected promise.
      connectPromise = null;
      throw err;
    });
  }
  await connectPromise;
}

module.exports = { connectDb };
