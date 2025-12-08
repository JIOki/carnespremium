# 📦 Sistema de Suscripciones y Membresías Premium

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelos de Base de Datos](#modelos-de-base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Servicios Backend](#servicios-backend)
6. [Componentes Frontend](#componentes-frontend)
7. [Flujos de Trabajo](#flujos-de-trabajo)
8. [Instalación](#instalación)
9. [Uso](#uso)

---

## 📖 Descripción General

El **Sistema de Suscripciones y Membresías Premium** permite a Carnes Premium ofrecer dos tipos de servicios recurrentes:

### 💎 Membresías Premium
- **Niveles**: Bronze, Silver, Gold, Platinum
- **Beneficios**: Descuentos progresivos, envío gratis, acceso anticipado, productos exclusivos
- **Facturación**: Mensual, Trimestral, Anual
- **Gestión**: Upgrade/downgrade, pausa, cancelación

### 📦 Suscripciones de Cajas Mensuales
- **Cajas personalizadas** de productos premium
- **Frecuencia**: Semanal, Quincenal, Mensual
- **Características**: Personalización, saltar entregas, gestión flexible
- **Valor agregado**: Productos seleccionados a precio especial

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 14)                   │
├─────────────────────────────────────────────────────────────┤
│  • /subscriptions (Catálogo público)                        │
│  • /account/membership (Gestión de membresía del usuario)   │
│  • /account/subscriptions (Gestión de suscripciones)        │
│  • /admin/subscriptions (Panel de administración)           │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                    │
├─────────────────────────────────────────────────────────────┤
│  • /api/subscriptions/* (CRUD de suscripciones)             │
│  • /api/subscriptions/membership/* (Gestión de membresías)  │
│  • /api/subscriptions/admin/* (Funciones administrativas)   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Business Logic)             │
├─────────────────────────────────────────────────────────────┤
│  • membershipService.js (Lógica de membresías)              │
│  • subscriptionService.js (Lógica de suscripciones)         │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER (Prisma ORM)                    │
├─────────────────────────────────────────────────────────────┤
│  • MembershipPlan, UserMembership, MembershipBenefit        │
│  • SubscriptionPlan, Subscription, SubscriptionDelivery     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Modelos de Base de Datos

### 1. MembershipPlan
```prisma
model MembershipPlan {
  id              String   @id
  name            String   @unique // BRONZE, SILVER, GOLD, PLATINUM
  displayName     String
  description     String?
  monthlyPrice    Float
  quarterlyPrice  Float?
  annualPrice     Float?
  discountPercent Float    // Descuento en compras
  freeShipping    Boolean
  pointsMultiplier Float   // Multiplicador de puntos
  earlyAccess     Boolean
  exclusiveProducts Boolean
  prioritySupport Boolean
  features        String?  // JSON array
  // ... relaciones y metadatos
}
```

### 2. UserMembership
```prisma
model UserMembership {
  id              String   @id
  userId          String   @unique
  planId          String
  status          String   // ACTIVE, CANCELLED, EXPIRED, PAUSED
  startDate       DateTime
  endDate         DateTime
  billingCycle    String   // MONTHLY, QUARTERLY, ANNUAL
  autoRenew       Boolean
  ordersThisMonth Int
  totalSavings    Float
  // ... relaciones
}
```

### 3. SubscriptionPlan
```prisma
model SubscriptionPlan {
  id              String   @id
  name            String
  boxType         String   // STANDARD, PREMIUM, DELUXE
  price           Float
  estimatedValue  Float
  includedProducts String? // JSON array
  deliveryFrequency String // WEEKLY, BIWEEKLY, MONTHLY
  allowCustomization Boolean
  // ... relaciones y metadatos
}
```

### 4. Subscription
```prisma
model Subscription {
  id              String   @id
  userId          String
  planId          String
  status          String   // ACTIVE, PAUSED, CANCELLED
  frequency       String
  nextDeliveryDate DateTime?
  totalDeliveries Int
  completedDeliveries Int
  // ... relaciones
}
```

### 5. SubscriptionDelivery
```prisma
model SubscriptionDelivery {
  id              String   @id
  subscriptionId  String
  scheduledDate   DateTime
  status          String   // SCHEDULED, PREPARING, SHIPPED, DELIVERED, SKIPPED
  products        String   // JSON array
  orderId         String?  // Vinculado a Order
  // ... metadatos
}
```

---

## 🔌 API Endpoints

### Membresías (Públicas y Autenticadas)

```
GET    /api/subscriptions/membership-plans
       → Obtener todos los planes de membresía

GET    /api/subscriptions/membership-plans/:id
       → Obtener detalles de un plan

GET    /api/subscriptions/my-membership
       → Obtener membresía del usuario [Auth]

POST   /api/subscriptions/membership/subscribe
       Body: { planId, billingCycle }
       → Suscribirse a un plan [Auth]

PUT    /api/subscriptions/membership/upgrade
       Body: { planId }
       → Cambiar a otro plan [Auth]

POST   /api/subscriptions/membership/cancel
       Body: { reason? }
       → Cancelar membresía [Auth]

POST   /api/subscriptions/membership/pause
       → Pausar membresía [Auth]

POST   /api/subscriptions/membership/resume
       → Reanudar membresía [Auth]

POST   /api/subscriptions/membership/apply-discount
       Body: { orderAmount }
       → Aplicar descuento de membresía [Auth]
```

### Suscripciones (Públicas y Autenticadas)

```
GET    /api/subscriptions/subscription-plans
       → Obtener todos los planes de suscripción

GET    /api/subscriptions/subscription-plans/:id
       → Obtener detalles de un plan

GET    /api/subscriptions/my-subscriptions
       → Obtener suscripciones del usuario [Auth]

POST   /api/subscriptions/subscribe
       Body: { planId, frequency?, preferences?, ... }
       → Crear nueva suscripción [Auth]

PUT    /api/subscriptions/:id
       Body: { frequency?, preferences?, ... }
       → Actualizar suscripción [Auth]

POST   /api/subscriptions/:id/cancel
       Body: { reason? }
       → Cancelar suscripción [Auth]

POST   /api/subscriptions/:id/pause
       Body: { pauseUntil? }
       → Pausar suscripción [Auth]

POST   /api/subscriptions/:id/resume
       → Reanudar suscripción [Auth]

GET    /api/subscriptions/:id/deliveries
       Query: { status?, limit? }
       → Obtener entregas de suscripción [Auth]

POST   /api/subscriptions/deliveries/:id/skip
       Body: { reason? }
       → Saltar una entrega [Auth]
```

### Admin Endpoints

```
POST   /api/subscriptions/admin/membership-plans
       → Crear plan de membresía [Admin]

PUT    /api/subscriptions/admin/membership-plans/:id
       → Actualizar plan de membresía [Admin]

DELETE /api/subscriptions/admin/membership-plans/:id
       → Eliminar plan de membresía [Admin]

POST   /api/subscriptions/admin/subscription-plans
       → Crear plan de suscripción [Admin]

PUT    /api/subscriptions/admin/subscription-plans/:id
       → Actualizar plan de suscripción [Admin]

DELETE /api/subscriptions/admin/subscription-plans/:id
       → Eliminar plan de suscripción [Admin]

GET    /api/subscriptions/admin/memberships
       Query: { status?, planId?, page?, limit? }
       → Listar todas las membresías [Admin]

GET    /api/subscriptions/admin/subscriptions
       Query: { status?, planId?, page?, limit? }
       → Listar todas las suscripciones [Admin]

GET    /api/subscriptions/admin/stats
       → Obtener estadísticas completas [Admin]

POST   /api/subscriptions/admin/deliveries/:id/complete
       Body: { orderId }
       → Marcar entrega como completada [Admin]
```

---

## 🛠️ Servicios Backend

### membershipService.js

**Métodos Principales:**

```javascript
// Planes
getAllPlans({ activeOnly, visibleOnly })
getPlanById(planId)
createPlan(data)
updatePlan(planId, data)
deletePlan(planId)

// Membresías de usuarios
getUserMembership(userId)
createMembership(userId, planId, billingCycle)
updateMembership(userId, planId)
cancelMembership(userId, reason)
pauseMembership(userId)
resumeMembership(userId)
renewMembership(userId)

// Descuentos
applyMembershipDiscount(userId, orderAmount)
  → Retorna: { hasDiscount, discountPercent, discount, finalAmount, freeShipping }

// Beneficios
createBenefit(planId, data)
recordBenefitUsage(userId, benefitId, data)

// Estadísticas
getMembershipStats()
getAllMemberships({ status, planId, page, limit })
```

### subscriptionService.js

**Métodos Principales:**

```javascript
// Planes
getAllPlans({ activeOnly, visibleOnly })
getPlanById(planId)
createPlan(data)
updatePlan(planId, data)
deletePlan(planId)

// Suscripciones de usuarios
getUserSubscriptions(userId)
createSubscription(userId, data)
updateSubscription(subscriptionId, data)
cancelSubscription(subscriptionId, reason)
pauseSubscription(subscriptionId, pauseUntil)
resumeSubscription(subscriptionId)

// Entregas
scheduleDelivery(subscriptionId, scheduledDate)
skipDelivery(deliveryId, userId, reason)
completeDelivery(deliveryId, orderId)
getSubscriptionDeliveries(subscriptionId, { status, limit })

// Estadísticas
getSubscriptionStats()
getAllSubscriptions({ status, planId, page, limit })

// Helpers
_calculateNextDelivery(fromDate, frequency)
```

---

## 🎨 Componentes Frontend

### Páginas Públicas

#### `/subscriptions/page.tsx`
- **Propósito**: Catálogo de planes de membresías y suscripciones
- **Características**:
  - Tabs para cambiar entre membresías y suscripciones
  - Selector de ciclo de facturación (mensual/trimestral/anual)
  - Cards informativos con precios y beneficios
  - Integración con autenticación para redirigir a checkout

### Páginas de Usuario

#### `/account/membership/page.tsx`
- **Propósito**: Gestión de membresía personal
- **Características**:
  - Vista completa de membresía activa
  - Estadísticas (ahorro acumulado, órdenes del mes)
  - Acciones: Pausar, Cancelar, Cambiar plan
  - Historial de facturación

#### `/account/subscriptions/page.tsx`
- **Propósito**: Gestión de suscripciones de cajas
- **Características**:
  - Lista de suscripciones activas
  - Detalles de cada suscripción
  - Historial de entregas
  - Acciones: Pausar, Cancelar, Saltar entrega
  - Próximas entregas programadas

### Páginas de Administración

#### `/admin/subscriptions/page.tsx`
- **Propósito**: Panel de administración completo
- **Tabs**:
  1. **Vista General**: KPIs y estadísticas
  2. **Planes de Membresía**: CRUD de planes
  3. **Planes de Suscripción**: CRUD de planes
  4. **Miembros**: Gestión de membresías activas
  5. **Suscriptores**: Gestión de suscripciones activas

---

## 🔄 Flujos de Trabajo

### Flujo 1: Usuario se suscribe a Membresía

```
1. Usuario navega a /subscriptions
2. Selecciona plan y ciclo de facturación
3. Click en "Suscribirse Ahora"
4. Redirige a checkout de membresía
5. Procesa pago (Stripe)
6. Backend crea UserMembership
7. Usuario recibe confirmación
8. Beneficios activos inmediatamente
```

### Flujo 2: Usuario crea Suscripción de Caja

```
1. Usuario navega a /subscriptions (tab Suscripciones)
2. Selecciona plan de caja
3. Click en "Suscribirse"
4. Configura frecuencia y preferencias
5. Selecciona dirección de entrega
6. Procesa primer pago
7. Backend crea Subscription
8. Programa primera entrega (SubscriptionDelivery)
9. Usuario ve suscripción en /account/subscriptions
```

### Flujo 3: Aplicar Descuento de Membresía en Checkout

```
1. Usuario con membresía activa va a checkout
2. Frontend llama a applyMembershipDiscount(orderAmount)
3. Backend verifica membresía activa
4. Calcula descuento según plan
5. Verifica límite mensual de órdenes
6. Retorna descuento aplicable
7. Frontend muestra precio con descuento
8. Usuario completa orden
9. Backend actualiza ordersThisMonth y totalSavings
```

### Flujo 4: Procesamiento de Entrega de Suscripción

```
1. Sistema verifica SubscriptionDelivery con status=SCHEDULED
2. 3 días antes de scheduledDate, envía recordatorio
3. En scheduledDate, sistema genera Order automáticamente
4. Asigna productos según plan y preferencias
5. Procesa pago con método guardado
6. Crea orden y asigna repartidor
7. Actualiza SubscriptionDelivery.status = PREPARING
8. Usuario recibe notificación
9. Al entregar, marca como DELIVERED
10. Programa siguiente entrega automáticamente
```

### Flujo 5: Usuario Salta una Entrega

```
1. Usuario ve próxima entrega en /account/subscriptions
2. Click en "Saltar" en entrega SCHEDULED
3. Modal de confirmación con opción de razón
4. Frontend llama skipDelivery(deliveryId, reason)
5. Backend actualiza delivery.status = SKIPPED
6. Incrementa subscription.skippedDeliveries
7. Calcula y programa siguiente entrega
8. Usuario ve entrega marcada como "Saltada"
```

---

## 📥 Instalación

### 1. Migración de Base de Datos

```bash
cd backend
npx prisma migrate dev --name add_subscriptions_memberships
```

### 2. Generar Cliente Prisma

```bash
npx prisma generate
```

### 3. (Opcional) Seed de Datos Iniciales

```javascript
// backend/prisma/seed-subscriptions.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMembershipPlans() {
  const plans = [
    {
      name: 'BRONZE',
      displayName: 'Bronze',
      monthlyPrice: 9.99,
      quarterlyPrice: 26.99,
      annualPrice: 99.99,
      discountPercent: 5,
      freeShipping: false,
      pointsMultiplier: 1.0,
      earlyAccess: false,
      exclusiveProducts: false,
      prioritySupport: false,
      features: JSON.stringify(['5% descuento', 'Puntos estándar']),
      color: '#CD7F32',
      sortOrder: 0,
      isActive: true,
      isVisible: true
    },
    // Agregar Silver, Gold, Platinum...
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.create({ data: plan });
  }
}

seedMembershipPlans()
  .then(() => console.log('✅ Planes creados'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Ejecutar seed:
```bash
node prisma/seed-subscriptions.js
```

### 4. Verificar Rutas Registradas

Confirmar en `backend/src/server.js`:
```javascript
const subscriptionRoutes = require('./routes/subscriptions');
app.use('/api/subscriptions', subscriptionRoutes);
```

---

## 💡 Uso

### Para Usuarios

1. **Explorar Planes**:
   - Visitar `/subscriptions`
   - Comparar beneficios y precios
   - Seleccionar plan adecuado

2. **Gestionar Membresía**:
   - Ir a `/account/membership`
   - Ver beneficios activos
   - Pausar/cancelar si es necesario

3. **Gestionar Suscripciones**:
   - Ir a `/account/subscriptions`
   - Ver próximas entregas
   - Saltar entregas cuando sea necesario

### Para Administradores

1. **Acceder al Panel**:
   - Ir a `/admin/subscriptions`
   - Ver estadísticas generales

2. **Crear Planes**:
   - Tab "Planes de Membresía" o "Planes de Suscripción"
   - Click en "+ Nuevo Plan"
   - Completar formulario y guardar

3. **Monitorear Métricas**:
   - MRR (Monthly Recurring Revenue)
   - Churn rate
   - Próximas renovaciones
   - Entregas programadas

---

## 🔐 Seguridad

- **Autenticación JWT**: Todos los endpoints de usuario requieren token válido
- **Autorización por Roles**: Endpoints admin requieren `requireAdmin` middleware
- **Validación de Datos**: Validación en backend antes de procesar
- **Rate Limiting**: Protección contra abuso de API
- **CORS**: Configurado para permitir solo orígenes autorizados

---

## 📊 Métricas Clave

### MRR (Monthly Recurring Revenue)
```javascript
MRR = Σ(Membresías Activas * Precio Mensual) + Σ(Suscripciones Activas * Precio)
```

### Churn Rate (Tasa de Cancelación)
```javascript
Churn Rate = (Cancelaciones / (Activos + Cancelaciones)) * 100
```

### CLV (Customer Lifetime Value)
```javascript
CLV = Precio Mensual * (1 / Churn Rate)
```

### AOV (Average Order Value) con Membresía
```javascript
AOV = Total Revenue / Número de Órdenes
```

---

## 🚀 Mejoras Futuras

1. **Integración Stripe Subscriptions**
   - Webhooks para renovaciones automáticas
   - Gestión de fallos de pago

2. **Recomendaciones Personalizadas**
   - ML para sugerir productos en cajas
   - Basado en historial de compras

3. **Programa de Referidos**
   - Bonos por invitar amigos
   - Descuentos en membresía

4. **Niveles VIP Automáticos**
   - Upgrade automático según gasto acumulado
   - Beneficios sorpresa

5. **Análisis Predictivo**
   - Predicción de churn
   - Optimización de retención

---

## 📞 Soporte

Para problemas o preguntas sobre el sistema de suscripciones:
- **Email**: support@carnespremium.com
- **Documentación**: `/docs/subscriptions`
- **Admin Panel**: `/admin/subscriptions`

---

**Versión**: 1.0.0  
**Última actualización**: 2025-11-20  
**Autor**: MiniMax Agent
