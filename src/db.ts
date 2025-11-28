import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use a fallback for browser environments to prevent crash during build, 
// though this file is intended for Node.js
const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString: connectionString || 'postgres://postgres:password@127.0.0.1:5432/dex_orders' 
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      side TEXT,
      token_in TEXT,
      token_out TEXT,
      amount NUMERIC,
      slippage NUMERIC,
      status TEXT,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      last_error TEXT,
      tx_hash TEXT,
      executed_price NUMERIC
    );
  `);
}

export async function saveOrder(order: any) {
  const { id, side, tokenIn, tokenOut, amount, slippage, status } = order;
  await pool.query(`
    INSERT INTO orders(id, side, token_in, token_out, amount, slippage, status)
    VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (id) DO UPDATE
      SET status = $7, updated_at = now();
  `, [id, side, tokenIn, tokenOut, amount, slippage, status]);
}

export async function markOrderFailed(id: string, reason: string) {
  await pool.query('UPDATE orders SET status=$2, last_error=$3, updated_at=now() WHERE id=$1', [id, 'failed', reason]);
}

export async function markOrderConfirmed(id: string, txHash: string, executedPrice: number) {
  await pool.query('UPDATE orders SET status=$2, tx_hash=$3, executed_price=$4, updated_at=now() WHERE id=$1', [id, 'confirmed', txHash, executedPrice]);
}

export default pool;