import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

// Socket manzili: devda localhost:3000, PRODDA same-origin (https/wss saqlanadi,
// nginx /socket.io ni :3000 ga proxy qiladi). Mixed Content xatosini oldini oladi.
const _isLocalHostWs =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const BASE =
  import.meta.env.VITE_API_URL ??
  (_isLocalHostWs ? `http://${location.hostname}:3000` : location.origin);

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (!socket) {
    const token = getToken();
    if (!token) return null;

    // Clean up BASE to remove '/api' if it's there
    const origin = BASE.replace(/\/api$/, '');

    socket = io(origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Ulanish xatosi (masalan, token yaroqsiz) — qayta ulanishda yangi tokenni beramiz
    socket.on('connect_error', () => {
      const t = getToken();
      if (socket && t) socket.auth = { token: t };
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
