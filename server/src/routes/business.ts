import { Router } from 'express';
import { z } from 'zod';
import { AuthedRequest, requireAuth } from '../middleware/auth';
import { BusinessModel } from '../models/Business';

export const businessRouter = Router();
businessRouter.use(requireAuth);

businessRouter.get('/', async (req: AuthedRequest, res) => {
  const businesses = await BusinessModel.find({ userId: req.userId });
  res.json(businesses);
});

const upsertSchema = z.object({
  id: z.string().min(1),
  businessName: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  businessType: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  nraTin: z.string().nullable().optional(),
  currencyCode: z.string().min(1),
  usesNewLeone: z.boolean(),
  updatedAt: z.string().optional(),
});

businessRouter.put('/', async (req: AuthedRequest, res) => {
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  const { id, ...fields } = parsed.data;

  const existing = await BusinessModel.findById(id);
  if (existing && existing.userId.toString() !== req.userId) {
    res.status(403).json({ error: 'Not your business profile' });
    return;
  }

  const updated = await BusinessModel.findByIdAndUpdate(
    id,
    { $set: { ...fields, userId: req.userId } },
    { upsert: true, new: true }
  );
  res.json(updated);
});
