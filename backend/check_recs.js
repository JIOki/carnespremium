const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const [recs, events, segments] = await Promise.all([
    prisma.productRecommendation.count(),
    prisma.userEvent.count(),
    prisma.userSegment.count()
  ]);
  
  console.log('\n📊 Estado del Sistema de Recomendaciones:');
  console.log(`  - ProductRecommendations: ${recs}`);
  console.log(`  - UserEvents: ${events}`);
  console.log(`  - UserSegments: ${segments}\n`);
  
  await prisma.$disconnect();
}

check();
