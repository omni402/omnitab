# omni402 Facilitator

Payment verification and settlement service for the omni402 protocol.

## Overview

The Facilitator is an Express.js service that:
1. Verifies payment proofs from EdgePayment transactions
2. Stores payment records in PostgreSQL
3. Listens to Hub events for settlement confirmations
4. Provides payment history for merchant dashboards

## Architecture

```mermaid
flowchart TB
    subgraph Clients
        SDK[SDK/Client]
        Dashboard[Merchant Dashboard]
    end

    subgraph Facilitator
        API[Express API]
        Verify[Verify Service]
        Settle[Settle Service]
        Listener[Event Listener]
        DB[(PostgreSQL)]
    end

    subgraph Blockchain
        Edge[EdgePayment<br/>Arbitrum]
        Hub[OmniTabHub<br/>Base]
    end

    SDK -->|POST /verify| API
    SDK -->|POST /settle| API
    Dashboard -->|GET /payments/:merchant| API

    API --> Verify
    API --> Settle
    Verify -->|Read tx| Edge
    Settle -->|Store| DB

    Listener -->|Watch events| Hub
    Listener -->|Update status| DB
```

## API Endpoints

### `GET /health`
Health check endpoint.

### `GET /supported`
Returns supported chains and tokens.

### `POST /verify`
Verify a payment without storing it.

### `POST /settle`
Verify and store a payment.

### `GET /payments/:merchant`
Get payment history for a merchant address.

## Payment Verification Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Verify
    participant Arbitrum

    Client->>API: POST /verify
    API->>Verify: verifyPayment()
    Verify->>Arbitrum: Get tx receipt
    Arbitrum-->>Verify: Receipt + logs
    Verify->>Verify: Decode PaymentExecuted event
    Verify->>Verify: Validate amount >= required
    Verify-->>API: { isValid, payer }
    API-->>Client: Response
```

## Event Listener

Listens to `PaymentSettled` events from Hub to update payment statuses:

```mermaid
stateDiagram-v2
    [*] --> pending: /settle called
    pending --> settled: PaymentSettled event
```

## Database Schema

```prisma
model Payment {
  id              String   @id @default(uuid())
  invoiceId       String
  sourceChain     Int
  payerAddress    String
  merchantAddress String
  amount          Decimal
  edgeTxHash      String   @unique
  lzMessageId     String
  status          String   @default("pending")
  createdAt       DateTime @default(now())
  settledAt       DateTime?
  settlementTxHash String?
}
```

## Configuration

```env
DATABASE_URL=postgres://...
BASE_RPC_URL=https://mainnet.base.org
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
HUB_ADDRESS=0x...
EDGE_ARBITRUM_ADDRESS=0x...
PORT=3001
```

## Running

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
