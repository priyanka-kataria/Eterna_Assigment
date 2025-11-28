import { createWorker } from './queue';
import { MockDexRouter } from './mockDexRouter';
import { emit } from './wsManager';
import { saveOrder, markOrderConfirmed, markOrderFailed } from './db';
import { sleep } from './utils';

const router = new MockDexRouter();

async function processJob(job: any) {
  const order = job.data;
  const orderId = order.id;
  try {
    // 1) pending
    emit(orderId, { orderId, status: 'pending', timestamp: Date.now(), meta: {} });
    await saveOrder({ ...order, status: 'pending' });

    // 2) routing
    emit(orderId, { orderId, status: 'routing', timestamp: Date.now(), meta: {} });
    const [rQuote, mQuote] = await Promise.all([
      router.getRaydiumQuote(order.tokenIn, order.tokenOut, order.amount),
      router.getMeteoraQuote(order.tokenIn, order.tokenOut, order.amount),
    ]);
    const chosen = rQuote.price < mQuote.price ? rQuote : mQuote;
    emit(orderId, { orderId, status: 'routing', timestamp: Date.now(), meta: { rQuote, mQuote, chosen } });

    // 3) building
    emit(orderId, { orderId, status: 'building', timestamp: Date.now(), meta: { chosen } });
    await sleep(200);

    // 4) submitted
    emit(orderId, { orderId, status: 'submitted', timestamp: Date.now(), meta: { dex: chosen.dex } });

    // execute
    const exec = await router.executeSwap(chosen.dex, order, order.slippage ?? 0.005);

    // 5) confirmed
    await markOrderConfirmed(orderId, exec.txHash, exec.executedPrice);
    emit(orderId, { orderId, status: 'confirmed', timestamp: Date.now(), meta: { txHash: exec.txHash, executedPrice: exec.executedPrice } });
  } catch (err: any) {
    const reason = err?.message ?? String(err);
    await markOrderFailed(orderId, reason).catch(() => {});
    emit(orderId, { orderId, status: 'failed', timestamp: Date.now(), meta: { error: reason } });
    throw err; // allow BullMQ retry/backoff to operate
  }
}


// In a real environment, check require.main === module. 

if (typeof require !== 'undefined' && require.main === module) {
  createWorker(async (job) => processJob(job));
  console.log('Worker started...');
}

export { processJob };