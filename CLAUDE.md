# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (auto-recompiles and restarts on change)
npm run dev

# Build TypeScript
npm run build

# Run compiled output
npm start

# Database migrations
npm run migrate:generate --fileName=<migration-name>  # generate migration file
npm run migrate:up                                     # run pending migrations
npm run migrate:undo                                   # revert last migration
```

> Migrations use the compiled JS from `dist/`, so run `npm run build` before running migrate commands.

## Environment Variables

Required in `.env`:
```
PORT=
NODE_ENV=                    # development | local | production
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
DB_HOST=
DB_PORT=
SECRET_KEY=                  # JWT signing secret
SECRET_KEY_EXPIRES_IN=       # e.g. "7d"
STRPE_SECRET_KEY=            # Stripe secret key (note the typo in the env var name)
STRIPE_WEBHOOK_SECRET_KEY=   # Stripe webhook signing secret
BASE_URL=                    # Used for Stripe checkout success/cancel URLs
```

## Architecture

**Express + TypeScript + Sequelize (PostgreSQL) + Stripe**

### Request Flow

```
HTTP Request
  → express middleware (auth.middleware.ts for /user routes)
  → module routes (auth.routes.ts / user.routes.ts)
  → Joi validation (auth.validator.ts / user.validator.ts)
  → controller method
  → DB services / StripeHelperService
  → CommonHelperService.sendResponse()
```

The `RouteHandler` class in `src/routes/index.ts` mounts:
- `/auth` — public routes (signup, login)
- `/user` — protected routes (JWT required via `AuthMiddleware.isUserAuthenticated`)

The Stripe webhook (`POST /webhook`) is mounted before `express.json()` to receive raw body, which is required for webhook signature verification.

### Key Services

- **`StripeHelperService`** (`src/helpers/stripeHelper.service.ts`) — singleton wrapping all Stripe SDK calls: product listing, checkout session creation, subscription retrieval/update, and webhook event construction.
- **`CommonHelperService`** (`src/helpers/commonHelper.service.ts`) — wraps all HTTP responses in a consistent `{ success, code, data, message }` envelope.
- **`AuthMiddleware`** — JWT verification; attaches the full `User` model (with `accountUserInfo` eager-loaded) to `req.user`.

### Data Model

```
User
 └─ AccountUser (join table, permissions: owner | admin | user)
     └─ Account (stores stripeCustomerId, stripeSubscriptionId, plan)
          └─ UserPlans (tracks which priceId is assigned to which user within an account)
```

- `Account` is created/updated via Stripe webhooks (`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`).
- `UserPlans` records per-seat product assignments; `assignProduct` enforces quantity limits against the live Stripe subscription item quantity.

### Database Sync Behavior

- `local` environment: `alter: true` — Sequelize auto-alters tables on startup. Safe for local dev.
- `development` / `production`: `alter: false` — use migrations only. Build first (`npm run build`), then run `npm run migrate:up`.