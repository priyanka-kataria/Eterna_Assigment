import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, Activity, ShieldCheck, Zap, Terminal as TerminalIcon, Coins, FileCode, Server } from 'lucide-react';
import { OrderRequest, OrderState, LogEntry } from './types';
import { orderService } from './services/mockOrderService';
import TerminalLog from './components/TerminalLog';
import RouteVisualizer from './components/RouteVisualizer';
import OrderStatusStepper from './components/OrderStatusStepper';

const TOKENS = ['USDC', 'SOL', 'RAY', 'BONK'];

export default function App() {
  // --- State ---
  const [activeOrder, setActiveOrder] = useState<OrderState | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [form, setForm] = useState<OrderRequest>({
    side: 'buy',
    tokenIn: 'USDC',
    tokenOut: 'SOL',
    amount: 100,
    slippage: 0.5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackendInfo, setShowBackendInfo] = useState(false);

  // --- Helpers ---
  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev, {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      level,
      message
    }]);
  }, []);

  // --- Effects ---
  useEffect(() => {
    // Subscribe to service updates
    const unsubscribe = orderService.subscribe((state) => {
      setActiveOrder(state);
      
      // Log generation based on state changes
      switch (state.status) {
        case 'pending':
          addLog('info', `Order ${state.orderId.slice(0, 8)}... queued.`);
          break;
        case 'routing':
          addLog('debug', `Requesting quotes for ${state.amount} ${state.tokenIn} -> ${state.tokenOut}`);
          if (state.meta.rQuote && state.meta.mQuote) {
             addLog('info', `Quotes received: Raydium ($${state.meta.rQuote.price.toFixed(4)}) vs Meteora ($${state.meta.mQuote.price.toFixed(4)})`);
             addLog('success', `Route selected: ${state.meta.chosen?.dex?.toUpperCase()} @ ${state.meta.chosen?.price.toFixed(4)}`);
          }
          break;
        case 'building':
          addLog('debug', `Constructing transaction bundle...`);
          break;
        case 'submitted':
          addLog('warn', `Transaction signed and submitted to network...`);
          break;
        case 'confirmed':
          addLog('success', `CONFIRMED: Tx ${state.meta.txHash?.slice(0, 12)}...`);
          addLog('info', `Final Execution Price: ${state.meta.executedPrice?.toFixed(6)}`);
          setIsSubmitting(false);
          break;
        case 'failed':
          addLog('error', `Order Failed: ${state.meta.error}`);
          setIsSubmitting(false);
          break;
      }
    });

    return () => unsubscribe();
  }, [addLog]);

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setLogs([]); // Clear logs for new run
    setActiveOrder(null);
    
    addLog('info', 'Initializing Execution Engine...');
    try {
      await orderService.executeOrder(form);
    } catch (e) {
      addLog('error', 'Failed to dispatch order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">DEX<span className="text-slate-500 font-light">Executor</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
            
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span>MAINNET-BETA</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-full border border-slate-800">
              <ShieldCheck className="w-3 h-3" />
              <span>MEV PROTECTED</span>
            </div>
          </div>
        </div>
      </header>

      {showBackendInfo && (
        <div className="bg-slate-900 border-b border-slate-800 p-4">
            <div className="max-w-7xl mx-auto flex items-start gap-3">
                <Server className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                    <h3 className="font-bold text-sm text-slate-200">Backend Implementation Generated</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        The Node.js backend files have been generated in the <code>src/</code> directory as requested.
                        This includes <code>server.ts</code> (Fastify), <code>worker.ts</code> (BullMQ), <code>queue.ts</code>, <code>mockDexRouter.ts</code>, and <code>db.ts</code>.
                        <br/><br/>
                        <em>Note: The live preview below uses a browser-based simulation because Node.js, Redis, and Postgres cannot run directly in this view. To run the real backend, download the code and run <code>npm run start:dev</code> locally with Docker.</em>
                    </p>
                </div>
            </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input & Status */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Order Entry Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h2 className="font-semibold text-sm text-slate-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Market Order
              </h2>
              <span className="text-xs text-slate-500 font-mono">RPC: 14ms</span>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: 'buy' })}
                  className={`py-2 text-sm font-semibold rounded-md transition-all ${form.side === 'buy' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, side: 'sell' })}
                  className={`py-2 text-sm font-semibold rounded-md transition-all ${form.side === 'sell' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  SELL
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-3 px-4 text-lg font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    {form.tokenIn}
                  </div>
                </div>
              </div>

              {/* Token Selector (Simplified) */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                   <select 
                    value={form.tokenIn}
                    onChange={(e) => setForm({...form, tokenIn: e.target.value})}
                    className="w-full bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-blue-500"
                   >
                     {TOKENS.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="pt-5 text-slate-600">
                    <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                   <select 
                    value={form.tokenOut}
                    onChange={(e) => setForm({...form, tokenOut: e.target.value})}
                    className="w-full bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-blue-500"
                   >
                     {TOKENS.filter(t => t !== form.tokenIn).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
              </div>

              {/* Slippage & Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                 <span>Slippage Tolerance</span>
                 <span className="font-mono text-slate-300">{form.slippage}%</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-bold text-lg tracking-wide shadow-lg transition-all transform active:scale-[0.98] ${
                  isSubmitting 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : form.side === 'buy' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-emerald-500/20' 
                      : 'bg-rose-500 hover:bg-rose-400 text-rose-950 shadow-rose-500/20'
                }`}
              >
                {isSubmitting ? 'EXECUTING...' : `PLACE ${form.side.toUpperCase()} ORDER`}
              </button>
            </form>
          </div>

          {/* Active Order Status */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 min-h-[140px] flex flex-col justify-center">
            {!activeOrder ? (
               <div className="text-center text-slate-500">
                  <Coins className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Ready to execute.</p>
               </div>
            ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <div className="text-xs text-slate-500 font-mono mb-1">ORDER ID</div>
                        <div className="text-sm font-mono text-slate-300">{activeOrder.orderId.split('-')[0]}...</div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-slate-500 font-mono mb-1">PAIR</div>
                        <div className="text-sm font-bold">{activeOrder.tokenIn}/{activeOrder.tokenOut}</div>
                     </div>
                  </div>
                  <OrderStatusStepper status={activeOrder.status} />
                </>
            )}
          </div>
        </div>

        {/* Right Column: Visualization & Logs */}
        <div className="lg:col-span-7 flex flex-col gap-6 h-[600px] lg:h-auto">
          
          {/* Router Visualization */}
          <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900/0 to-slate-900/0 pointer-events-none"></div>
             <div className="h-full p-4 flex flex-col">
                <RouteVisualizer 
                  rQuote={activeOrder?.meta?.rQuote} 
                  mQuote={activeOrder?.meta?.mQuote} 
                  chosen={activeOrder?.meta?.chosen}
                  side={form.side}
                />
             </div>
          </div>

          {/* Terminal Logs */}
          <div className="flex-1 min-h-[300px]">
            <TerminalLog logs={logs} />
          </div>

        </div>
      </main>
    </div>
  );
}