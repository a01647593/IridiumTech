export type MessageRole = 'user' | 'assistant' | 'system' | 'event';

export interface WhirlpoolDeviceState {
  id: string;
  name: string;
  type: 'washer' | 'dryer' | 'filter' | 'fridge' | 'other';
  status: 'idle' | 'running' | 'done' | 'needs_attention' | 'offline';
  progress: number;
  etaMinutes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  persona: string;
  role: string;
  preferences: {
    compactMode: boolean;
    showDiagnostics: boolean;
    preferredTone: 'formal' | 'friendly' | 'concise';
  };
  activeModules: string[];
  whirlpoolDevices: WhirlpoolDeviceState[];
}

export interface AdaptationConfig {
  userId: string;
  modules: Array<{
    key: string;
    title: string;
    visible: boolean;
    priority: number;
  }>;
  uiTone: 'calm' | 'energetic' | 'technical';
  showProactiveMessages: boolean;
  messagesEndpoint: string;
}

export interface MessageRecord {
  id: string;
  userId: string;
  role: MessageRole;
  title: string;
  content: string;
  timestamp: string;
  source: 'chatbot' | 'whirlpool' | 'system' | 'user';
  severity: 'info' | 'success' | 'warning' | 'critical';
}

export interface LogEntry {
  id: string;
  userId: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  scope: string;
  message: string;
  timestamp: string;
}

export interface UploadRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

export interface EventRecord {
  id: string;
  userId: string;
  source: 'whirlpool' | 'chatbot' | 'system';
  kind: string;
  title: string;
  detail: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  timestamp: string;
}

export interface AppState {
  users: UserProfile[];
  messages: MessageRecord[];
  logs: LogEntry[];
  uploads: UploadRecord[];
  events: EventRecord[];
}
