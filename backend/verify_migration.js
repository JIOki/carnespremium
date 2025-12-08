const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTables() {
  try {
    console.log('\n✅ VERIFICACIÓN DE MIGRACIÓN - PUNTO 10\n');
    console.log('━'.repeat(60));
    
    // Verificar tablas de Membresías
    console.log('\n📋 TABLAS DE MEMBRESÍAS:');
    const membershipPlans = await prisma.membershipPlan.findMany();
    console.log(`  ✓ MembershipPlan: ${membershipPlans.length} registros`);
    
    const userMemberships = await prisma.userMembership.findMany();
    console.log(`  ✓ UserMembership: ${userMemberships.length} registros`);
    
    const membershipBenefits = await prisma.membershipBenefit.findMany();
    console.log(`  ✓ MembershipBenefit: ${membershipBenefits.length} registros`);
    
    const benefitUsage = await prisma.membershipBenefitUsage.findMany();
    console.log(`  ✓ MembershipBenefitUsage: ${benefitUsage.length} registros`);
    
    // Verificar tablas de Suscripciones
    console.log('\n📦 TABLAS DE SUSCRIPCIONES:');
    const subscriptionPlans = await prisma.subscriptionPlan.findMany();
    console.log(`  ✓ SubscriptionPlan: ${subscriptionPlans.length} registros`);
    
    const subscriptions = await prisma.subscription.findMany();
    console.log(`  ✓ Subscription: ${subscriptions.length} registros`);
    
    const deliveries = await prisma.subscriptionDelivery.findMany();
    console.log(`  ✓ SubscriptionDelivery: ${deliveries.length} registros`);
    
    console.log('\n━'.repeat(60));
    console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('   Todas las tablas del Punto 10 fueron creadas correctamente.\n');
    
  } catch (error) {
    console.error('❌ Error verificando tablas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
