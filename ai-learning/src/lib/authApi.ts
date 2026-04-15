import type { UserRole } from '../types';

export type AuthAccount = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  area: string;
  redirectTo: string;
};

export const AUTH_ACCOUNTS: AuthAccount[] = [
  {
    email: 'empleado@whirlpool.com',
    password: 'Whirlpool123',
    role: 'user',
    name: 'Juan Pérez',
    area: 'Ingeniería',
    redirectTo: '/dashboard',
  },
  {
    email: 'editor@whirlpool.com',
    password: 'Whirlpool123',
    role: 'content-admin',
    name: 'Editor Contenido',
    area: 'HR',
    redirectTo: '/admin/content',
  },
  {
    email: 'admin@whirlpool.com',
    password: 'Whirlpool123',
    role: 'content-admin',
    name: 'Admin Contenido',
    area: 'Innovación',
    redirectTo: '/admin/content',
  },
  {
    email: 'super@whirlpool.com',
    password: 'Whirlpool123',
    role: 'super-admin',
    name: 'Super Admin Demo',
    area: 'Innovación',
    redirectTo: '/admin/dashboard',
  },
];

export function findAuthAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return AUTH_ACCOUNTS.find((account) => account.email === normalizedEmail && account.password === password) ?? null;
}

export function getAuthAccountByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return AUTH_ACCOUNTS.find((account) => account.email === normalizedEmail) ?? null;
}
