import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { createServer } from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';
import { buildAdaptationConfig } from './adaptability.js';
import { registerChatSocketHandlers } from './chat.js';
import { generateChatbotReply } from './chatbot.js';
import { verifySupabaseToken } from './supabase.js';
import {
  addEvent,
  addLog,
  addMessage,
  addUpload,
  demoProfile,
  getEvents,
  getLogs,
  getMessages,
  getUser,
  listUploads,
  upsertUser
} from './store.js';
import { insertChatMessages } from './supabase.js';

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

registerChatSocketHandlers(io);

const clientDist = path.resolve(process.cwd(), 'dist', 'client');

function extractSupabaseToken(request: express.Request): string {
  const authorization = request.headers.authorization;
  if (typeof authorization === 'string' && authorization.trim()) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }

  const accessToken = request.header('x-supabase-access-token');
  return typeof accessToken === 'string' ? accessToken.trim() : '';
}

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'whirlpool-adaptive-platform', timestamp: new Date().toISOString() });
});

app.get('/api/adaptability/:userId', async (request, response) => {
  const profile = await getUser(request.params.userId);
  response.json({ profile, config: buildAdaptationConfig(profile) });
});

app.get('/api/messages/:userId', async (request, response) => {
  try {
    const token = extractSupabaseToken(request);
    const authUser = await verifySupabaseToken(token);
    const requestedUserId = request.params.userId.trim();

    if (authUser.id !== requestedUserId) {
      response.status(403).json({ error: 'El token de Supabase no coincide con el userId solicitado.' });
      return;
    }

    response.json({ messages: await getMessages(authUser.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No autorizado';
    response.status(401).json({ error: message });
  }
});

app.get('/api/logs/:userId', async (request, response) => {
  response.json({ logs: await getLogs(request.params.userId) });
});

app.get('/api/events/:userId', async (request, response) => {
  response.json({ events: await getEvents(request.params.userId) });
});

app.get('/api/uploads/:userId', async (request, response) => {
  response.json({ uploads: await listUploads(request.params.userId) });
});

app.post('/api/messages', async (request, response) => {
  const { userId = demoProfile.id, content = '', role = 'user' } = request.body as { userId?: string; content?: string; role?: 'user' | 'assistant' | 'system' | 'event' };
  const profile = await getUser(userId);
  const userMessage = await addMessage({
    userId,
    role,
    title: 'Usuario',
    content,
    source: 'user',
    severity: 'info'
  });
  const reply = generateChatbotReply(content, profile);
  const assistantMessage = await addMessage({
    userId,
    role: 'assistant',
    title: reply.title,
    content: reply.content,
    source: 'chatbot',
    severity: reply.severity
  });

  // Persist messages to Supabase `chat_messages` table for production
  try {
    await insertChatMessages(userId, [
      { role: 'user', content },
      { role: 'assistant', content: reply.content }
    ]);
  } catch (err) {
    void addLog({
      userId,
      level: 'warn',
      scope: 'supabase',
      message: `No se pudo persistir en Supabase: ${err instanceof Error ? err.message : String(err)}`
    });
  }

  await addLog({
    userId,
    level: 'info',
    scope: 'chatbot',
    message: `Mensaje procesado: ${content.slice(0, 80)}`
  });

  io.emit('message:new', assistantMessage);
  response.status(201).json({ userMessage, assistantMessage });
});

app.post('/api/upload', upload.single('file'), async (request, response) => {
  const userId = typeof request.body.userId === 'string' ? request.body.userId : demoProfile.id;
  if (!request.file) {
    response.status(400).json({ error: 'No file provided' });
    return;
  }

  const uploadRecord = await addUpload({
    userId,
    fileName: request.file.originalname,
    fileType: request.file.mimetype,
    size: request.file.size
  });

  const event = await addEvent({
    userId,
    source: 'system',
    kind: 'upload',
    title: 'Archivo recibido',
    detail: `${request.file.originalname} fue cargado correctamente.`,
    severity: 'success'
  });

  await addMessage({
    userId,
    role: 'system',
    title: 'Carga procesada',
    content: `Archivo ${request.file.originalname} recibido y registrado en el sistema.`,
    source: 'system',
    severity: 'success'
  });

  io.emit('event:new', event);
  response.status(201).json({ upload: uploadRecord, event });
});

app.post('/api/whirlpool/event', async (request, response) => {
  const { userId = demoProfile.id, title, detail, kind = 'event', severity = 'info' } = request.body as {
    userId?: string;
    title?: string;
    detail?: string;
    kind?: string;
    severity?: 'info' | 'success' | 'warning' | 'critical';
  };

  const event = await addEvent({
    userId,
    source: 'whirlpool',
    kind,
    title: title ?? 'Evento Whirlpool',
    detail: detail ?? 'Evento recibido desde una API externa.',
    severity
  });

  const message = await addMessage({
    userId,
    role: 'event',
    title: event.title,
    content: event.detail,
    source: 'whirlpool',
    severity: event.severity
  });

  await addLog({
    userId,
    level: 'warn',
    scope: 'whirlpool',
    message: `${event.kind}: ${event.title}`
  });

  io.emit('event:new', event);
  io.emit('message:new', message);
  response.status(201).json({ event, message });
});

app.post('/api/profile', async (request, response) => {
  const profile = request.body;
  const saved = await upsertUser(profile);
  response.status(201).json({ profile: saved });
});

if (await canServeClient()) {
  app.use(express.static(clientDist));
  app.get('*', (_request, response) => {
    response.sendFile(path.join(clientDist, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.emit('message:new', {
    id: 'welcome',
    userId: demoProfile.id,
    role: 'system',
    title: 'Conexión lista',
    content: 'Socket conectado al orquestador adaptativo.',
    timestamp: new Date().toISOString(),
    source: 'system',
    severity: 'success'
  });
});

async function canServeClient(): Promise<boolean> {
  try {
    const { access } = await import('node:fs/promises');
    await access(path.join(clientDist, 'index.html'));
    return true;
  } catch {
    return false;
  }
}

const initialPort = Number(process.env.PORT ?? 3001);

async function tryListen(startPort: number, maxAttempts = 10): Promise<number> {
  let port = startPort;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: Error & { code?: string }) => {
          httpServer.removeListener('listening', onListening);
          reject(err);
        };

        const onListening = () => {
          httpServer.removeListener('error', onError);
          resolve();
        };

        httpServer.once('error', onError);
        httpServer.once('listening', onListening as () => void);
        httpServer.listen(port);
      });

      return port;
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') {
        console.warn(`Puerto ${port} en uso, intentando ${port + 1}...`);
        port += 1;
        // continue loop to try next port
      } else {
        throw err;
      }
    }
  }

  throw new Error(`No fue posible escuchar en puertos a partir de ${startPort}`);
}

(async () => {
  try {
    const boundPort = await tryListen(initialPort, 20);
    void addLog({
      userId: demoProfile.id,
      level: 'info',
      scope: 'server',
      message: `Backend escuchando en puerto ${boundPort}`
    });
    console.log(`Whirlpool Adaptive Platform backend running on http://localhost:${boundPort}`);
  } catch (err) {
    console.error('No se pudo arrancar el servidor:', err);
    process.exit(1);
  }
})();
