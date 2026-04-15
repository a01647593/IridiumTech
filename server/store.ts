import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AppState, EventRecord, LogEntry, MessageRecord, UploadRecord, UserProfile } from '../shared/types.js';

const dataDirectory = path.resolve(process.cwd(), 'data');
const dataFile = path.join(dataDirectory, 'state.json');

const baseProfile: UserProfile = {
  id: 'persona-4',
  name: 'Persona 4',
  persona: 'Usuario con enfoque operativo y necesidad de contexto en tiempo real',
  role: 'Analyst',
  preferences: {
    compactMode: false,
    showDiagnostics: true,
    preferredTone: 'friendly'
  },
  activeModules: ['chatbot', 'notifications', 'uploads', 'logs'],
  whirlpoolDevices: [
    {
      id: 'washer-1',
      name: 'Lavadora principal',
      type: 'washer',
      status: 'running',
      progress: 72,
      etaMinutes: 18
    },
    {
      id: 'filter-1',
      name: 'Filtro de agua',
      type: 'filter',
      status: 'needs_attention',
      progress: 100,
      etaMinutes: 0
    },
    {
      id: 'dryer-1',
      name: 'Secadora',
      type: 'dryer',
      status: 'idle',
      progress: 0,
      etaMinutes: 0
    }
  ]
};

const seedMessages: MessageRecord[] = [
  {
    id: 'msg-seed-1',
    userId: baseProfile.id,
    role: 'system',
    title: 'Sistema listo',
    content: 'El backend adaptativo está activo y la interfaz puede recibir eventos en tiempo real.',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    source: 'system',
    severity: 'success'
  },
  {
    id: 'msg-seed-2',
    userId: baseProfile.id,
    role: 'event',
    title: 'Filtro de agua',
    content: 'El filtro necesita cambio. Se recomienda agendar mantenimiento.',
    timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
    source: 'whirlpool',
    severity: 'warning'
  },
  {
    id: 'msg-seed-3',
    userId: baseProfile.id,
    role: 'assistant',
    title: 'Asistente Whirlpool',
    content: 'Puedo ayudarte con estado de equipos, notificaciones y carga de archivos.',
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    source: 'chatbot',
    severity: 'info'
  }
];

const seedLogs: LogEntry[] = [
  {
    id: 'log-seed-1',
    userId: baseProfile.id,
    level: 'info',
    scope: 'bootstrap',
    message: 'Inicialización del orquestador completada.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'log-seed-2',
    userId: baseProfile.id,
    level: 'debug',
    scope: 'adaptability',
    message: 'Se activaron módulos de chat, carga y notificaciones.',
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  }
];

const initialState: AppState = {
  users: [baseProfile],
  messages: seedMessages,
  logs: seedLogs,
  uploads: [],
  events: [
    {
      id: 'evt-seed-1',
      userId: baseProfile.id,
      source: 'whirlpool',
      kind: 'maintenance',
      title: 'Filtro de agua necesita cambio',
      detail: 'La lectura de uso alcanzó el umbral recomendado para reemplazo.',
      severity: 'warning',
      timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString()
    }
  ]
};

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureDataFile(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  try {
    await readFile(dataFile, 'utf8');
  } catch {
    await writeFile(dataFile, JSON.stringify(initialState, null, 2), 'utf8');
  }
}

async function readState(): Promise<AppState> {
  await ensureDataFile();
  const raw = await readFile(dataFile, 'utf8');
  return JSON.parse(raw) as AppState;
}

async function writeState(state: AppState): Promise<void> {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(state, null, 2), 'utf8');
}

export async function getUser(userId: string): Promise<UserProfile> {
  const state = await readState();
  return state.users.find((user) => user.id === userId) ?? baseProfile;
}

export async function getAdaptationUser(userId: string): Promise<UserProfile> {
  return getUser(userId);
}

export async function getMessages(userId: string): Promise<MessageRecord[]> {
  const state = await readState();
  return state.messages.filter((message) => message.userId === userId).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function addMessage(input: Omit<MessageRecord, 'id' | 'timestamp'> & { timestamp?: string }): Promise<MessageRecord> {
  const state = await readState();
  const record: MessageRecord = {
    ...input,
    id: createId('msg'),
    timestamp: input.timestamp ?? new Date().toISOString()
  };
  state.messages.push(record);
  await writeState(state);
  return record;
}

export async function getLogs(userId: string): Promise<LogEntry[]> {
  const state = await readState();
  return state.logs.filter((log) => log.userId === userId).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function addLog(input: Omit<LogEntry, 'id' | 'timestamp'> & { timestamp?: string }): Promise<LogEntry> {
  const state = await readState();
  const record: LogEntry = {
    ...input,
    id: createId('log'),
    timestamp: input.timestamp ?? new Date().toISOString()
  };
  state.logs.push(record);
  await writeState(state);
  return record;
}

export async function getEvents(userId: string): Promise<EventRecord[]> {
  const state = await readState();
  return state.events.filter((event) => event.userId === userId).sort((left, right) => left.timestamp.localeCompare(right.timestamp));
}

export async function addEvent(input: Omit<EventRecord, 'id' | 'timestamp'> & { timestamp?: string }): Promise<EventRecord> {
  const state = await readState();
  const record: EventRecord = {
    ...input,
    id: createId('evt'),
    timestamp: input.timestamp ?? new Date().toISOString()
  };
  state.events.push(record);
  await writeState(state);
  return record;
}

export async function addUpload(input: Omit<UploadRecord, 'id' | 'uploadedAt'> & { uploadedAt?: string }): Promise<UploadRecord> {
  const state = await readState();
  const record: UploadRecord = {
    ...input,
    id: createId('upl'),
    uploadedAt: input.uploadedAt ?? new Date().toISOString()
  };
  state.uploads.push(record);
  await writeState(state);
  return record;
}

export async function listUploads(userId: string): Promise<UploadRecord[]> {
  const state = await readState();
  return state.uploads.filter((upload) => upload.userId === userId).sort((left, right) => left.uploadedAt.localeCompare(right.uploadedAt));
}

export async function upsertUser(profile: UserProfile): Promise<UserProfile> {
  const state = await readState();
  const index = state.users.findIndex((user) => user.id === profile.id);
  if (index >= 0) {
    state.users[index] = profile;
  } else {
    state.users.push(profile);
  }
  await writeState(state);
  return profile;
}

export { baseProfile as demoProfile };
