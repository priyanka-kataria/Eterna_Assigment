export type OrderSide = 'buy' | 'sell';

export type OrderStatus = 
  | 'idle'
  | 'pending' 
  | 'routing' 
  | 'building' 
  | 'submitted' 
  | 'confirmed' 
  | 'failed';

export interface Quote {
  price: number;
  fee: number;
  dex: 'raydium' | 'meteora';
}

export interface OrderMeta {
  rQuote?: Quote;
  mQuote?: Quote;
  chosen?: Quote;
  dex?: string;
  txHash?: string;
  executedPrice?: number;
  error?: string;
}

export interface OrderState {
  orderId: string;
  status: OrderStatus;
  timestamp: number;
  meta: OrderMeta;
  side: OrderSide;
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface OrderRequest {
  side: OrderSide;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  slippage: number;
}