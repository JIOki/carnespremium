# 📚 Documentación API - Carnes Premium

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Endpoints por Módulo](#endpoints-por-módulo)
4. [Modelos de Datos](#modelos-de-datos)
5. [Códigos de Error](#códigos-de-error)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🚀 Introducción

API RESTful para el sistema de e-commerce Carnes Premium. Todas las respuestas están en formato JSON y siguen el estándar:

```json
{
  "success": true|false,
  "data": {},
  "message": "Mensaje descriptivo",
  "error": "Descripción del error (solo en caso de fallo)"
}
```

**Base URL:** `http://localhost:3002/api`

**Versión:** 1.0.0

---

## 🔐 Autenticación

### Registro de Usuario

**POST** `/auth/register`

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!",
  "phone": "1234567890",
  "role": "CUSTOMER"
}
```

**Roles disponibles:** `CUSTOMER`, `ADMIN`, `DRIVER`

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "cmi6t0y4r000110wv",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "CUSTOMER",
      "createdAt": "2025-11-20T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Inicio de Sesión

**POST** `/auth/login`

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmi6t0y4r000110wv",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "CUSTOMER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Uso del Token

Incluir en el header de todas las peticiones autenticadas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📦 Endpoints por Módulo

### 1️⃣ Productos

#### Listar Productos

**GET** `/products`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_123",
        "name": "Bife de Chorizo Premium",
        "shortDesc": "Corte premium de 500g",
        "imageUrl": "https://...",
        "isFeatured": true,
        "averageRating": 4.8,
        "totalReviews": 42,
        "category": {
          "id": "cat_1",
          "name": "Carnes Rojas"
        },
        "variants": [
          {
            "id": "var_1",
            "name": "500g",
            "price": 45.99,
            "stock": 50,
            "isDefault": true
          }
        ]
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Buscar Productos

**GET** `/products/search`

**Query Parameters:**
- `q` (string): Término de búsqueda
- `category` (string): ID de categoría
- `minPrice` (number): Precio mínimo
- `maxPrice` (number): Precio máximo
- `page` (number)
- `limit` (number)

**Ejemplo:** `/products/search?q=bife&category=cat_1&minPrice=20&maxPrice=100`

#### Obtener Producto por ID

**GET** `/products/:id`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Bife de Chorizo Premium",
    "description": "Descripción completa...",
    "shortDesc": "Corte premium de 500g",
    "sku": "BEEF-BC-500",
    "imageUrl": "https://...",
    "gallery": ["url1", "url2"],
    "weight": 0.5,
    "unit": "kg",
    "origin": "Argentina",
    "brand": "Premium Meats",
    "averageRating": 4.8,
    "totalReviews": 42,
    "category": {...},
    "variants": [...],
    "reviews": [...]
  }
}
```

---

### 2️⃣ Categorías

#### Listar Categorías

**GET** `/categories`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1",
      "name": "Carnes Rojas",
      "slug": "carnes-rojas",
      "description": "Cortes premium de res",
      "imageUrl": "https://...",
      "productCount": 45
    }
  ]
}
```

---

### 3️⃣ Carrito de Compras 🔒

> **Requiere autenticación**

#### Ver Carrito

**GET** `/cart`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart_item_1",
        "productId": "prod_123",
        "variantId": "var_1",
        "quantity": 2,
        "price": 45.99,
        "total": 91.98,
        "product": {
          "name": "Bife de Chorizo",
          "imageUrl": "..."
        }
      }
    ],
    "summary": {
      "itemCount": 2,
      "subtotal": 91.98,
      "estimatedTax": 14.72,
      "estimatedShipping": 0,
      "estimatedTotal": 106.70
    }
  }
}
```

#### Agregar al Carrito

**POST** `/cart` o **POST** `/cart/add`

**Body:**
```json
{
  "productId": "prod_123",
  "variantId": "var_1",
  "quantity": 2
}
```

#### Actualizar Cantidad

**PUT** `/cart/items/:itemId`

**Body:**
```json
{
  "quantity": 3
}
```

#### Eliminar Item

**DELETE** `/cart/items/:itemId`

#### Vaciar Carrito

**DELETE** `/cart/clear`

---

### 4️⃣ Lista de Deseos (Wishlist) 🔒

#### Ver Wishlist

**GET** `/wishlist`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "wish_1",
        "productId": "prod_123",
        "product": {
          "name": "Bife de Chorizo",
          "imageUrl": "...",
          "defaultPrice": 45.99
        },
        "addedAt": "2025-11-20T10:00:00.000Z"
      }
    ]
  }
}
```

#### Agregar a Wishlist

**POST** `/wishlist`

**Body:**
```json
{
  "productId": "prod_123"
}
```

#### Eliminar de Wishlist

**DELETE** `/wishlist/:itemId`

---

### 5️⃣ Órdenes 🔒

#### Listar Órdenes

**GET** `/orders`

**Query Parameters:**
- `status` (string): Filtrar por estado
- `page` (number)
- `limit` (number)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order_1",
        "orderNumber": "ORD-2025-001",
        "status": "DELIVERED",
        "paymentStatus": "CAPTURED",
        "total": 156.50,
        "createdAt": "2025-11-15T10:00:00.000Z",
        "items": [...]
      }
    ],
    "pagination": {...}
  }
}
```

---

### 6️⃣ Reseñas y Reviews

#### Listar Reviews de un Producto

**GET** `/reviews?productId=prod_123`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review_1",
      "userId": "user_1",
      "productId": "prod_123",
      "rating": 5,
      "title": "Excelente calidad",
      "comment": "La mejor carne que he probado",
      "isVerifiedPurchase": true,
      "createdAt": "2025-11-10T10:00:00.000Z",
      "user": {
        "name": "Juan Pérez"
      }
    }
  ]
}
```

---

### 7️⃣ Cupones y Descuentos

#### Validar Cupón

**GET** `/coupons/validate/:code` o **GET** `/coupon/validate/:code`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "code": "VERANO2025",
    "type": "PERCENTAGE",
    "value": 15,
    "description": "15% de descuento",
    "minPurchase": 100,
    "maxDiscount": 50,
    "validUntil": "2025-12-31T23:59:59.000Z"
  }
}
```

---

### 8️⃣ Sistema de Lealtad 🔒

#### Obtener Perfil de Lealtad

**GET** `/loyalty/profile`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "currentPoints": 1250,
    "totalEarned": 5000,
    "totalRedeemed": 3750,
    "tier": "GOLD",
    "tierProgress": 62.5,
    "nextTierPoints": 2000,
    "totalBadges": 8,
    "currentStreak": 3
  }
}
```

#### Historial de Transacciones

**GET** `/loyalty/transactions`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tx_1",
      "type": "EARN",
      "action": "PURCHASE",
      "points": 50,
      "description": "Compra #ORD-2025-001",
      "createdAt": "2025-11-20T10:00:00.000Z"
    }
  ]
}
```

---

### 9️⃣ Gamificación 🔒

#### Listar Badges

**GET** `/gamification/badges`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "badge_1",
      "code": "FIRST_PURCHASE",
      "name": "Primera Compra",
      "description": "Realizaste tu primera compra",
      "icon": "🎉",
      "rarity": "COMMON",
      "pointsReward": 100
    }
  ]
}
```

#### Listar Challenges

**GET** `/gamification/challenges`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "challenge_1",
      "code": "WEEKLY_SHOPPER",
      "name": "Comprador Semanal",
      "description": "Realiza 3 compras esta semana",
      "type": "WEEKLY",
      "targetValue": 3,
      "pointsReward": 500,
      "startDate": "2025-11-18T00:00:00.000Z",
      "endDate": "2025-11-24T23:59:59.000Z"
    }
  ]
}
```

#### Listar Rewards

**GET** `/gamification/rewards`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "reward_1",
      "code": "DISCOUNT_10",
      "name": "10% de Descuento",
      "description": "Cupón de 10% en tu próxima compra",
      "type": "DISCOUNT",
      "pointsCost": 500,
      "value": 10
    }
  ]
}
```

---

### 🔟 Membresías

#### Listar Planes de Membresía

**GET** `/memberships/plans`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "plan_1",
      "code": "PREMIUM",
      "name": "Membresía Premium",
      "description": "Acceso a beneficios exclusivos",
      "price": 99.99,
      "originalPrice": 149.99,
      "billingPeriod": "MONTHLY",
      "features": [
        "Envío gratis ilimitado",
        "10% descuento en todos los productos",
        "Acceso prioritario a ofertas"
      ],
      "tier": "PREMIUM",
      "isPopular": true
    }
  ]
}
```

#### Obtener Mi Membresía 🔒

**GET** `/memberships/my-membership`

#### Suscribirse a un Plan 🔒

**POST** `/memberships/subscribe`

**Body:**
```json
{
  "planId": "plan_1",
  "paymentMethodId": "pm_123"
}
```

---

### 1️⃣1️⃣ Analytics (Admin) 🔒

#### Dashboard Stats

**GET** `/analytics/dashboard`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalProducts": 89,
      "totalOrders": 456,
      "totalRevenue": 125430.50,
      "monthlyOrders": 123,
      "monthlyRevenue": 34500.75
    },
    "inventory": {
      "lowStock": 12,
      "outOfStock": 3
    },
    "ordersByStatus": {
      "PENDING": 15,
      "PROCESSING": 8,
      "DELIVERED": 420,
      "CANCELLED": 13
    },
    "recentOrders": [...],
    "topProducts": [...]
  }
}
```

#### Estadísticas de Ventas

**GET** `/analytics/sales?period=week`

**Parámetros:**
- `period`: `week`, `month`, `year`

#### Estadísticas de Productos

**GET** `/analytics/products`

#### Estadísticas de Usuarios

**GET** `/analytics/users`

#### Estadísticas de Lealtad

**GET** `/analytics/loyalty`

---

### 1️⃣2️⃣ Notificaciones 🔒

#### Listar Notificaciones

**GET** `/notifications`

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_1",
      "type": "ORDER_UPDATE",
      "title": "Pedido en camino",
      "message": "Tu pedido #ORD-2025-001 está en camino",
      "isRead": false,
      "createdAt": "2025-11-20T10:00:00.000Z"
    }
  ]
}
```

#### Obtener Preferencias

**GET** `/notifications/preferences`

#### Actualizar Preferencias

**PUT** `/notifications/preferences`

**Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "orderUpdates": true,
  "promotions": true
}
```

---

## 📊 Modelos de Datos

### User
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  role: "CUSTOMER" | "ADMIN" | "DRIVER"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Product
```typescript
{
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string
  sku: string
  categoryId: string
  imageUrl: string
  gallery: string[]
  isActive: boolean
  isFeatured: boolean
  weight: number
  unit: string
  origin: string
  brand: string
  averageRating: number
  totalReviews: number
  totalSales: number
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  id: string
  orderNumber: string
  userId: string
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
  paymentStatus: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "CANCELLED" | "REFUNDED"
  paymentMethod: string
  subtotal: number
  tax: number
  deliveryFee: number
  discount: number
  total: number
  currency: string
  billingAddress: object
  shippingAddress: object
  createdAt: Date
  updatedAt: Date
}
```

---

## ⚠️ Códigos de Error

### Códigos HTTP

- **200** - OK
- **201** - Created
- **400** - Bad Request (datos inválidos)
- **401** - Unauthorized (sin autenticación)
- **403** - Forbidden (sin permisos)
- **404** - Not Found
- **409** - Conflict (ej: email duplicado)
- **422** - Unprocessable Entity (validación fallida)
- **429** - Too Many Requests (rate limit)
- **500** - Internal Server Error

### Respuesta de Error

```json
{
  "success": false,
  "error": "Descripción del error",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Códigos Personalizados

- `VALIDATION_ERROR` - Error de validación de datos
- `AUTHENTICATION_REQUIRED` - Token no provisto
- `INVALID_TOKEN` - Token inválido o expirado
- `FORBIDDEN` - Sin permisos para la operación
- `RESOURCE_NOT_FOUND` - Recurso no encontrado
- `CONFLICT` - Conflicto (ej: email ya existe)
- `OUT_OF_STOCK` - Producto sin stock
- `INTERNAL_ERROR` - Error interno del servidor

---

## 💡 Ejemplos de Uso

### Flujo Completo de Compra

```bash
# 1. Registro
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123!",
    "phone": "1234567890"
  }'

# 2. Login (guardar token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Buscar productos
curl http://localhost:3002/api/products/search?q=bife

# 4. Agregar al carrito
curl -X POST http://localhost:3002/api/cart \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_123",
    "variantId": "var_1",
    "quantity": 2
  }'

# 5. Ver carrito
curl http://localhost:3002/api/cart \
  -H "Authorization: Bearer $TOKEN"

# 6. Crear orden
curl -X POST http://localhost:3002/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {...},
    "paymentMethod": "card"
  }'
```

---

## 🔧 Configuración

### Variables de Entorno

```env
# Server
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# API
API_KEY="your-api-key"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda:
- Email: soporte@carnespremium.com
- Documentación: https://docs.carnespremium.com
- Issues: https://github.com/carnespremium/api/issues

---

**Última actualización:** 2025-11-20
**Versión de API:** 1.0.0
