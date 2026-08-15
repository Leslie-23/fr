import { Schema, model, InferSchemaType } from 'mongoose';

const entrySchema = new Schema(
  {
    _id: { type: String, required: true },
    businessId: { type: String, required: true, index: true },
    entryDate: { type: String, required: true },
    type: { type: String, required: true, enum: ['sale', 'expense'] },
    amountSle: { type: Number, required: true, min: 1 },
    category: { type: String, default: null },
    note: { type: String, default: null },
    deletedAt: { type: String, default: null },
  },
  { timestamps: true, _id: false }
);

export type Entry = InferSchemaType<typeof entrySchema>;

export const EntryModel = model('Entry', entrySchema);
