# FX Trading App – Backend

A production-grade NestJS backend for an FX Trading application supporting multi-currency wallets, real-time FX rate integration, currency conversion, NGN trading, and full transaction history.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Key Assumptions](#key-assumptions)
- [API Documentation](#api-documentation)
- [Architecture Decisions](#architecture-decisions)
- [Security Considerations](#security-considerations)
- [Scalability Notes](#scalability-notes)

---

## Quick Start

```bash
git clone <repo-url>
cd fx-trading-app
cp .env.example .env
# Edit .env with your DB, email, and FX API credentials
npm install
npm run start:dev
```

Swagger UI: http://localhost:3000/api/docs
Postman: https://documenter.getpostman.com/view/23652017/2sBXihpXmB

---

## Setup Instructions

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- (Optional) Redis for distributed caching

### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE fx_trading;
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable          | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `DB_HOST`         | PostgreSQL host                                          |
| `DB_PORT`         | PostgreSQL port (default: 5432)                          |
| `DB_USERNAME`     | DB username                                              |
| `DB_PASSWORD`     | DB password                                              |
| `DB_DATABASE`     | Database name                                            |
| `JWT_SECRET`      | Secret for JWT signing (use a long random string)        |
| `JWT_EXPIRES_IN`  | JWT expiry (e.g. `7d`)                                   |
| `MAIL_HOST`       | SMTP host (e.g. `smtp.gmail.com`)                        |
| `MAIL_PORT`       | SMTP port (e.g. `587`)                                   |
| `MAIL_USER`       | SMTP username / email                                    |
| `MAIL_PASSWORD`   | SMTP password or app password                            |
| `MAIL_FROM`       | From name and address                                    |
| `FX_API_KEY`      | API key from exchangerate-api.com (free tier available)  |
| `FX_API_BASE_URL` | Base URL (default: `https://v6.exchangerate-api.com/v6`) |
| `FX_CACHE_TTL`    | FX rate cache duration in seconds (default: 300)         |

### 3. Run

```bash
# Development (with auto-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

> **Note on `synchronize`:** TypeORM `synchronize: true` is enabled in non-production environments to auto-create tables. For production, use migrations.

### 4. Tests

```bash
npm test          # unit tests
npm run test:cov  # coverage report
```

---

## Key Assumptions

1. **FX Rate Source:** Using [exchangerate-api.com](https://www.exchangerate-api.com) (free tier: 1,500 req/month). Without an API key, the app falls back to hardcoded approximate rates so development works offline.

2. **Trade vs Convert:** The `/wallet/trade` endpoint is restricted to NGN pairs (NGN ↔ USD, NGN ↔ EUR, etc.). General cross-currency conversion (USD ↔ EUR) uses `/wallet/convert`.

3. **Wallet Creation:** A wallet is automatically created for each user upon registration with an initial NGN balance of 0.

4. **Balance Precision:** Stored as `DECIMAL(20, 8)` – 8 decimal places, suitable for most FX pairs including JPY.

5. **Rate Locking:** FX rates are fetched **before** entering the database transaction to avoid holding a DB lock during an external HTTP call. The rate is "locked in" at the moment the user initiates the trade, consistent with typical FX platforms.

6. **Email in Dev:** If email sending fails (e.g., no SMTP credentials configured), registration still succeeds and the OTP is logged. In production, a queue-based retry mechanism should be used.

7. **Decimal Arithmetic:** Arithmetic is done with JavaScript `parseFloat` rounded to 8 decimal places. For a production system, a dedicated decimal arithmetic library (`decimal.js`, `bignumber.js`) should be used to avoid floating-point edge cases.

8. **Supported Currencies:** NGN, USD, EUR, GBP, JPY, CAD, AUD, CHF. Easily extendable by adding to the `Currency` enum.

---

## API Documentation

Interactive Swagger documentation is available at `http://localhost:3000/api/docs` when the app is running.

### Authentication Flow

```
POST /auth/register  →  OTP sent to email
POST /auth/verify    →  Activate account, receive JWT
POST /auth/login     →  Receive JWT (subsequent logins)
```

All wallet, FX, and transaction endpoints require `Authorization: Bearer <JWT>`.

### Endpoints

#### Auth

| Method | Endpoint           | Description                           |
| ------ | ------------------ | ------------------------------------- |
| POST   | `/auth/register`   | Register user, trigger OTP email      |
| POST   | `/auth/verify`     | Verify OTP, activate account, get JWT |
| POST   | `/auth/login`      | Login with email/password, get JWT    |
| POST   | `/auth/resend-otp` | Resend OTP to email                   |

#### Wallet

| Method | Endpoint          | Description                        |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/wallet`         | Get all currency balances          |
| POST   | `/wallet/fund`    | Fund wallet (any currency)         |
| POST   | `/wallet/convert` | Convert between any two currencies |
| POST   | `/wallet/trade`   | Trade NGN ↔ other currencies       |

**Fund Wallet**

```json
POST /wallet/fund
{
  "currency": "NGN",
  "amount": 50000,
  "idempotencyKey": "optional-unique-key"
}
```

**Convert**

```json
POST /wallet/convert
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "amount": 1000
}
```

**Trade**

```json
POST /wallet/trade
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "amount": 5000
}
```

#### FX Rates

| Method | Endpoint             | Description                           |
| ------ | -------------------- | ------------------------------------- |
| GET    | `/fx/rates`          | Get all supported FX rates (NGN base) |
| GET    | `/fx/rates?base=USD` | Get rates with custom base currency   |

#### Transactions

| Method | Endpoint            | Description                   |
| ------ | ------------------- | ----------------------------- |
| GET    | `/transactions`     | Paginated transaction history |
| GET    | `/transactions/:id` | Get single transaction        |

**Transaction History with Pagination**

```
GET /transactions?page=1&limit=20
```

---

## Architecture Decisions

### 1. Multi-Currency Wallet Design

Instead of a single balance column on a wallet table, balances are stored in a **`wallet_balances` table** with a `(wallet_id, currency)` unique index. This allows:

- Easy addition of new currencies without schema changes
- Efficient per-currency balance queries
- Clear audit trail per currency

### 2. Atomic Operations & Race Condition Prevention

All balance modifications use **PostgreSQL row-level pessimistic locking** (`SELECT FOR UPDATE`). The pattern is:

1. Lock wallet row
2. Lock specific currency balance row
3. Validate (sufficient funds)
4. Update balance
5. Commit

This prevents double-spending in concurrent requests. The entire operation runs inside a `DataSource.transaction()`.

### 3. FX Rate Caching

Rates are cached in-memory (`@nestjs/cache-manager`) with a configurable TTL (default: 5 minutes). On cache miss, rates are fetched from exchangerate-api.com with up to 3 automatic retries and exponential backoff.

**For production:** Replace in-memory cache with Redis (`cache-manager-redis-store`) for shared cache across multiple app instances:

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    store: redisStore,
    host: process.env.REDIS_HOST,
    port: 6379,
    ttl: 300,
  }),
});
```

### 4. Idempotency

The `/wallet/fund` endpoint accepts an optional `idempotencyKey`. If a request with the same key is received twice, the second call returns the original transaction instead of creating a duplicate. Extend this pattern to all state-changing endpoints in production.

### 5. Role-Based Access Control

Users have a `role` field (`USER` | `ADMIN`). A `RolesGuard` is implemented using NestJS `Reflector`. Admin-only routes can be protected with:

```typescript
@Roles(Role.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### 6. Database

**PostgreSQL** was chosen over MySQL for:

- Better support for row-level locking semantics
- `DECIMAL` precision arithmetic
- Native UUID support
- `enum` type support

### 7. Module Structure

```
src/
├── auth/          # JWT auth, OTP, guards, strategies
├── users/         # User entity, OTP entity, users service
├── wallet/        # Wallet, WalletBalance entities, trade/convert logic
├── fx/            # FX rate fetching, caching, retry logic
├── transactions/  # Transaction entity, history queries
├── mail/          # Nodemailer email service
├── common/        # Shared enums, decorators, guards
└── config/        # Configuration factory
```

---

## Security Considerations

- **Passwords** are hashed with bcrypt (cost factor 10)
- **JWT** with configurable secret and expiry
- **Input validation** via `class-validator` + `ValidationPipe` (whitelist mode rejects unknown fields)
- **Email-only access** – only verified users can trade
- **Pessimistic locking** prevents race conditions and double-spend
- **No balance on registration** – users must explicitly fund their wallet
- **DECIMAL precision** – financial amounts stored as `DECIMAL(20,8)`, not `FLOAT`

---

## Scalability Notes

For millions of users:

1. **Redis** for distributed FX rate caching across instances
2. **Database connection pooling** via TypeORM's built-in pool (configure `extra.max`)
3. **Read replicas** – route `/wallet` (reads) and `/transactions` (reads) to a read replica
4. **Queue-based email** (Bull + Redis) for reliable, non-blocking OTP delivery
5. **Rate limiting** on auth endpoints to prevent brute force (e.g., `@nestjs/throttler`)
6. **Migrations** instead of `synchronize: true` for schema management in production
7. **Horizontal scaling** – stateless JWT auth allows multiple app instances behind a load balancer
