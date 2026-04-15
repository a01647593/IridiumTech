import { useEffect, useMemo, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  getAdaptability,
  getEvents,
  getHealth,
  getLogs,
  getMessages,
  getUploads,
  postMessage,
  postWhirlpoolEvent,
  uploadFile
} from './api';
import type { AdaptationConfig, EventRecord, LogEntry, MessageRecord, UploadRecord, UserProfile, WhirlpoolDeviceState } from '@shared/types';

const USER_ID = 'persona-4';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const suggestedPrompts = [
  'Muéstrame el estado del sistema',
  '¿Qué mensajes tiene Whirlpool?',
  'Necesito cargar un archivo',
  'Simula una alerta de mantenimiento'
];

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function severityLabel(severity: EventRecord['severity']): string {
  switch (severity) {
    case 'critical':
      return 'Crítico';
    case 'warning':
      return 'Atención';
    case 'success':
      return 'OK';
    default:
      return 'Info';
  }
}

function statusTone(device: WhirlpoolDeviceState): string {
  return `${device.status} device-${device.type}`;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<AdaptationConfig | null>(null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [health, setHealth] = useState<string>('verificando');
  const [draft, setDraft] = useState('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [socketState, setSocketState] = useState<'connecting' | 'live' | 'offline'>('connecting');

  useEffect(() => {
    let active = true;
    const socket: Socket = io(API_BASE || '/', { transports: ['websocket'] });

    const load = async () => {
      try {
        const [healthResult, adaptabilityResult, messageResult, logResult, eventResult, uploadResult] = await Promise.all([
          getHealth(),
          getAdaptability(USER_ID),
          getMessages(USER_ID),
          getLogs(USER_ID),
          getEvents(USER_ID),
          getUploads(USER_ID)
        ]);

        if (!active) {
          return;
        }

        setHealth(healthResult.ok ? `online · ${formatTime(healthResult.timestamp)}` : 'offline');
        setProfile(adaptabilityResult.profile);
        setConfig(adaptabilityResult.config);
        setMessages(messageResult.messages);
        setLogs(logResult.logs);
        setEvents(eventResult.events);
        setUploads(uploadResult.uploads);
      } catch (error) {
        if (!active) {
          return;
        }
        setHealth('backend no disponible');
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    socket.on('connect', () => setSocketState('live'));
    socket.on('disconnect', () => setSocketState('offline'));
    socket.on('message:new', (message: MessageRecord) => {
      setMessages((current) => {
        if (current.some((existing) => existing.id === message.id)) {
          return current;
        }
        return [...current, message];
      });
    });
    socket.on('event:new', (event: EventRecord) => {
      setEvents((current) => {
        if (current.some((existing) => existing.id === event.id)) {
          return current;
        }
        return [...current, event];
      });
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, []);

  const orderedMessages = useMemo(() => [...messages].sort((left, right) => left.timestamp.localeCompare(right.timestamp)), [messages]);
  const orderedLogs = useMemo(() => [...logs].sort((left, right) => left.timestamp.localeCompare(right.timestamp)).slice(-6), [logs]);
  const orderedEvents = useMemo(() => [...events].sort((left, right) => right.timestamp.localeCompare(left.timestamp)).slice(0, 5), [events]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) {
      return;
    }

    setSending(true);
    setDraft('');

    try {
      const result = await postMessage(USER_ID, content);
      setMessages((current) => {
        const filtered = current.filter((message) => message.id !== result.userMessage.id && message.id !== result.assistantMessage.id);
        return [...filtered, result.userMessage, result.assistantMessage];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleUpload = async (file: File | null) => {
    if (!file || uploading) {
      return;
    }

    setUploading(true);
    setSelectedFileName(file.name);

    try {
      const result = await uploadFile(USER_ID, file);
      setUploads((current) => [...current, result.upload]);
      setEvents((current) => [...current, result.event]);
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const simulateEvent = async () => {
    try {
      const result = await postWhirlpoolEvent({
        userId: USER_ID,
        title: 'Mantenimiento sugerido',
        detail: 'Se detectó un patrón de uso alto en el filtro de agua.',
        kind: 'maintenance',
        severity: 'warning'
      });
      setEvents((current) => [...current, result.event]);
      setMessages((current) => [...current, result.message]);
    } catch (error) {
      console.error(error);
    }
  };

  const applyPrompt = (prompt: string) => setDraft(prompt);

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />
      <div className="noise" />

      <header className="hero">
        <div>
          <p className="eyebrow">Whirlpool Adaptive Platform</p>
          <h1>Chatbot, eventos y módulos adaptativos en una sola vista.</h1>
          <p className="hero-copy">
            El backend actúa como orquestador, transforma las APIs externas y empuja mensajes en tiempo real para que el front muestre contexto, alertas y acciones.
          </p>
        </div>

        <div className="status-card">
          <div className="status-row">
            <span className={`status-pill ${socketState}`}>{socketState === 'live' ? 'Socket activo' : socketState === 'connecting' ? 'Conectando' : 'Offline'}</span>
            <span className="status-meta">{health}</span>
          </div>
          <div className="status-grid">
            <div>
              <strong>{profile?.persona ?? 'Persona 4'}</strong>
              <span>Perfil adaptativo</span>
            </div>
            <div>
              <strong>{messages.length}</strong>
              <span>Mensajes</span>
            </div>
            <div>
              <strong>{events.length}</strong>
              <span>Eventos</span>
            </div>
          </div>
        </div>
      </header>

      <section className="dashboard-grid">
        <section className="panel panel-chat">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">Chatbot UI</p>
              <h2>Interacción y notificaciones proactivas</h2>
            </div>
            <button className="ghost-button" onClick={simulateEvent}>Simular evento Whirlpool</button>
          </div>

          <div className="prompt-row">
            {suggestedPrompts.map((prompt) => (
              <button key={prompt} className="chip-button" onClick={() => applyPrompt(prompt)}>{prompt}</button>
            ))}
          </div>

          <div className="message-stream">
            {loading ? (
              <div className="loading-state">
                <span className="spinner" />
                <p>Cargando conversaciones, eventos y estado de la plataforma...</p>
              </div>
            ) : (
              orderedMessages.map((message) => (
                <article className={`message-card ${message.role}`} key={message.id}>
                  <div className="message-topline">
                    <strong>{message.title}</strong>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                  <p>{message.content}</p>
                  <footer>
                    <span className={`severity severity-${message.severity}`}>{severityLabel(message.severity)}</span>
                    <span>{message.source}</span>
                  </footer>
                </article>
              ))
            )}
          </div>

          <div className="composer">
            <label className="file-dropzone">
              <input type="file" onChange={(event) => handleUpload(event.target.files?.[0] ?? null)} />
              <span>{uploading ? 'Subiendo archivo...' : selectedFileName || 'Arrastra o selecciona un archivo'}</span>
            </label>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Escribe una pregunta sobre Whirlpool, el reto o los mensajes..."
              rows={4}
            />
            <div className="composer-actions">
              <span className="hint">El front llama al backend; el backend decide qué responder y qué guardar.</span>
              <button className="primary-button" onClick={handleSend} disabled={sending}>
                {sending ? 'Procesando...' : 'Enviar mensaje'}
              </button>
            </div>
          </div>
        </section>

        <aside className="panel panel-rail">
          <section className="rail-section">
            <div className="panel-header compact">
              <div>
                <p className="panel-kicker">Adaptabilidad</p>
                <h3>Módulos visibles</h3>
              </div>
            </div>
            <div className="module-list">
              {config?.modules.map((module) => (
                <div className={`module-row ${module.visible ? 'visible' : 'hidden'}`} key={module.key}>
                  <span>{module.title}</span>
                  <strong>{module.visible ? 'activo' : 'oculto'}</strong>
                </div>
              )) ?? <p className="empty-copy">La configuración aparecerá cuando el backend responda.</p>}
            </div>
          </section>

          <section className="rail-section">
            <div className="panel-header compact">
              <div>
                <p className="panel-kicker">Whirlpool</p>
                <h3>Dispositivos</h3>
              </div>
            </div>
            <div className="device-list">
              {profile?.whirlpoolDevices.map((device) => (
                <article className={statusTone(device)} key={device.id}>
                  <div className="device-head">
                    <strong>{device.name}</strong>
                    <span>{device.status.replace('_', ' ')}</span>
                  </div>
                  <div className="progress-bar">
                    <i style={{ width: `${device.progress}%` }} />
                  </div>
                  <footer>
                    <span>{device.progress}%</span>
                    <span>{device.etaMinutes ? `${device.etaMinutes} min` : 'sin ETA'}</span>
                  </footer>
                </article>
              )) ?? <p className="empty-copy">Sin datos de dispositivos.</p>}
            </div>
          </section>

          <section className="rail-section split-grid">
            <div>
              <div className="panel-header compact">
                <div>
                  <p className="panel-kicker">Logs</p>
                  <h3>Depuración</h3>
                </div>
              </div>
              <div className="log-list">
                {orderedLogs.map((log) => (
                  <div key={log.id} className={`log-row level-${log.level}`}>
                    <span>{log.scope}</span>
                    <p>{log.message}</p>
                    <small>{formatTime(log.timestamp)}</small>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="panel-header compact">
                <div>
                  <p className="panel-kicker">Eventos</p>
                  <h3>Mensajería proactiva</h3>
                </div>
              </div>
              <div className="event-list">
                {orderedEvents.map((event) => (
                  <article key={event.id} className={`event-card severity-${event.severity}`}>
                    <div className="event-head">
                      <strong>{event.title}</strong>
                      <span>{severityLabel(event.severity)}</span>
                    </div>
                    <p>{event.detail}</p>
                    <small>{formatTime(event.timestamp)}</small>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rail-section">
            <div className="panel-header compact">
              <div>
                <p className="panel-kicker">Carga</p>
                <h3>Archivos recibidos</h3>
              </div>
            </div>
            <div className="upload-list">
              {uploads.length > 0 ? uploads.slice(-4).map((upload) => (
                <div key={upload.id} className="upload-row">
                  <strong>{upload.fileName}</strong>
                  <span>{Math.round(upload.size / 1024)} KB · {formatTime(upload.uploadedAt)}</span>
                </div>
              )) : <p className="empty-copy">Todavía no hay archivos subidos.</p>}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
