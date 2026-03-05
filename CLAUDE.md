# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spanish-language e-commerce platform (Adamantio brand) built as a monorepo with three independent apps:

- **`backend/`** — Express + TypeScript REST API on port 4000
- **`frontend/`** — React customer storefront on port 5173
- **`admin-frontend/`** — React admin dashboard on port 5174

## Development Commands

### Start all services

```bash
# 1. Start PostgreSQL (required)
docker compose up -d

# 2. Each app in separate terminals
cd backend && npm run dev
cd frontend && npm run dev
cd admin-frontend && npm run dev
```

### Backend

```bash
cd backend
npm run dev              # tsx watch src/server.ts
npm run build            # prisma generate + tsc
npm run prisma:migrate   # run pending migrations (dev)
npm run prisma:studio    # open Prisma Studio GUI
npm run seed             # seed database
```

### Frontend / Admin Frontend

```bash
npm run dev              # vite dev server
npm run build            # tsc + vite build
npm run preview          # preview production build
```

## Architecture

### Backend (`backend/src/`)

- **Entry**: `server.ts` — Express app with CORS, Helmet, compression, rate limiting
- **Modules**: Feature-based under `modules/` (auth, products, orders, payments, media)
- **Middleware**: `auth.ts` (JWT guards), `validate.ts` (Zod), `error.ts` (standardized errors)
- **Lib**: `prisma.ts` (singleton client), `auth.ts` (JWT utils), `redis.ts` (optional caching)
- **Config**: `config/env.ts` validates all environment variables at startup

**Authentication**: JWT access tokens (15m) + refresh tokens (7d). First registered user becomes ADMIN automatically. Use `requireAuth()` and `requireRole(...roles)` middleware on routes.

**Validation**: All request bodies use Zod schemas via the `validate` middleware.

### Frontend (`frontend/src/`)

- **Routing**: React Router v6 in `app/router.tsx`, with lazy-loaded routes
- **State**: Zustand cart store (`features/cart/cart.store.ts`) persisted to `localStorage["cartItems"]`
- **API client**: `app/api.ts` — typed `api<T>(path, options)` wrapper with automatic token refresh on 401

### Admin Frontend (`admin-frontend/src/`)

- **Routing**: `app/router.tsx` with auth guard redirecting unauthenticated users to `/login`
- **State**: Zustand auth store (`features/auth/auth.store.ts`) persisted to `localStorage` with `admin_` prefix
- **API client**: `app/api.ts` — same pattern as frontend, uses `admin_accessToken`/`admin_refreshToken`
- **Rich text**: `ClassicEditor.tsx` component used in product forms for `productDetails` and `sizeInfo` fields

### Database

- **PostgreSQL 16** via Docker; **Prisma 6** as ORM
- Schema: `backend/prisma/schema.prisma`
- Key models: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Address`, `Category`, `RefreshToken`
- `Category` supports hierarchical trees via `parentId` self-relation
- `unaccent` PostgreSQL extension enabled for accent-insensitive product search

### Payment Flow

1. Customer submits checkout → Order created with status `PENDING`
2. Backend creates Mercado Pago preference and returns redirect URL
3. User pays on Mercado Pago; webhook hits `POST /api/payments/webhook`
4. Webhook validates MP signature, updates Order and Payment status

### Image Handling

- Products have `imageUrl` (primary), `imageUrls[]` (gallery), and `contentImages[]` (rich content)
- Cloudinary is used for uploads via the `media` module (optional — requires env vars)
- `MediaLibraryPickerModal.tsx` in admin provides a picker UI

## Environment Variables

### Backend (`.env`)

```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
BACKEND_PUBLIC_URL=http://localhost:4000
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=...
# Optional
REDIS_URL=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=adama/products
SKIP_PAYMENT=false
```

### Frontend (`.env`)

```
VITE_API_URL=http://localhost:4000/api
VITE_MP_PUBLIC_KEY=TEST-...
```

### Admin Frontend (`.env`)

```
VITE_API_URL=http://localhost:4000/api
```

## Key Conventions

- Backend uses ES modules (`NodeNext`); imports need explicit `.js` extensions even for `.ts` source files
- Admin uses Tailwind CSS; customer frontend uses hand-written CSS in `styles.css`
- All user-facing text is in Spanish
- Backend routes are all under `/api/` prefix
- Product slugs are used in URLs (`/producto/:productSlug`) alongside numeric IDs (`/products/:productId`)
