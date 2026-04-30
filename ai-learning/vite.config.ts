import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv } from 'vite';

const AUTH_ACCOUNTS = [
  { email: 'empleado@whirlpool.com',  password: 'Whirlpool123', role: 'user',          name: 'Juan Pérez',        area: 'Ingeniería',  redirectTo: '/dashboard'       },
  { email: 'editor@whirlpool.com',    password: 'Whirlpool123', role: 'content-admin', name: 'Editor Contenido',  area: 'HR',          redirectTo: '/admin/content'   },
  { email: 'admin@whirlpool.com',     password: 'Whirlpool123', role: 'content-admin', name: 'Admin Contenido',   area: 'Innovación',  redirectTo: '/admin/content'   },
  { email: 'super@whirlpool.com',     password: 'Whirlpool123', role: 'super-admin',   name: 'Super Admin Demo',  area: 'Innovación',  redirectTo: '/admin/dashboard' },
];

function findAuthAccount(email: string, password: string) {
  return AUTH_ACCOUNTS.find(
    (a) => a.email === email.trim().toLowerCase() && a.password === password
  ) ?? null;
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'auth-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/auth/login', async (request, response, next) => {
            if (request.method !== 'POST') { next(); return; }
            try {
              const body = await readJsonBody(request);
              const correo   = String(body.correo ?? body.email ?? '').trim().toLowerCase();
              const password = String(body.password ?? '');
              if (!correo || !password) {
                sendJson(response, 422, { ok: false, error: 'Correo y contraseña requeridos.' });
                return;
              }
              const account = findAuthAccount(correo, password);
              if (!account) {
                sendJson(response, 401, { ok: false, error: 'Credenciales incorrectas.' });
                return;
              }
              sendJson(response, 200, {
                ok: true,
                email: account.email,
                role: account.role,
                redirectTo: account.redirectTo,
                user: { email: account.email, name: account.name, role: account.role, area: account.area },
              });
            } catch {
              sendJson(response, 500, { ok: false, error: 'No se pudo procesar la solicitud.' });
            }
          });

          server.middlewares.use('/api/auth/logout', (request, response, next) => {
            if (request.method !== 'POST') { next(); return; }
            sendJson(response, 200, { ok: true });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});