import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalLogProps {
  logs: LogEntry[];
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-400';
      case 'success': return 'text-emerald-400';
      case 'warn': return 'text-amber-400';
      case 'error': return 'text-rose-500';
      case 'debug': return 'text-slate-500';
      default: return 'text-slate-300';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden font-mono text-xs md:text-sm shadow-inner">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-slate-400 font-semibold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          EXECUTION_LOG
        </span>
        <span className="text-slate-600">v1.0.4-mock</span>
      </div>
      <div className="flex-1 p-4 overflow-y-auto custom-scroll space-y-1">
        {logs.length === 0 && (
          <div className="text-slate-600 italic opacity-50">Waiting for order signals...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="break-all">
            <span className="text-slate-600 mr-2">
              [{formatTime(log.timestamp)}]
            </span>
            <span className={`font-bold mr-2 uppercase w-16 inline-block ${getLevelColor(log.level)}`}>
              {log.level}
            </span>
            <span className="text-slate-300">
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalLog;