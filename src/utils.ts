import { randomUUID } from 'crypto';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const now = () => Date.now();
export const genId = () => randomUUID();
export const genTxHash = () => '0x' + Math.random().toString(16).slice(2, 18);