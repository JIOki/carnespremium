# Sistema de Recomendaciones y Personalización con IA

## Resumen

Sistema inteligente de recomendaciones y personalización que utiliza algoritmos de machine learning para mejorar la experiencia del usuario y aumentar las ventas en la plataforma Carnes Premium.

## Arquitectura del Sistema

### Backend

```
backend/
├── prisma/
│   └── schema.prisma          # Modelos de datos
├── src/
│   ├── services/
│   │   ├── recommendationService.js   # Motor de recomendaciones
│   │   ├── trackingService.js         # Tracking de eventos
│   │   └── segmentationService.js     # Segmentación de usuarios
│   └── routes/
│       └── recommendations.js          # 26 endpoints de API
```

### Frontend

```
frontend-simple/
├── src/
│   ├── services/
│   │   └── recommendationService.ts   # Cliente API TypeScript
│   ├── hooks/
│   │   └── useTracking.ts              # Hook de tracking
│   ├── components/
│   │   └── recommendations/
│   │       └── RecommendationCarousel.tsx
│   └── app/
│       ├── recommendations/
│       │   └── page.tsx                # Página personalizada
│       └── admin/
│           └── recommendations/
│               └── page.tsx            # Panel admin
```

## Modelos de Datos

### UserEvent (Tracking de Eventos)
```prisma
model UserEvent {
  id              String   @id @default(cuid())
  userId          String?
  sessionId       String
  eventType       String   // VIEW_PRODUCT, ADD_TO_CART, PURCHASE, etc.
  productId       String?
  categoryId      String?
  searchQuery     String?
  duration        Int?
  fromRecommendation Boolean
  recommendationType String?
  deviceType      String?
  createdAt       DateTime
}
```

### ProductRecommendation (Recomendaciones Calculadas)
```prisma
model ProductRecommendation {
  id                    String   @id @default(cuid())
  productId             String
  recommendedProductId  String
  type                  String   // SIMILAR, FREQUENTLY_BOUGHT, TRENDING
  score                 Float
  impressions           Int
  clicks                Int
  conversions           Int
  ctr                   Float
  conversionRate        Float
}
```

### UserSegment (Segmentación de Usuarios)
```prisma
model UserSegment {
  id                String   @id @default(cuid())
  userId            String   @unique
  segments          String   // JSON array
  primarySegment    String
  engagementScore   Float
  purchaseFrequency Float
  averageOrderValue Float
  lifetimeValue     Float
  churnRisk         Float
  predictedNextPurchase DateTime?
  recommendedActions String   // JSON array
}
```

## API Endpoints

### Tracking de Eventos (Público/Privado)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/recommendations/track | Registra un evento |
| POST | /api/recommendations/track/batch | Registra eventos en batch |
| GET | /api/recommendations/user/events | Eventos del usuario |
| GET | /api/recommendations/user/recently-viewed | Productos vistos |
| GET | /api/recommendations/user/recent-searches | Búsquedas recientes |
| GET | /api/recommendations/user/behavior | Análisis de comportamiento |
| GET | /api/recommendations/user/abandoned-cart | Carrito abandonado |

### Recomendaciones (Mixto)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/recommendations/personalized | Recomendaciones personalizadas |
| GET | /api/recommendations/similar/:productId | Productos similares |
| GET | /api/recommendations/frequently-bought/:productId | Frecuentemente comprados |
| GET | /api/recommendations/complementary/:productId | Productos complementarios |
| GET | /api/recommendations/trending | Productos trending |
| GET | /api/recommendations/new | Productos nuevos |
| POST | /api/recommendations/feedback | Feedback del usuario |

### Segmentación (Privado)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/recommendations/user/segment | Segmento del usuario |
| POST | /api/recommendations/user/segment/recalculate | Recalcular segmento |

### Admin (Requiere Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/recommendations/admin/stats/events | Estadísticas de eventos |
| GET | /api/recommendations/admin/stats/recommendations | Stats de recomendaciones |
| GET | /api/recommendations/admin/stats/segments | Stats de segmentos |
| GET | /api/recommendations/admin/segments/:segmentName | Usuarios por segmento |
| GET | /api/recommendations/admin/at-risk-users | Usuarios en riesgo |
| GET | /api/recommendations/admin/high-value-users | Usuarios alto valor |
| POST | /api/recommendations/admin/recalculate-segments | Recalcular segmentos |
| DELETE | /api/recommendations/admin/events/cleanup | Limpiar eventos |

## Algoritmos de Recomendación

### 1. Recomendaciones Personalizadas
Combina múltiples estrategias:
- 40% basado en productos vistos (content-based)
- 30% frecuentemente comprados juntos (collaborative)
- 20% productos trending
- 10% preferencias del usuario

### 2. Productos Similares
- Busca productos en la misma categoría
- Ordena por relevancia, rating y ventas
- Usa recomendaciones precalculadas si existen

### 3. Frecuentemente Comprados Juntos
- Analiza órdenes que contienen el producto
- Cuenta frecuencia de otros productos
- Ordena por popularidad

### 4. Segmentación de Usuarios
Segmentos automáticos:
- **NEW_USER**: Sin compras
- **FIRST_TIME_BUYER**: Una compra
- **FREQUENT_BUYER**: >2 compras/mes
- **HIGH_VALUE**: LTV > $500 o AOV > $200
- **PREMIUM**: Con membresía activa
- **AT_RISK**: Riesgo de churn > 60%
- **INACTIVE**: >90 días sin compra
- **LOYAL**: >10 órdenes, >1 compra/mes

## Tipos de Eventos Soportados

```javascript
const eventTypes = [
  'VIEW_PRODUCT',      // Ver producto
  'ADD_TO_CART',       // Agregar al carrito
  'REMOVE_FROM_CART',  // Remover del carrito
  'ADD_TO_WISHLIST',   // Agregar a wishlist
  'REMOVE_FROM_WISHLIST', // Remover de wishlist
  'SEARCH',            // Búsqueda
  'PURCHASE',          // Compra
  'CLICK',             // Click
  'SCROLL',            // Scroll
  'VIEW_CATEGORY',     // Ver categoría
  'CHECKOUT_START',    // Iniciar checkout
  'CHECKOUT_COMPLETE'  // Completar checkout
];
```

## Hook de Tracking (Frontend)

```typescript
import { useTracking } from '../hooks/useTracking';

function ProductPage() {
  const { 
    trackProductView,
    trackAddToCart,
    trackRecommendationClick 
  } = useTracking();

  useEffect(() => {
    trackProductView(productId);
  }, [productId]);

  const handleAddToCart = () => {
    trackAddToCart(productId, quantity, price);
    // ... lógica de carrito
  };

  return (
    <RecommendationCarousel
      products={recommendations}
      onProductClick={(product, position) => {
        trackRecommendationClick(
          currentProductId,
          product.id,
          'SIMILAR',
          position
        );
      }}
    />
  );
}
```

## Métricas del Sistema

### KPIs de Recomendaciones
- **CTR (Click-Through Rate)**: Clicks / Impresiones
- **Conversion Rate**: Conversiones / Clicks
- **Recommendation Impact**: % eventos desde recomendaciones

### KPIs de Segmentación
- **Engagement Score**: 0-100 basado en actividad
- **Churn Risk**: 0-100 probabilidad de abandono
- **LTV (Lifetime Value)**: Valor total del cliente

## Acciones Recomendadas Automáticas

El sistema genera acciones personalizadas:
- `SEND_WINBACK_EMAIL`: Para usuarios en riesgo
- `SEND_SECOND_PURCHASE_INCENTIVE`: Para nuevos compradores
- `OFFER_MEMBERSHIP`: Para usuarios con alto gasto
- `VIP_TREATMENT`: Para compradores frecuentes premium

## Integración con Otras Funcionalidades

### Con Sistema de Notificaciones
```javascript
// Enviar push con productos recomendados
const recommendations = await recommendationService.getPersonalizedRecommendations(userId);
await notificationService.sendPush(userId, {
  title: 'Productos para ti',
  body: `Te recomendamos ${recommendations[0].name}`,
  data: { type: 'RECOMMENDATION', productId: recommendations[0].id }
});
```

### Con Email Marketing
```javascript
// Personalizar emails con recomendaciones
const recentlyViewed = await trackingService.getRecentlyViewedProducts(userId);
const abandoned = await trackingService.getAbandonedCartProducts(userId);
// Incluir en template de email
```

## Optimización y Rendimiento

### Cache de Recomendaciones
- Recomendaciones precalculadas en tabla ProductRecommendation
- TTL configurable por tipo
- Fallback a cálculo en tiempo real

### Batch Processing
- Eventos se acumulan y envían cada 2 segundos
- Flush automático al cerrar página
- Limpieza de eventos antiguos (>365 días)

### Recálculo de Segmentos
- Flag `needsRecalculation` cuando hay eventos importantes
- Proceso batch para segmentos desactualizados (>7 días)

## Configuración Recomendada

### Variables de Entorno
```env
# Redis para cache (opcional pero recomendado)
REDIS_URL=redis://localhost:6379

# Configuración de recomendaciones
RECOMMENDATION_CACHE_TTL=3600
SEGMENT_RECALC_DAYS=7
EVENT_RETENTION_DAYS=365
```

## Impacto en el Negocio

### Métricas Esperadas
- **+25-40%** en conversión con recomendaciones
- **+15-30%** en valor promedio de orden (cross-selling)
- **+20%** en engagement
- **-10-15%** en abandono de carrito
- **Mejor retención** con experiencias personalizadas

### ROI
- Aumento de ingresos por recomendaciones efectivas
- Reducción de churn con alertas tempranas
- Mayor LTV por personalización
- Eficiencia en marketing con segmentación precisa

## Próximos Pasos

1. **Machine Learning Avanzado**: Implementar modelos de deep learning
2. **A/B Testing**: Framework para probar algoritmos
3. **Real-time Personalization**: Personalización en tiempo real
4. **Collaborative Filtering**: Usuarios similares
5. **Content-Based Filtering**: Embeddings de productos
