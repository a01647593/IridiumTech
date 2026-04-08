import { defineMiddleware } from 'astro:middleware';
import { getSession } from '../lib/auth.js';

const RUTAS_PUBLICAS = ['/login', '/api/auth/login', '/api/auth/logout'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Dejar pasar rutas públicas y archivos estáticos
  if (RUTAS_PUBLICAS.includes(pathname) || pathname.startsWith('/_astro/')) {
    return next();
  }

  const session = getSession(context.cookies);

  // Sin sesión → redirigir al login
  if (!session) {
    return context.redirect('/login');
  }

  // Inyectar datos del usuario para usarlos en cualquier página
  context.locals.usuario = session;

  return next();
});