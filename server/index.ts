import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { createServer } from 'node:http';
import path from 'node:path';
import { Server } from 'socket.io';
import { buildAdaptationConfig } from './adaptability.js';
import { generateChatbotReply } from './chatbot.js';
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

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const clientDist = path.resolve(process.cwd(), 'dist', 'client');

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
  response.json({ messages: await getMessages(request.params.userId) });
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

const port = Number(process.env.PORT ?? 3001);
httpServer.listen(port, () => {
  void addLog({
    userId: demoProfile.id,
    level: 'info',
    scope: 'server',
    message: `Backend escuchando en puerto ${port}`
  });
  console.log(`Whirlpool Adaptive Platform backend running on http://localhost:${port}`);
});
