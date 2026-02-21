# Ecommerce MVP separado

Proyecto base de ecommerce con:

- `frontend/`: React + Vite + TypeScript
- `admin-frontend/`: Panel de administracion (separado del sitio)
- `backend/`: Express + TypeScript + Prisma + PostgreSQL
- Pagos: Mercado Pago (preferencia + webhook)

## 1) Requisitos

- Node.js 20+
- Docker Desktop

## 2) Levantar base de datos

```bash
docker compose up -d
```

## 3) Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend disponible en `http://localhost:4000`.

## 4) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend disponible en `http://localhost:5173`.

## 5) Admin frontend (separado)

```bash
cd admin-frontend
cp .env.example .env
npm install
npm run dev
```

Panel admin disponible en `http://localhost:5174`.

## 6) Variables importantes backend

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `FRONTEND_ORIGIN`
- `ADMIN_ORIGIN`

## 7) Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/orders`
- `POST /api/payments/webhook`

## Notas de negocio

- El primer usuario registrado queda como `ADMIN`.
- El checkout crea orden `PENDING` y genera preferencia de Mercado Pago.
- El webhook valida firma (`x-signature`) y actualiza pago/orden cuando Mercado Pago aprueba.
- El panel admin permite crear productos y cambiar estado de ordenes.
