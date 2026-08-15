import { Schema, model, InferSchemaType } from 'mongoose';

const businessSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    businessName: { type: String, default: null },
    ownerName: { type: String, default: null },
    businessType: { type: String, default: null },
    district: { type: String, default: null },
    nraTin: { type: String, default: null },
    currencyCode: { type: String, required: true, default: 'SLE' },
    usesNewLeone: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, _id: false }
);

export type Business = InferSchemaType<typeof businessSchema>;

export const BusinessModel = model('Business', businessSchema);
