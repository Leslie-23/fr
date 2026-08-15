const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { z } = require('zod');
const { UserModel } = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// The web client ID is the correct audience even for native sign-in — Google issues ID
// tokens against the web (server) client, not the iOS/Android client. See:
// https://github.com/react-native-google-signin/google-signin#backend-server
const googleClient = new OAuth2Client();

const authRouter = Router();

function issueSession(userId, email) {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
    user: { id: userId, email },
  };
}

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Deliberately more lenient than registerSchema: a password-strength rule tightened after
// an account was created shouldn't retroactively lock that account out of logging in.
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await UserModel.findOne({ email });
  if (existing) {
    res.status(409).json({ error: 'An account with that email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ email, passwordHash });

  res.status(201).json(issueSession(user._id.toString(), user.email));
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' });
    return;
  }
  const { email, password } = parsed.data;

  const user = await UserModel.findOne({ email });
  if (!user) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }
  if (!user.passwordHash) {
    res.status(401).json({ error: 'This account uses Google sign-in — continue with Google instead.' });
    return;
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Incorrect email or password' });
    return;
  }
  if (!user.active) {
    res.status(401).json({ error: 'This account has been deactivated' });
    return;
  }

  res.json(issueSession(user._id.toString(), user.email));
});

authRouter.post('/google', async (req, res) => {
  const webClientId = process.env.GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) {
    res.status(501).json({ error: 'Google sign-in is not configured on this server yet' });
    return;
  }

  const idToken = req.body?.idToken;
  if (typeof idToken !== 'string') {
    res.status(400).json({ error: 'Missing idToken' });
    return;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: webClientId });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
    return;
  }
  if (!payload?.email || !payload.sub) {
    res.status(401).json({ error: 'Invalid Google credential' });
    return;
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  let user = await UserModel.findOne({ googleId });
  if (!user) {
    // Link to an existing password account with the same email, or create a new one.
    user = await UserModel.findOneAndUpdate(
      { email },
      { $setOnInsert: { email }, $set: { googleId } },
      { upsert: true, new: true }
    );
  }
  if (!user) {
    res.status(500).json({ error: 'Could not create or link account' });
    return;
  }
  if (!user.active) {
    res.status(401).json({ error: 'This account has been deactivated' });
    return;
  }

  res.json(issueSession(user._id.toString(), user.email));
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (typeof refreshToken !== 'string') {
    res.status(400).json({ error: 'Missing refreshToken' });
    return;
  }
  let userId;
  try {
    userId = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const user = await UserModel.findById(userId, { active: 1 });
  if (!user || !user.active) {
    res.status(401).json({ error: 'This account has been deactivated' });
    return;
  }

  res.json({ accessToken: signAccessToken(userId) });
});

module.exports = { authRouter, issueSession };
