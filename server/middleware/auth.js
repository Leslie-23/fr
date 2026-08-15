const { UserModel } = require('../models/User');
const { verifyAccessToken } = require('../utils/jwt');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }
  let userId;
  try {
    userId = verifyAccessToken(header.slice('Bearer '.length));
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  // Checked on every request (not just at login) so a deactivated account's still-valid
  // access token stops working immediately, rather than staying live until it expires.
  const user = await UserModel.findById(userId, { active: 1 });
  if (!user || !user.active) {
    res.status(401).json({ error: 'This account has been deactivated' });
    return;
  }

  req.userId = userId;
  next();
}

module.exports = { requireAuth };
