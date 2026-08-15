const jwt = require('jsonwebtoken');

const ACCESS_TTL = '1h';
const REFRESH_TTL = '30d';

function secret(name) {
  const value = name === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!value) throw new Error(`Missing JWT_${name.toUpperCase()}_SECRET env var`);
  return value;
}

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, secret('access'), { expiresIn: ACCESS_TTL });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, secret('refresh'), { expiresIn: REFRESH_TTL });
}

function verifyAccessToken(token) {
  const payload = jwt.verify(token, secret('access'));
  return payload.sub;
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, secret('refresh'));
  return payload.sub;
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
