import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initializeChat() {
  if (socket) return socket;

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
  
  socket = io(backendUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Connected to backend via Socket.IO');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from backend');
  });

  socket.on('error', (error) => {
    console.error('Socket.IO error:', error);
  });

  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    return initializeChat()!;
  }
  return socket;
}

export async function sendChatMessage(content: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    socket.emit('chat:message', { content, token }, (response: any) => {
      if (response?.ok) {
        resolve(response.reply || '');
      } else {
        reject(new Error(response?.error || 'Error al procesar el mensaje'));
      }
    });
  });
}

export function disconnectChat() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
