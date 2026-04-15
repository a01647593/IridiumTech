import type { AdaptationConfig, EventRecord, LogEntry, MessageRecord, UploadRecord, UserProfile } from '@shared/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getHealth() {
  return requestJson<{ ok: boolean; service: string; timestamp: string }>('/api/health');
}

export async function getAdaptability(userId: string) {
  return requestJson<{ profile: UserProfile; config: AdaptationConfig }>(`/api/adaptability/${userId}`);
}

export async function getMessages(userId: string) {
  return requestJson<{ messages: MessageRecord[] }>(`/api/messages/${userId}`);
}

export async function getLogs(userId: string) {
  return requestJson<{ logs: LogEntry[] }>(`/api/logs/${userId}`);
}

export async function getEvents(userId: string) {
  return requestJson<{ events: EventRecord[] }>(`/api/events/${userId}`);
}

export async function getUploads(userId: string) {
  return requestJson<{ uploads: UploadRecord[] }>(`/api/uploads/${userId}`);
}

export async function postMessage(userId: string, content: string) {
  return requestJson<{ userMessage: MessageRecord; assistantMessage: MessageRecord }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ userId, content, role: 'user' })
  });
}

export async function postWhirlpoolEvent(payload: { userId: string; title: string; detail: string; kind?: string; severity?: 'info' | 'success' | 'warning' | 'critical' }) {
  return requestJson<{ event: EventRecord; message: MessageRecord }>('/api/whirlpool/event', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function uploadFile(userId: string, file: File) {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json() as Promise<{ upload: UploadRecord; event: EventRecord }>;
}
