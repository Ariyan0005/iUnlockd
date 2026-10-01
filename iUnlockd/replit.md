# iUnlockd

Professional phone unlock service platform — IMEI unlocks, server services, tool rent/remote, crypto deposits.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: see `.env.example` — `DATABASE_URL`, `SESSION_SECRET`, SMTP vars, WALLET vars

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + React Router v6 + Tailwind + shadcn/ui (`artifacts/sales-assistant/`)
- API: Express 5 (`artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM (`lib/db/`)
- Auth: JWT (30d expiry) + bcryptjs + email OTP (6-digit, 10 min TTL)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/` — all API endpoints (auth, orders, services, crypto, admin, user)
- `artifacts/api-server/src/modules/email/email.ts` — SMTP email sending (OTP/verification/reset)
- `artifacts/api-server/src/modules/payments/manual/` — manual deposit handler
- `artifacts/api-server/src/modules/payments/auto/usdt/` — USDT auto-deposit (opBNB + Plasma)
- `artifacts/api-server/src/middleware/authenticate.ts` — JWT auth middleware
- `artifacts/sales-assistant/src/components/Layout.tsx` — main nav (desktop + mobile)
- `artifacts/sales-assistant/src/pages/Orders.tsx` — orders list (filters by ?type=imei|server|tool)
- `lib/db/src/schema/` — all Drizzle ORM schemas (users, orders, services, cryptoDeposits, emailTokens, settings)
- `.env.example` — all environment variables with explanations

## Architecture decisions

- No external products API (legitunlocks removed) — all services managed in-house via admin panel
- SMTP port 465 → `secure: true`, port 587 → `secure: false` (auto-detected in email module)
- Crypto deposits: opBNB and Plasma chains (USDT only) — manual approval by admin
- Orders filtered by `serviceType` column on services table — supports imei, server, tool
- JWT tokens stored in `localStorage` under key `iu_token`

## Product

- User registration + email OTP verification (6-digit code, 10 min, resend with 60s timer)
- Login, forgot/reset password
- Browse IMEI unlock, server, and tool rent services
- Place orders (balance deducted automatically)
- USDT crypto deposits (opBNB / Plasma) + manual payment option
- Admin panel: manage users, services, orders, deposits; adjust balances

## User preferences

- git push from Replit → pull on VPS (iunlockd.com)
- No dummy/placeholder data in production code
- Separate module files for email, manual payment, and per-chain crypto handlers
- No legitunlocks integration

## Gotchas

- SMTP: set `SMTP_PORT=465` for SSL (cPanel/DirectAdmin style) — `secure` is auto-set based on port
- `SESSION_SECRET` must be at least 32 random chars in production
- DB migrations: run `pnpm --filter @workspace/db run push` after any schema change — do NOT do this on production DB without review
- The orders route filters by `serviceType` using a JS `.filter()` after the DB query (not a SQL WHERE) — fine for typical user order volumes
- `WALLET_OPBNB` and `WALLET_PLASMA` env vars control which wallet addresses are shown for USDT deposits

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
