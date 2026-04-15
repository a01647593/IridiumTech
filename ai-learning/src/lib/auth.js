//import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE = 'auth_token';

/*export async function hashPassword(plain) {
  const rounds = Number(import.meta.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}*/

export function signToken(payload) {
  return jwt.sign(payload, import.meta.env.JWT_SECRET, {
    expiresIn: import.meta.env.JWT_EXPIRES_IN || '8h',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, import.meta.env.JWT_SECRET);
}

export function setAuthCookie(cookies, token) {
  cookies.set('auth_token', token, {
    httpOnly: true,
    secure: import.meta.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
}

export function clearAuthCookie(cookies) {
  cookies.delete('auth_token', { path: '/' });
}

export function getSession(cookies) {
  const token = cookies.get('auth_token')?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function redirectByRole(rol) {
  if (rol === 'SuperAdministrador') return '/admin/super';
  if (rol === 'Administrador')      return '/admin/content';
  return '/dashboard';
}