import mongoose from 'mongoose';

export async function connectDb(): Promise<void> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/ledger';
  await mongoose.connect(uri);
}
