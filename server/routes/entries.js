const { Router } = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');
const { BusinessModel } = require('../models/Business');
const { EntryModel } = require('../models/Entry');

const entriesRouter = Router();
entriesRouter.use(requireAuth);

async function ownedBusinessIds(userId) {
  const businesses = await BusinessModel.find({ userId }, { _id: 1 });
  return businesses.map((b) => b._id);
}

entriesRouter.get('/', async (req, res) => {
  const since = typeof req.query.since === 'string' ? req.query.since : undefined;
  const businessIds = await ownedBusinessIds(req.userId);

  const query = { businessId: { $in: businessIds } };
  if (since) query.updatedAt = { $gt: new Date(since) };

  const entries = await EntryModel.find(query);
  res.json(entries);
});

const entrySchema = z.object({
  id: z.string().min(1),
  businessId: z.string().min(1),
  entryDate: z.string().min(1),
  type: z.enum(['sale', 'expense']),
  amountSle: z.number().positive(),
  category: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
});

const batchSchema = z.object({ entries: z.array(entrySchema).min(1).max(500) });

entriesRouter.post('/', async (req, res) => {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }

  const businessIds = new Set(await ownedBusinessIds(req.userId));
  const rows = parsed.data.entries.filter((e) => businessIds.has(e.businessId));
  if (rows.length === 0) {
    res.status(403).json({ error: 'No entries belong to a business you own' });
    return;
  }

  const operations = rows.map((row) => {
    const { id, ...fields } = row;
    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: fields },
        upsert: true,
      },
    };
  });
  await EntryModel.bulkWrite(operations);

  res.status(200).json({ saved: rows.length });
});

module.exports = { entriesRouter };
