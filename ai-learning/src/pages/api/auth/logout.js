import { clearAuthCookie } from '../../../lib/auth.js';

export const POST = async ({ cookies }) => {
  clearAuthCookie(cookies);
  return Response.redirect('/login', 302);
};