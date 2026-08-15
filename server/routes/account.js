const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const { BusinessModel } = require('../models/Business');
const { EntryModel } = require('../models/Entry');
const { UserModel } = require('../models/User');

const accountRouter = Router();
accountRouter.use(requireAuth);

// Soft-delete: marks the account inactive and blocks future logins (requireAuth also
// rejects the current session's still-valid token on the next request). Business/entry
// data is untouched — nothing here reaches the Business or Entry collections.
accountRouter.post('/deactivate', async (req, res) => {
  await UserModel.findByIdAndUpdate(req.userId, {
    $set: { active: false, deactivatedAt: new Date() },
  });
  res.json({ ok: true });
});

// Hard delete ("clear account"): permanently erases the user and every Business/Entry they
// own from the server. Irreversible — unlike /deactivate, there is no data left to restore.
// The client's local SQLite copy is untouched by this call; the client clears it separately.
accountRouter.delete('/', async (req, res) => {
  const businesses = await BusinessModel.find({ userId: req.userId }, { _id: 1 });
  const businessIds = businesses.map((b) => b._id);

  await EntryModel.deleteMany({ businessId: { $in: businessIds } });
  await BusinessModel.deleteMany({ userId: req.userId });
  await UserModel.findByIdAndDelete(req.userId);

  res.json({ ok: true });
});

module.exports = { accountRouter };
