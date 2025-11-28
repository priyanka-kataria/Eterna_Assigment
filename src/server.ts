import Fastify from 'fastify';
import websocketPlugin from 'fastify/websocket';
import { addOrderJob } from './queue';
import { genId } from './utils';
import { bindSocket } from './wsManager';
import { initDb, saveOrder } from './db';
import dotenv from 'dotenv';

dotenv.config();
const PORT = Number(process.env.PORT || 3000);
const fastify = Fastify({ logger: true });

// @ts-ignore - plugin types compatibility
fastify.register(websocketPlugin);

// POST /api/orders/execute -> returns orderId and upgrades connection to websocket
fastify.post('/api/orders/execute', { websocket: true } as any, async (conn: any, req: any) => {
  const socket = conn.socket;

  
  let payload: any = {};
  
  // Handling raw stream if needed, but for simplicity we'll listen for the first WS message as the "Start Order" intent
  // OR we follow the snippet exactly:
  let body = '';
  req.raw.on('data', (chunk: Buffer) => (body += chunk.toString()));
  await new Promise((r) => req.raw.on('end', r));
  
  try {
     if (body) payload = JSON.parse(body);
  } catch(e) {}

  // If payload is empty (common in pure WS upgrade), we might wait for a message. 
  // But adhering to the prompt snippet:
  
  const processOrder = async (data: any) => {
      // create order
      const orderId = genId();
      const order = {
        id: orderId,
        side: data.side || 'buy',
        tokenIn: data.tokenIn,
        tokenOut: data.tokenOut,
        amount: Number(data.amount || 0),
        slippage: data.slippage ?? 0.005,
        status: 'accepted'
      };

      // bind socket and send initial ack
      bindSocket(orderId, socket);
      socket.send(JSON.stringify({ orderId, status: 'accepted', timestamp: Date.now() }));

      // persist minimal
      await initDb().catch(e => console.error("DB Init fail", e));
      await saveOrder(order).catch(e => console.error("Save Order fail", e));

      // enqueue job
      await addOrderJob(order);
  }

  if (payload.amount) {
      await processOrder(payload);
  } else {
      // Fallback: wait for first message
      socket.once('message', async (raw: any) => {
          try {
              const data = JSON.parse(raw.toString());
              await processOrder(data);
          } catch (e) {
              socket.close();
          }
      });
  }

  // keep ws open; messages are emitted by worker(wsManager)
  socket.on('message', (m: any) => {
    try { const parsed = JSON.parse(m.toString()); fastify.log.info({ parsed }); } catch {}
  });
});

// health
fastify.get('/health', async () => ({ ok: true }));

const start = async () => {
  await initDb().catch(err => console.error("Database connection failed (expected in browser preview)", err.message));
  try {
      await fastify.listen({ port: PORT, host: '0.0.0.0' });
      console.log(`Server running at http://localhost:${PORT}`);
  } catch (err) {
      fastify.log.error(err);
      process.exit(1);
  }
};

// Check if run directly
if (typeof require !== 'undefined' && require.main === module) {
    start();
}

export { start };