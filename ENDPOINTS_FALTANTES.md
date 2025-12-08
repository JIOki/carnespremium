# ENDPOINTS FALTANTES (404 ERRORS) - 14 TESTS

## ANÁLISIS COMPLETO DE ENDPOINTS 404

### 1. GAMIFICACIÓN PERSONAL (4 endpoints)
❌ **GET /api/gamification/my-badges**
   - Test busca: `/gamification/badges/earned`
   - Existe: `/gamification/badges/my` (línea 100)
   - Acción: Crear alias en ruta correcta

❌ **GET /api/gamification/my-challenges**
   - Test busca: `/gamification/challenges/mine`
   - Existe: `/gamification/challenges` (línea 165) - devuelve challenges con progreso del usuario
   - Acción: Crear alias en ruta correcta

❌ **GET /api/gamification/leaderboards**
   - Test busca: `/gamification/leaderboard` (sin parámetros)
   - Existe: `/gamification/leaderboard/:type` (línea 338) - requiere parámetro
   - Acción: Crear endpoint que devuelva todos los leaderboards o uno general

❌ **GET /api/gamification/stats**
   - NO existe actualmente
   - Acción: Crear endpoint que devuelva estadísticas generales de gamificación del usuario

### 2. AUTENTICACIÓN (1 endpoint)
❌ **GET /api/auth/profile**
   - NO existe actualmente
   - Acción: Crear endpoint que devuelva perfil del usuario autenticado

### 3. LOYALTY (1 endpoint)
❌ **GET /api/loyalty/tiers**
   - Test busca: `/gamification/loyalty/tiers`
   - Existe: `/gamification/tiers` (línea 67)
   - Acción: El endpoint existe, el test usa la ruta correcta

### 4. REFERRALS (2 endpoints)
❌ **GET /api/referrals/code**
   - Test busca: `/gamification/referrals/code`
   - Existe: `/gamification/referrals/my-code` (línea 211)
   - Acción: Crear alias en ruta correcta

❌ **GET /api/referrals/stats**
   - Test busca: `/gamification/referrals`
   - Existe: `/gamification/referrals/stats` (línea 225)
   - Acción: Verificar que el test use la ruta correcta

### 5. WISHLIST (1 endpoint)
❌ **DELETE /api/wishlist/:id**
   - Test busca: `/wishlist/{product_id}`
   - Acción: Implementar endpoint DELETE en wishlist.js

### 6. REVIEWS (1 endpoint)
❌ **GET /api/reviews**
   - Test busca: `/products/{product_id}/reviews`
   - Acción: Verificar implementación en routes

### 7. CATEGORIES (1 endpoint)
❌ **POST /api/categories**
   - Acción: Implementar endpoint POST para crear categorías (solo admin)

### 8. SUBSCRIPTIONS (1 endpoint)
❌ **GET /api/subscriptions/plans**
   - Acción: Implementar endpoint GET para listar planes de suscripción

## PRIORIDAD DE IMPLEMENTACIÓN
1. ✅ Gamificación personal (4 endpoints) - EMPEZAR AQUÍ
2. Auth profile
3. Referrals
4. Wishlist DELETE
5. Reviews GET
6. Categories POST
7. Subscriptions plans
