import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import {defineConfig, loadEnv} from 'vite';
import { findAuthAccount } from './src/lib/authApi';

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8').trim();
  return rawBody ? JSON.parse(rawBody) : {};
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'auth-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/auth/login', async (request, response, next) => {
            if (request.method !== 'POST') {
              next();
              return;
            }

            try {
              const body = await readJsonBody(request);
              const correo = String(body.correo ?? body.email ?? '').trim().toLowerCase();
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
                user: {
                  email: account.email,
                  name: account.name,
                  role: account.role,
                  area: account.area,
                },
              });
            } catch {
              sendJson(response, 500, { ok: false, error: 'No se pudo procesar la solicitud de autenticación.' });
            }
          });

          server.middlewares.use('/api/auth/logout', (request, response, next) => {
            if (request.method !== 'POST') {
              next();
              return;
            }

            sendJson(response, 200, { ok: true });
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
