import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Quote } from '../types';

interface RouteVisualizerProps {
  rQuote?: Quote;
  mQuote?: Quote;
  chosen?: Quote;
  side: 'buy' | 'sell';
}

const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ rQuote, mQuote, chosen, side }) => {
  if (!rQuote || !mQuote) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
        <div className="mb-2">
          <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span>Awaiting Routing Data...</span>
      </div>
    );
  }

  const data = [
    { name: 'Raydium', price: rQuote.price, quote: rQuote },
    { name: 'Meteora', price: mQuote.price, quote: mQuote },
  ];

  // Determine standard deviation to zoom the chart since stablecoin diffs are tiny
  const minPrice = Math.min(rQuote.price, mQuote.price);
  const maxPrice = Math.max(rQuote.price, mQuote.price);
  const domain = [minPrice * 0.999, maxPrice * 1.001];

  return (
    <div className="h-full w-full flex flex-col">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Smart Router Comparison</h3>
      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={domain} 
              hide 
            />
            <Tooltip 
              cursor={{fill: 'rgba(255,255,255,0.05)'}}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
              itemStyle={{ color: '#cbd5e1' }}
              formatter={(value: number) => [value.toFixed(6), 'Price']}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const isWinner = entry.quote.dex === chosen?.dex;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isWinner ? '#10b981' : '#334155'} 
                    stroke={isWinner ? '#34d399' : 'transparent'}
                    strokeWidth={isWinner ? 2 : 0}
                    className="transition-all duration-500"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
         <div className={`p-2 rounded border ${chosen?.dex === 'raydium' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
            <div className="font-bold">Raydium</div>
            <div>{rQuote.price.toFixed(5)}</div>
         </div>
         <div className={`p-2 rounded border ${chosen?.dex === 'meteora' ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
            <div className="font-bold">Meteora</div>
            <div>{mQuote.price.toFixed(5)}</div>
         </div>
      </div>
    </div>
  );
};

export default RouteVisualizer;