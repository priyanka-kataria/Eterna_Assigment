# DEX Order Execution Engine (Mock)

> **Option B: Mock Implementation**
> A high-performance mock execution engine simulating market order routing across Raydium and Meteora on Solana.

##  Overview

This project implements a backend execution engine that handles **Market Orders** with intelligent routing (Smart Router). It simulates the latency, price variance, and transaction lifecycle of a real Solana DEX interaction without requiring mainnet funds.

### Core Features
*   **Smart Routing**: Queries multiple DEXs (Raydium, Meteora) and routes to the best price.
*   **Hybrid API**: Single endpoint (`POST /api/orders/execute`) handles order creation and seamlessly upgrades to WebSocket for live status streaming.
*   **Concurrency**: Powered by BullMQ (Redis) to handle concurrent order processing with exponential backoff.
*   **Resilience**: Automatic retries for failed transactions and comprehensive state management.

---

##  Design Decisions

### 1. Why "Market Order"?
I chose to implement **Market Orders** because they represent the "critical path" for an execution engine. A market order stresses the system's ability to perform immediate routing, slippage calculation, and execution under latency constraints. 
*   *Rationale*: If the engine can handle the immediate throughput and locking requirements of market orders, adding conditional logic (Limit) or event listeners (Sniper) is a strictly additive task that reuses this core pipeline.

### 2. HTTP → WebSocket Upgrade Pattern
Instead of maintaining separate REST endpoints for submission and WebSocket endpoints for updates, I utilized a protocol upgrade pattern.
*   *Rationale*: This simplifies the client architecture. The client makes a single connection request; if successful, they immediately receive the `orderId` and stay connected to receive the `confirmed` or `failed` signal. This eliminates race conditions where a client might subscribe to a socket too late to catch the initial state change.

---

## Architecture

The system follows a microservices-lite architecture:

1.  **API Gateway (Fastify)**: Accepts HTTP POST, validates payload, enqueues the job, and upgrades the connection to WebSocket.
2.  **Order Queue (BullMQ + Redis)**: Decouples ingestion from processing. Configured for high concurrency (10 parallel jobs).
3.  **Execution Worker**: Consumes jobs, queries the `MockDexRouter`, simulates network latency, and commits results.
4.  **Persistence (PostgreSQL)**: Stores the final state, executed price, and transaction hash for auditability.

---

##  Extensibility Guide

The engine is designed to be easily extended for other order types using the same `ordersQueue`:

### Supporting Limit Orders
*   **Logic**: Execute only when `current_price <= target_price` (Buy).
*   **Implementation**: Create a separate `PriceWatcher` service that polls Pyth/Switchboard or subscribes to price updates.
*   **Integration**: When the condition is met, the Watcher constructs the payload and calls `ordersQueue.add()`. The existing Worker handles the execution logic unchanged.

### Supporting Sniper Orders
*   **Logic**: Execute in the same block as a Liquidity Pool creation.
*   **Implementation**: Create a `MempoolMonitor` service listening for `InitializePool` instructions on the Solana RPC.
*   **Integration**: Upon detection, the Monitor pushes a job with `{ priority: 'high' }` to the queue.

---

##  Setup & Run

### Prerequisites
*   Node.js 18+
*   Redis (default: localhost:6379)
*   PostgreSQL (default: localhost:5432)

### Installation
```bash
npm install
```

### Running the Backend
The system requires two processes (API and Worker). You can run them together or separately.

**Development Mode (Simulated):**
```bash
# Terminal 1: Start the API Server
npm run start:server

# Terminal 2: Start the Execution Worker
npm run start:worker
```

**Testing:**
Run the Jest test suite to verify routing and queue logic.
```bash
npm test
```

---

##  Testing Strategy

The project includes a suite of **12 Integration Tests** (`tests/engine.test.ts`) covering:
1.  **Routing Accuracy**: verifying the engine selects the lower price for BUY orders and higher for SELL.
2.  **Concurrency**: verifying the queue accepts multiple jobs.
3.  **Resilience**: verifying that execution failures trigger the retry mechanism.
4.  **Fees & Slippage**: ensuring DEX fees are accounted for in quotes.

---

##  API Reference

### Execute Order
`POST /api/orders/execute` (Connection: Upgrade)

**Payload:**
```json
{
  "side": "buy",
  "tokenIn": "USDC",
  "tokenOut": "SOL",
  "amount": 100,
  "slippage": 1.0
}
```

**WebSocket Events:**
1.  `{ status: "pending", ... }`
2.  `{ status: "routing", meta: { rQuote, mQuote } }`
3.  `{ status: "submitted", meta: { dex: "raydium" } }`
4.  `{ status: "confirmed", meta: { txHash: "0x...", executedPrice: 102.5 } }`

---

##  Resources
*   [Raydium SDK](https://github.com/raydium-io/raydium-sdk-V2-demo)
*   [Meteora Docs](https://docs.meteora.ag/)
