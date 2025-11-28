import { OrderRequest, OrderState, OrderStatus, Quote } from '../types';

/**
 * This service simulates the backend logic described in the prompt.
 * In a real scenario, this would connect to ws://localhost:3000/api/orders/execute
 */
export class MockOrderService {
  private subscribers: ((state: OrderState) => void)[] = [];
  
  // Base simulation delays (ms)
  private readonly NETWORK_DELAY = 600;
  private readonly ROUTING_DELAY = 1200;
  private readonly BUILDING_DELAY = 800;
  private readonly EXECUTION_DELAY = 2500;

  subscribe(callback: (state: OrderState) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private emit(state: OrderState) {
    this.subscribers.forEach(cb => cb(state));
  }

  // Simulate the full lifecycle of an order
  async executeOrder(req: OrderRequest): Promise<string> {
    const orderId = crypto.randomUUID();
    const startTime = Date.now();

    const baseState: OrderState = {
      orderId,
      status: 'pending',
      timestamp: startTime,
      meta: {},
      side: req.side,
      tokenIn: req.tokenIn,
      tokenOut: req.tokenOut,
      amount: req.amount
    };

    // 1. Pending (Accepted)
    this.emit(baseState);

    // Simulate async processing
    setTimeout(async () => {
      try {
        // 2. Routing
        const rPriceBase = req.side === 'buy' ? 1.05 : 0.95; 
        const mPriceBase = req.side === 'buy' ? 1.04 : 0.96;
        
        // Add random variance
        const rPrice = rPriceBase * (1 + (Math.random() * 0.02 - 0.01));
        const mPrice = mPriceBase * (1 + (Math.random() * 0.02 - 0.01));

        const rQuote: Quote = { price: rPrice, fee: 0.003, dex: 'raydium' };
        const mQuote: Quote = { price: mPrice, fee: 0.002, dex: 'meteora' };

        // Logic: Buy = Lower price is better. Sell = Higher price is better.
        // Simplified for this mock: assume we want best execution regardless of side logic for display
        // Actually adhering to prompt logic: rQuote vs mQuote comparison.
        // Let's assume Buy: want lowest price. Sell: want highest.
        
        let chosen: Quote;
        if (req.side === 'buy') {
            chosen = rQuote.price < mQuote.price ? rQuote : mQuote;
        } else {
            chosen = rQuote.price > mQuote.price ? rQuote : mQuote;
        }

        const routingState: OrderState = {
          ...baseState,
          status: 'routing',
          timestamp: Date.now(),
          meta: { rQuote, mQuote, chosen }
        };
        this.emit(routingState);

        await this.wait(this.ROUTING_DELAY);

        // 3. Building
        const buildingState: OrderState = {
          ...routingState,
          status: 'building',
          timestamp: Date.now()
        };
        this.emit(buildingState);

        await this.wait(this.BUILDING_DELAY);

        // 4. Submitted
        const submittedState: OrderState = {
          ...buildingState,
          status: 'submitted',
          timestamp: Date.now(),
          meta: { ...buildingState.meta, dex: chosen.dex }
        };
        this.emit(submittedState);

        await this.wait(this.EXECUTION_DELAY);

        // 5. Confirmed (or Failed)
        if (Math.random() > 0.95) {
          // 5% chance of failure
           throw new Error("Slippage tolerance exceeded during execution");
        }

        const txHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        const confirmedState: OrderState = {
          ...submittedState,
          status: 'confirmed',
          timestamp: Date.now(),
          meta: {
            ...submittedState.meta,
            txHash,
            executedPrice: chosen.price
          }
        };
        this.emit(confirmedState);

      } catch (err: any) {
        const failedState: OrderState = {
          ...baseState,
          status: 'failed',
          timestamp: Date.now(),
          meta: { error: err.message || 'Unknown error' }
        };
        this.emit(failedState);
      }
    }, this.NETWORK_DELAY);

    return orderId;
  }

  private wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const orderService = new MockOrderService();