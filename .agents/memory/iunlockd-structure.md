---
name: iUnlockd project structure
description: Key decisions, file layout, and gotchas for the iUnlockd codebase
---

## Layout
- Frontend: `artifacts/sales-assistant/src/` (React Router v6)
- Backend: `artifacts/api-server/src/` (Express 5)
- DB schemas: `lib/db/src/schema/` (Drizzle ORM + PostgreSQL)
- Module files: `artifacts/api-server/src/modules/` (email, payments/manual, payments/auto/usdt)

## Key decisions
- No legitunlocks integration — all services managed in admin panel
- SMTP port 465 → `secure: true`, 587 → `secure: false` — auto-detected in modules/email/email.ts
- Crypto chains: opBNB (`WALLET_OPBNB`) and Plasma (`WALLET_PLASMA`) — USDT only
- Orders filtered by `serviceType` on services table — supports imei, server, tool
- JWT stored in localStorage as `iu_token`, 30d expiry
- Order History menu in mobile nav has 3 items: IMEI Orders, Server Orders, Tool Rent Orders

**Why separate module files:** user requested code reorganization with email auth, manual payment, and per-chain USDT handlers each in separate files.
