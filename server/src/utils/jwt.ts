import jwt from 'jsonwebtoken';

const ACCESS_TTL = '1h';
const REFRESH_TTL = '30d';

function secret(name: 'access' | 'refresh'): string {
  const value = name === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;
  if (!value) throw new Error(`Missing JWT_${name.toUpperCase()}_SECRET env var`);
  return value;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret('access'), { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret('refresh'), { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, secret('access'));
  return (payload as jwt.JwtPayload).sub as string;
}

export function verifyRefreshToken(token: string): string {
  const payload = jwt.verify(token, secret('refresh'));
  return (payload as jwt.JwtPayload).sub as string;
}
