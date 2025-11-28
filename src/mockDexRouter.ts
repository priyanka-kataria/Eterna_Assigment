import { sleep, genTxHash } from './utils';

interface Quote { price: number; fee: number; dex: string; }

export class MockDexRouter {
  basePrice = 1; // base price for mock

  async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
    // 200ms delay to simulate network
    await sleep(200);
    const price = this.basePrice * (0.98 + Math.random() * 0.04); // +/-2%
    return { price, fee: 0.003, dex: 'raydium' };
  }

  async getMeteoraQuote(tokenIn: string, tokenOut: string, amount: number): Promise<Quote> {
    await sleep(200);
    const price = this.basePrice * (0.97 + Math.random() * 0.05); // +/-3%
    return { price, fee: 0.002, dex: 'meteora' };
  }

  async executeSwap(dex: string, order: any, slippage: number) {
    // simulate 2-3s execution delay
    await sleep(2000 + Math.random() * 1000);
    
    // random failure chance small
    if (Math.random() < 0.05) throw new Error('mock-execution-reverted');
    
    const executedPrice = (dex === 'raydium' ? 1.0 : 0.995) * (1 + (Math.random() - 0.5) * slippage);
    return { txHash: genTxHash(), executedPrice };
  }
}