# PRD — Adamantio E-Commerce Platform

**Versión:** 1.0
**Fecha:** 2026-03-04
**Estado:** En desarrollo activo

---

## 1. Resumen ejecutivo

Adamantio es una plataforma de e-commerce en español orientada al mercado peruano. Permite a clientes comprar productos con pago mediante tarjeta de crédito/débito y Yape (vía Mercado Pago), y a administradores gestionar el catálogo, pedidos y medios desde un dashboard dedicado.

El sistema es un monorepo con tres aplicaciones independientes:

| App | Puerto | Descripción |
|-----|--------|-------------|
| `backend/` | 4000 | API REST — Express + TypeScript + Prisma |
| `frontend/` | 5173 | Tienda al cliente — React |
| `admin-frontend/` | 5174 | Panel admin — React + Tailwind |

---

## 2. Objetivos del producto

1. Ofrecer una experiencia de compra fluida sin necesidad de registro obligatorio (checkout como invitado).
2. Integrar pagos locales peruanos (Yape) junto a tarjetas vía Mercado Pago.
3. Proveer a los administradores herramientas completas para gestión de productos, categorías, pedidos e imágenes.
4. Mantener rendimiento con caché Redis y búsqueda sin tildes (PostgreSQL `unaccent`).

---

## 3. Usuarios y roles

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| **Cliente invitado** | Frontend | Navega, busca, agrega al carrito y hace checkout sin cuenta |
| **Cliente registrado** | Frontend | Igual que invitado + historial de pedidos (`GET /orders/my`) |
| **Admin** | Admin Frontend | Gestión completa del catálogo, pedidos y medios |

> El primer usuario registrado en el sistema obtiene el rol `ADMIN` automáticamente.

---

## 4. Módulos y funcionalidades

### 4.1 Catálogo de productos (Frontend — cliente)

- **Página principal / catálogo**
  - Grid de productos con paginación configurable (1–50 por página, default 10)
  - Búsqueda en tiempo real con debounce de 350 ms, mínimo 2 caracteres
  - Búsqueda accent-insensitive: "cafe" encuentra "café"
  - Filtro por categoría (incluyendo subcategorías)
  - Ordenamiento: más reciente, precio ↑↓, nombre A-Z / Z-A
  - Cache via header `x-cache` (Redis, TTL 60 s)

- **Página de detalle de producto (`/producto/:slug`)**
  - Galería de imágenes con: visor principal, miniaturas, swipe en móvil (umbral 40 px), lightbox con zoom
  - Nombre, precio (S/), stock disponible
  - Breadcrumb de categoría
  - Descripción en HTML enriquecido
  - Secciones colapsables:
    - **Detalles del producto** (rich text)
    - **Talla** (rich text con tablas de tallas)
    - **Envío y entrega**: Shalom Courier (gratis, retiro en sucursal) y Olva Courier (entrega a domicilio, precio por región)
    - **Grabado opcional**: máx. 20 caracteres (A-Z, 0-9, símbolos básicos)
  - Botón "Agregar al carrito" con feedback visual ("Agregado al carrito")
  - Estado "Sin stock" cuando `stock = 0`

### 4.2 Carrito de compras

- Accesible desde header (drawer en móvil, página completa en desktop `/cart`)
- Operaciones: ver ítems, ajustar cantidades (1–10), eliminar, ver subtotal
- Estado persistido en `localStorage["cartItems"]` via Zustand
- Acciones: "Ir al checkout", "Continuar comprando"

### 4.3 Checkout y pago

**Fase 1 — Datos del pedido**

| Campo | Validación |
|-------|-----------|
| Email | formato válido, requerido |
| Nombre | 3–20 caracteres |
| Apellido | 3–20 caracteres |
| Tipo de documento | DNI (8 dígitos) o Carnet de Extranjería (5–12 alfanumérico) |
| Teléfono | mín. 5 caracteres |
| Dirección | mín. 3 caracteres |
| Departamento → Provincia → Distrito | dropdowns en cascada, datos de `peru-ubigeo.json` |
| Código postal | auto-completado por distrito |
| Método de envío | Shalom (S/ 0) u Olva Courier (S/ 12–20 según departamento) |

**Fase 2 — Pago**

- **Tarjeta de crédito/débito** (Mercado Pago Payment Brick)
  - Soporta: tarjetas de crédito, débito, saldo de wallet MP
  - Locale `es-PE`, email pre-rellenado
  - Mensajes de error localizados: fondos insuficientes, tarjeta deshabilitada, CVV incorrecto, etc.

- **Yape**
  - Número de teléfono (9 dígitos, comienza con 9)
  - OTP de 6 dígitos con inputs individuales (auto-avance, pegar desde portapapeles, backspace)
  - Requisitos: "Compras por Internet" habilitado en la app Yape

**Fase 3 — Resultado**

| URL | Descripción |
|-----|-------------|
| `/checkout/success` | Pedido confirmado con resumen completo |
| `/checkout/failure` | Transacción rechazada con motivo |
| `/checkout/pending` | Pago pendiente de confirmación |

### 4.4 Confirmación de pedido

- Accesible en `/checkout/success?external_reference=order_X&payment_id=Y`
- Para clientes autenticados: verifica JWT
- Para invitados: verifica `?email=X` contra `guestEmail` del pedido
- Muestra: ítems, dirección de envío, datos de contacto, totales, estado de pago

### 4.5 Categorías (público)

- Árbol jerárquico con conteo de productos (incluye subcategorías)
- Navegación en header (desktop: menú desplegable, móvil: árbol colapsable en drawer)
- Páginas de categoría: `/categoria/:slug`
- Caché de 120 s en Redis

### 4.6 Páginas estáticas legales

- `/terminos-de-servicio`
- `/politica-de-reembolsos`
- `/politica-de-privacidad`
- `/libro-de-reclamaciones`

---

## 5. Panel de administración

### 5.1 Autenticación

- Login con email/contraseña en `/login`
- Tokens almacenados con prefijo `admin_` en `localStorage`
- Auto-logout en 401; refresh automático de access token
- Solo usuarios con rol `ADMIN` pueden acceder

### 5.2 Dashboard KPIs

Tarjetas siempre visibles:
- Total de productos
- Total de pedidos
- Pedidos pagados
- Ingresos totales (S/)

### 5.3 Tab — Productos

- **Tabla** con columnas: imagen, nombre, precio, categoría, stock, estado, botón editar
- Ordenamiento por: nombre, precio, stock, fecha
- Paginación: 12 productos por página
- Búsqueda y filtros por categoría (pills con conteo)
- Botón "Agregar producto" → `/products/new`

**Formulario de creación/edición:**

| Campo | Tipo | Notas |
|-------|------|-------|
| Nombre | texto | requerido |
| Descripción | rich text (CKEditor) | HTML, requerido |
| Precio | decimal | 2 decimales, requerido |
| Stock | entero | ≥ 0, requerido |
| Categoría | dropdown | opcional |
| Imagen principal | URL | opcional, auto-usa primera de galería |
| Galería de imágenes | array de URLs | reordenable, con preview lightbox |
| Imágenes de contenido | array de URLs | se muestran en parte inferior del PDP |
| Detalles del producto | rich text (CKEditor) | sección colapsable en PDP |
| Talla | rich text (CKEditor) | sección colapsable en PDP |
| Activo | toggle | default: activo |

**Edición — funcionalidades adicionales:**
- Indicador "Cambios sin guardar" (comparación con snapshot original)
- Botones "Guardar Cambios" y "Guardar y Volver"
- Toggle de estado (activar/desactivar) — `PATCH /products/:id/status`
- Eliminar producto con confirmación
- Toast notifications en guardado/error

### 5.4 Tab — Categorías

- Formulario para crear categoría (nombre + categoría padre opcional)
- Cards editables inline: nombre, padre, Save/Cancel
- Eliminar con diálogo de confirmación
- Validaciones: nombre mín. 2 caracteres, sin duplicados (case-insensitive), sin relaciones circulares

### 5.5 Tab — Pedidos

- Lista de pedidos expandibles
- Vista expandida incluye:
  - Selector de estado del pedido (PENDING → PAID → CANCELLED → SHIPPED)
  - Datos del cliente (nombre, email, teléfono, documento)
  - Dirección de envío
  - Ítems con nombre, cantidad y subtotal
  - Totales: subtotal, envío, comisión MP, total
  - Estado del pago con badge de color
- Búsqueda: ID de pedido, email, nombre de cliente
- Filtro por estado: TODOS / PENDING / PAID / CANCELLED / SHIPPED
- Paginación: 10 pedidos por página

### 5.6 Tab — Medios

- Integración con Cloudinary (requiere credenciales en `.env`)
- Upload de imágenes con solicitud firmada desde backend (`GET /media/signature`)
- Explorador de biblioteca de medios
- Modal reutilizable `MediaLibraryPickerModal` en formularios de producto

---

## 6. API REST — Endpoints principales

### Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/auth/register` | Público | Registrar usuario (1er usuario → ADMIN) |
| POST | `/auth/login` | Público | Login, devuelve tokens |
| POST | `/auth/refresh` | Público | Renovar access token |
| GET | `/auth/me` | Protegido | Datos del usuario autenticado |

Rate limits: register 8/60 s, login 12/60 s, refresh 20/60 s.

### Productos (`/api/products`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/products` | Público | Listar con filtros, búsqueda, paginación |
| GET | `/products/:id` | Público | Detalle de producto |
| POST | `/products` | ADMIN | Crear producto |
| PUT | `/products/:id` | ADMIN | Actualizar producto |
| PATCH | `/products/:id/status` | ADMIN | Activar/desactivar |
| DELETE | `/products/:id` | ADMIN | Eliminar producto |
| GET | `/products/categories/public` | Público | Árbol de categorías con conteo |
| GET | `/products/categories` | ADMIN | Todas las categorías |
| POST | `/products/categories` | ADMIN | Crear categoría |
| PATCH | `/products/categories/:id` | ADMIN | Editar categoría |
| DELETE | `/products/categories/:id` | ADMIN | Eliminar categoría |

### Pedidos (`/api/orders`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/orders` | Público | Crear pedido + preferencia MP |
| GET | `/orders/my` | Protegido | Pedidos del usuario autenticado |
| GET | `/orders/:id/confirmation` | Público* | Confirmación de pedido |
| GET | `/orders` | ADMIN | Todos los pedidos |
| PATCH | `/orders/:id/status` | ADMIN | Cambiar estado del pedido |

*verificación por token o email de invitado.

### Pagos (`/api/payments`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/payments/process` | Público | Procesar pago (tarjeta o Yape) |
| POST | `/payments/webhook` | MP (firmado) | IPN de Mercado Pago |

### Medios (`/api/media`)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/media/signature` | ADMIN | Obtener firma para upload a Cloudinary |

---

## 7. Flujo de pago completo

```
Cliente llena checkout
        ↓
POST /orders
  ├─ Valida stock
  ├─ Decrementa stock
  ├─ Crea Address, Order (PENDING), OrderItems, Payment (PENDING)
  └─ Crea preferencia en Mercado Pago
        ↓
Frontend muestra formulario de pago (tarjeta / Yape)
        ↓
POST /payments/process
  ├─ Llama Mercado Pago API
  ├─ Actualiza Payment con mpPaymentId, status, rawPayload
  └─ Si approved → Order.status = PAID
        ↓
Redirección a /checkout/success|failure|pending
        ↓
Webhook MP (async) → POST /payments/webhook
  ├─ Valida firma HMAC-SHA256
  ├─ Deduplicación Redis (ventana 6 h)
  └─ Actualiza Payment y Order con estado final
```

**Mapeo de estados MP → sistema:**

| Mercado Pago | Payment | Order |
|-------------|---------|-------|
| approved | APPROVED | PAID |
| rejected | REJECTED | PENDING |
| cancelled | CANCELLED | PENDING |
| pending | PENDING | PENDING |

---

## 8. Modelo de datos (resumen)

| Entidad | Campos clave |
|---------|-------------|
| `User` | id, email, passwordHash, fullName, role (CUSTOMER\|ADMIN) |
| `RefreshToken` | tokenHash, userId, expiresAt |
| `Product` | id, name, description, price, stock, imageUrl, imageUrls[], contentImages[], productDetails, sizeInfo, category, isActive |
| `Category` | id, name, parentId (self-relation) |
| `Address` | fullName, phone, documentType, documentNumber, street, district, city, state, postalCode, country |
| `Order` | userId?, guestEmail?, addressId, total, shippingCost, mpCommission, status |
| `OrderItem` | orderId, productId?, productName (snapshot), productPrice (snapshot), quantity |
| `Payment` | orderId, externalReference, mpPreferenceId?, mpPaymentId?, amount, status, rawPayload? |

---

## 9. Reglas de negocio

1. **Primer usuario = Admin**: La primera cuenta registrada obtiene rol `ADMIN` automáticamente.
2. **Checkout como invitado**: No se requiere registro. Se usa `guestEmail` para confirmaciones.
3. **Snapshot de precio**: `OrderItem` guarda el nombre y precio del producto al momento de la compra.
4. **Control de stock**: El stock se decrementa al crear el pedido (no al confirmar el pago).
5. **Búsqueda sin tildes**: "cafe" encuentra "Café" mediante la extensión `unaccent` de PostgreSQL.
6. **Jerarquía de categorías**: Las categorías padre acumulan el conteo de productos de todas las subcategorías.
7. **Grabado opcional**: Máximo 20 caracteres, sólo A-Z, 0-9 y símbolos básicos.
8. **Envío por región**: Olva Courier tiene precio variable según departamento del Perú (S/ 12–20).
9. **Idempotencia de webhooks**: Redis deduplica eventos MP con ventana de 6 horas.
10. **Caché invalidada por cambios admin**: Cualquier mutación de producto/categoría limpia el caché Redis.
11. **Productos inactivos**: Solo visibles para ADMIN; retornan 401 al público.
12. **SKIP_PAYMENT**: Variable de entorno para aprobar pagos automáticamente en desarrollo.

---

## 10. Stack tecnológico

### Backend
- **Runtime**: Node.js + TypeScript (ESM, NodeNext)
- **Framework**: Express.js
- **ORM**: Prisma 6
- **Base de datos**: PostgreSQL 16 (Docker), extensión `unaccent`
- **Caché / Rate limiting**: Redis (opcional)
- **Validación**: Zod
- **Auth**: JWT (HS256) — access 15 min, refresh 7 días
- **Hashing**: bcryptjs
- **Seguridad**: Helmet, CORS, rate limiting
- **Pago**: Mercado Pago SDK

### Frontend (cliente)
- **Framework**: React 18 + TypeScript
- **Router**: React Router v6 (lazy loading)
- **Estado**: Zustand (carrito)
- **Build**: Vite
- **Estilos**: CSS manual (`styles.css`)
- **Pago UI**: @mercadopago/sdk-react (Payment Brick)

### Admin Frontend
- **Framework**: React 18 + TypeScript
- **Estado**: Zustand (auth)
- **Estilos**: Tailwind CSS
- **Rich text**: CKEditor ClassicEditor
- **Media**: Cloudinary (opcional)

---

## 11. Variables de entorno requeridas

### Backend

```env
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
BACKEND_PUBLIC_URL=http://localhost:4000
JWT_ACCESS_SECRET=<secreto>
JWT_REFRESH_SECRET=<secreto>
MERCADOPAGO_ACCESS_TOKEN=TEST-<token>
MERCADOPAGO_WEBHOOK_SECRET=<secreto>
# Opcionales
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=adama/products
SKIP_PAYMENT=false
LOG_WEBHOOK_EVENTS=false
```

### Frontend

```env
VITE_API_URL=http://localhost:4000/api
VITE_MP_PUBLIC_KEY=TEST-<clave>
```

### Admin Frontend

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 12. Matriz de funcionalidades

| Funcionalidad | Frontend | Admin | Backend | BD |
|--------------|:--------:|:-----:|:-------:|:--:|
| Catálogo + búsqueda | ✓ | ✓ | ✓ | Product |
| Carrito | ✓ | — | — | localStorage |
| Checkout | ✓ | — | ✓ | Order, Address |
| Pago (tarjeta + Yape) | ✓ | — | ✓ | Payment |
| Categorías | ✓ | ✓ | ✓ | Category |
| Gestión de pedidos | ✓ confirmación | ✓ full | ✓ | Order, OrderItem |
| Gestión de medios | — | ✓ | ✓ firma | Cloudinary |
| Autenticación | ✓ | ✓ | ✓ | User, RefreshToken |
| Caché Redis | — | — | ✓ | — |
| Webhooks MP | — | — | ✓ | Payment, Order |
