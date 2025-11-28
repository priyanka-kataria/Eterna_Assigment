import type { WebSocket } from 'ws';

// Map orderId -> WebSocket connection
const sockets = new Map<string, WebSocket>();

export function bindSocket(orderId: string, ws: WebSocket) {
  sockets.set(orderId, ws);
  ws.on('close', () => sockets.delete(orderId));
}

export function emit(orderId: string, payload: any) {
  const ws = sockets.get(orderId);
  if (!ws || ws.readyState !== 1) return; // 1 = OPEN
  try {
    ws.send(JSON.stringify(payload));
  } catch (e) {
    console.error(`Failed to send WS message for ${orderId}`, e);
  }
}