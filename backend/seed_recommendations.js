const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRecommendations() {
  try {
    console.log('🌱 Iniciando seed de datos de recomendaciones...\n');

    // 1. Obtener productos existentes
    const products = await prisma.product.findMany({ take: 20 });
    if (products.length === 0) {
      console.log('⚠️  No hay productos. Ejecuta el seed principal primero.');
      return;
    }

    console.log(`✅ ${products.length} productos encontrados\n`);

    // 2. Crear recomendaciones de productos similares
    console.log('📊 Creando recomendaciones de productos similares...');
    let recommendationsCreated = 0;

    for (let i = 0; i < Math.min(products.length, 10); i++) {
      const product = products[i];
      const similarProducts = products.filter(p => 
        p.id !== product.id && p.categoryId === product.categoryId
      ).slice(0, 4);

      for (const similar of similarProducts) {
        await prisma.productRecommendation.create({
          data: {
            productId: product.id,
            recommendedProductId: similar.id,
            type: 'SIMILAR',
            score: 0.7 + Math.random() * 0.3,
            confidence: 0.8 + Math.random() * 0.2,
            impressions: Math.floor(Math.random() * 100),
            clicks: Math.floor(Math.random() * 20),
            conversions: Math.floor(Math.random() * 5),
            algorithm: 'CONTENT_BASED',
            isActive: true
          }
        });
        recommendationsCreated++;
      }
    }

    console.log(`   ✅ ${recommendationsCreated} recomendaciones creadas\n`);

    // 3. Crear eventos de ejemplo para usuarios
    const users = await prisma.user.findMany({ take: 5 });
    console.log(`📈 Creando eventos de tracking para ${users.length} usuarios...`);
    
    let eventsCreated = 0;
    const eventTypes = ['VIEW_PRODUCT', 'ADD_TO_CART', 'ADD_TO_WISHLIST', 'SEARCH'];

    for (const user of users) {
      for (let i = 0; i < 10; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        await prisma.userEvent.create({
          data: {
            userId: user.id,
            sessionId: `session_${user.id}_${Date.now()}`,
            eventType: randomEventType,
            productId: randomProduct.id,
            categoryId: randomProduct.categoryId,
            deviceType: ['MOBILE', 'DESKTOP', 'TABLET'][Math.floor(Math.random() * 3)],
            browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
            fromRecommendation: Math.random() > 0.7
          }
        });
        eventsCreated++;
      }
    }

    console.log(`   ✅ ${eventsCreated} eventos creados\n`);

    // 4. Crear segmentos de usuarios
    console.log('👥 Creando segmentos de usuarios...');
    let segmentsCreated = 0;

    const segmentTypes = ['NEW_USER', 'FREQUENT_BUYER', 'HIGH_VALUE', 'AT_RISK'];
    
    for (const user of users) {
      const primarySegment = segmentTypes[Math.floor(Math.random() * segmentTypes.length)];
      
      await prisma.userSegment.create({
        data: {
          userId: user.id,
          segments: JSON.stringify([primarySegment]),
          primarySegment,
          engagementScore: 20 + Math.random() * 80,
          purchaseFrequency: Math.random() * 3,
          averageOrderValue: 50 + Math.random() * 200,
          lifetimeValue: 100 + Math.random() * 1000,
          churnRisk: Math.random() * 100,
          totalOrders: Math.floor(Math.random() * 10),
          totalSpent: 100 + Math.random() * 1000,
          daysSinceLastPurchase: Math.floor(Math.random() * 90),
          daysSinceFirstPurchase: Math.floor(Math.random() * 365),
          needsRecalculation: false
        }
      });
      segmentsCreated++;
    }

    console.log(`   ✅ ${segmentsCreated} segmentos creados\n`);

    console.log('✨ Seed completado exitosamente!\n');
    console.log('Resumen:');
    console.log(`  - ${recommendationsCreated} recomendaciones de productos`);
    console.log(`  - ${eventsCreated} eventos de tracking`);
    console.log(`  - ${segmentsCreated} segmentos de usuarios`);
    console.log('\n🚀 El sistema de recomendaciones está listo para usar!\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRecommendations();
