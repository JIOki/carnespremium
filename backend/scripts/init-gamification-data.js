/**
 * Script de inicialización de datos de gamificación
 * Crea badges, challenges y rewards predeterminados
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Badges predeterminados
const BADGES = [
  // Badges de compras
  {
    code: 'FIRST_PURCHASE',
    name: 'Primera Compra',
    description: '¡Felicitaciones por tu primera compra!',
    icon: '🎉',
    color: '#10B981',
    rarity: 'COMMON',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 1,
    pointsReward: 50,
    isActive: true,
    isSecret: false,
    sortOrder: 1
  },
  {
    code: 'FREQUENT_BUYER',
    name: 'Comprador Frecuente',
    description: 'Has realizado 10 compras',
    icon: '🛒',
    color: '#3B82F6',
    rarity: 'RARE',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 10,
    pointsReward: 200,
    isActive: true,
    isSecret: false,
    sortOrder: 2
  },
  {
    code: 'LOYAL_CUSTOMER',
    name: 'Cliente Leal',
    description: 'Has realizado 25 compras',
    icon: '👑',
    color: '#F59E0B',
    rarity: 'EPIC',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 25,
    pointsReward: 500,
    isActive: true,
    isSecret: false,
    sortOrder: 3
  },
  {
    code: 'VIP_CLIENT',
    name: 'Cliente VIP',
    description: 'Has realizado 50 compras',
    icon: '💎',
    color: '#8B5CF6',
    rarity: 'LEGENDARY',
    requirementType: 'PURCHASE_COUNT',
    requirementValue: 50,
    pointsReward: 1000,
    hasSpecialReward: true,
    specialRewardDesc: 'Descuento VIP del 15% permanente',
    isActive: true,
    isSecret: false,
    sortOrder: 4
  },
  
  // Badges de gasto
  {
    code: 'BIG_SPENDER_100',
    name: 'Gran Comprador',
    description: 'Has gastado más de $100',
    icon: '💰',
    color: '#10B981',
    rarity: 'COMMON',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 100,
    pointsReward: 100,
    isActive: true,
    isSecret: false,
    sortOrder: 5
  },
  {
    code: 'BIG_SPENDER_500',
    name: 'Comprador Premium',
    description: 'Has gastado más de $500',
    icon: '🏆',
    color: '#F59E0B',
    rarity: 'RARE',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 500,
    pointsReward: 300,
    isActive: true,
    isSecret: false,
    sortOrder: 6
  },
  {
    code: 'BIG_SPENDER_1000',
    name: 'Comprador Elite',
    description: 'Has gastado más de $1000',
    icon: '💸',
    color: '#8B5CF6',
    rarity: 'EPIC',
    requirementType: 'TOTAL_SPENT',
    requirementValue: 1000,
    pointsReward: 750,
    isActive: true,
    isSecret: false,
    sortOrder: 7
  },
  
  // Badges de reviews
  {
    code: 'FIRST_REVIEW',
    name: 'Primera Opinión',
    description: 'Has escrito tu primera reseña',
    icon: '⭐',
    color: '#3B82F6',
    rarity: 'COMMON',
    requirementType: 'REVIEW_COUNT',
    requirementValue: 1,
    pointsReward: 25,
    isActive: true,
    isSecret: false,
    sortOrder: 8
  },
  {
    code: 'EXPERT_CRITIC',
    name: 'Crítico Experto',
    description: 'Has escrito 10 reseñas',
    icon: '📝',
    color: '#F59E0B',
    rarity: 'RARE',
    requirementType: 'REVIEW_COUNT',
    requirementValue: 10,
    pointsReward: 250,
    isActive: true,
    isSecret: false,
    sortOrder: 9
  },
  
  // Badges de referidos
  {
    code: 'INFLUENCER',
    name: 'Influencer',
    description: 'Has referido a 5 amigos',
    icon: '🎯',
    color: '#EC4899',
    rarity: 'RARE',
    requirementType: 'REFERRAL_COUNT',
    requirementValue: 5,
    pointsReward: 300,
    isActive: true,
    isSecret: false,
    sortOrder: 10
  },
  {
    code: 'AMBASSADOR',
    name: 'Embajador',
    description: 'Has referido a 20 amigos',
    icon: '🌟',
    color: '#8B5CF6',
    rarity: 'EPIC',
    requirementType: 'REFERRAL_COUNT',
    requirementValue: 20,
    pointsReward: 1000,
    hasSpecialReward: true,
    specialRewardDesc: 'Acceso exclusivo a productos limitados',
    isActive: true,
    isSecret: false,
    sortOrder: 11
  },
  
  // Badges de rachas
  {
    code: 'STREAK_3',
    name: 'Racha de Fuego',
    description: 'Has comprado 3 meses consecutivos',
    icon: '🔥',
    color: '#EF4444',
    rarity: 'RARE',
    requirementType: 'STREAK',
    requirementValue: 3,
    pointsReward: 150,
    isActive: true,
    isSecret: false,
    sortOrder: 12
  },
  {
    code: 'STREAK_6',
    name: 'Racha Imparable',
    description: 'Has comprado 6 meses consecutivos',
    icon: '⚡',
    color: '#F59E0B',
    rarity: 'EPIC',
    requirementType: 'STREAK',
    requirementValue: 6,
    pointsReward: 400,
    isActive: true,
    isSecret: false,
    sortOrder: 13
  },
  {
    code: 'STREAK_12',
    name: 'Racha Legendaria',
    description: 'Has comprado 12 meses consecutivos',
    icon: '🌈',
    color: '#8B5CF6',
    rarity: 'LEGENDARY',
    requirementType: 'STREAK',
    requirementValue: 12,
    pointsReward: 1000,
    hasSpecialReward: true,
    specialRewardDesc: 'Envío gratis de por vida',
    isActive: true,
    isSecret: false,
    sortOrder: 14
  },
  
  // Badges especiales/secretos
  {
    code: 'EARLY_BIRD',
    name: 'Madrugador',
    description: 'Has comprado antes de las 8am',
    icon: '🌅',
    color: '#06B6D4',
    rarity: 'RARE',
    requirementType: 'SPECIAL',
    pointsReward: 50,
    isActive: true,
    isSecret: true,
    sortOrder: 15
  },
  {
    code: 'NIGHT_OWL',
    name: 'Búho Nocturno',
    description: 'Has comprado después de las 11pm',
    icon: '🦉',
    color: '#6366F1',
    rarity: 'RARE',
    requirementType: 'SPECIAL',
    pointsReward: 50,
    isActive: true,
    isSecret: true,
    sortOrder: 16
  },
  {
    code: 'WEEKEND_WARRIOR',
    name: 'Guerrero del Fin de Semana',
    description: 'Has realizado 5 compras en fin de semana',
    icon: '🎊',
    color: '#EC4899',
    rarity: 'EPIC',
    requirementType: 'SPECIAL',
    pointsReward: 200,
    isActive: true,
    isSecret: true,
    sortOrder: 17
  }
];

// Challenges predeterminados
const CHALLENGES = [
  // Challenges diarios
  {
    code: 'DAILY_VISIT',
    name: 'Visita Diaria',
    description: 'Visita la tienda hoy',
    type: 'DAILY',
    category: 'EXPLORATION',
    targetType: 'VISIT_PAGES',
    targetValue: 1,
    pointsReward: 10,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '📱',
    color: '#10B981',
    difficulty: 'EASY'
  },
  {
    code: 'DAILY_EXPLORE',
    name: 'Explorador Diario',
    description: 'Visita 5 productos diferentes hoy',
    type: 'DAILY',
    category: 'EXPLORATION',
    targetType: 'VISIT_PAGES',
    targetValue: 5,
    pointsReward: 25,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '🔍',
    color: '#3B82F6',
    difficulty: 'EASY'
  },
  {
    code: 'DAILY_WISHLIST',
    name: 'Favoritos del Día',
    description: 'Agrega 2 productos a tu wishlist',
    type: 'DAILY',
    category: 'EXPLORATION',
    targetType: 'ADD_TO_WISHLIST',
    targetValue: 2,
    pointsReward: 20,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '❤️',
    color: '#EC4899',
    difficulty: 'EASY'
  },
  
  // Challenges semanales
  {
    code: 'WEEKLY_PURCHASE',
    name: 'Compra Semanal',
    description: 'Realiza al menos 1 compra esta semana',
    type: 'WEEKLY',
    category: 'PURCHASE',
    targetType: 'BUY_PRODUCTS',
    targetValue: 1,
    pointsReward: 100,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '🛍️',
    color: '#10B981',
    difficulty: 'MEDIUM'
  },
  {
    code: 'WEEKLY_BIG_CART',
    name: 'Carrito Grande',
    description: 'Compra 5 productos diferentes esta semana',
    type: 'WEEKLY',
    category: 'PURCHASE',
    targetType: 'BUY_PRODUCTS',
    targetValue: 5,
    pointsReward: 200,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '🛒',
    color: '#F59E0B',
    difficulty: 'MEDIUM'
  },
  {
    code: 'WEEKLY_SPEND_100',
    name: 'Gran Comprador Semanal',
    description: 'Gasta $100 o más esta semana',
    type: 'WEEKLY',
    category: 'PURCHASE',
    targetType: 'SPEND_AMOUNT',
    targetValue: 100,
    pointsReward: 300,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '💰',
    color: '#8B5CF6',
    difficulty: 'HARD'
  },
  {
    code: 'WEEKLY_REVIEWS',
    name: 'Crítico Semanal',
    description: 'Escribe 3 reseñas esta semana',
    type: 'WEEKLY',
    category: 'REVIEW',
    targetType: 'WRITE_REVIEWS',
    targetValue: 3,
    pointsReward: 150,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '✍️',
    color: '#3B82F6',
    difficulty: 'MEDIUM'
  },
  
  // Challenges mensuales
  {
    code: 'MONTHLY_LOYALTY',
    name: 'Fidelidad Mensual',
    description: 'Realiza al menos 4 compras este mes',
    type: 'MONTHLY',
    category: 'PURCHASE',
    targetType: 'BUY_PRODUCTS',
    targetValue: 4,
    pointsReward: 500,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '🏆',
    color: '#F59E0B',
    difficulty: 'HARD'
  },
  {
    code: 'MONTHLY_SPEND_500',
    name: 'Comprador Premium Mensual',
    description: 'Gasta $500 o más este mes',
    type: 'MONTHLY',
    category: 'PURCHASE',
    targetType: 'SPEND_AMOUNT',
    targetValue: 500,
    pointsReward: 1000,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '💎',
    color: '#8B5CF6',
    difficulty: 'HARD'
  },
  {
    code: 'MONTHLY_REFER',
    name: 'Embajador Mensual',
    description: 'Refiere a 3 amigos este mes',
    type: 'MONTHLY',
    category: 'SOCIAL',
    targetType: 'REFER_FRIENDS',
    targetValue: 3,
    pointsReward: 600,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: true,
    maxCompletions: 999,
    icon: '🎯',
    color: '#EC4899',
    difficulty: 'HARD'
  },
  
  // Challenges especiales/únicos
  {
    code: 'COMPLETE_PROFILE',
    name: 'Perfil Completo',
    description: 'Completa tu perfil al 100%',
    type: 'ONE_TIME',
    category: 'LOYALTY',
    targetType: 'COMPLETE_PROFILE',
    targetValue: 1,
    pointsReward: 100,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: false,
    maxCompletions: 1,
    icon: '👤',
    color: '#10B981',
    difficulty: 'EASY'
  },
  {
    code: 'FIRST_REFERRAL',
    name: 'Primer Referido',
    description: 'Refiere a tu primer amigo',
    type: 'ONE_TIME',
    category: 'SOCIAL',
    targetType: 'REFER_FRIENDS',
    targetValue: 1,
    pointsReward: 150,
    startDate: new Date('2025-01-01'),
    isActive: true,
    isRepeatable: false,
    maxCompletions: 1,
    icon: '🤝',
    color: '#3B82F6',
    difficulty: 'MEDIUM'
  },
  {
    code: 'TRY_ALL_CATEGORIES',
    name: 'Explorador Total',
    description: 'Compra productos de 5 categorías diferentes',
    type: 'SPECIAL',
    category: 'EXPLORATION',
    targetType: 'BUY_FROM_CATEGORIES',
    targetValue: 5,
    pointsReward: 400,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    isActive: true,
    isRepeatable: false,
    maxCompletions: 1,
    icon: '🌍',
    color: '#8B5CF6',
    difficulty: 'HARD'
  }
];

// Recompensas predeterminadas
const REWARDS = [
  // Descuentos
  {
    name: 'Descuento 5%',
    description: 'Cupón de descuento del 5% en tu próxima compra',
    shortDesc: '5% OFF',
    type: 'DISCOUNT',
    pointsCost: 100,
    discountType: 'PERCENTAGE',
    discountValue: 5,
    maxPerUser: 5,
    imageUrl: '/rewards/discount-5.png',
    icon: '🎫',
    color: '#10B981',
    featured: false,
    sortOrder: 1,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Descuento 10%',
    description: 'Cupón de descuento del 10% en tu próxima compra',
    shortDesc: '10% OFF',
    type: 'DISCOUNT',
    pointsCost: 250,
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxPerUser: 3,
    imageUrl: '/rewards/discount-10.png',
    icon: '🎁',
    color: '#3B82F6',
    featured: true,
    sortOrder: 2,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Descuento 15%',
    description: 'Cupón de descuento del 15% en tu próxima compra',
    shortDesc: '15% OFF',
    type: 'DISCOUNT',
    pointsCost: 500,
    discountType: 'PERCENTAGE',
    discountValue: 15,
    requiresTier: 'SILVER',
    maxPerUser: 2,
    imageUrl: '/rewards/discount-15.png',
    icon: '💝',
    color: '#F59E0B',
    featured: true,
    sortOrder: 3,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Descuento 20%',
    description: 'Cupón de descuento del 20% en tu próxima compra',
    shortDesc: '20% OFF',
    type: 'DISCOUNT',
    pointsCost: 1000,
    discountType: 'PERCENTAGE',
    discountValue: 20,
    requiresTier: 'GOLD',
    maxPerUser: 1,
    imageUrl: '/rewards/discount-20.png',
    icon: '🎉',
    color: '#8B5CF6',
    featured: true,
    sortOrder: 4,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Descuento $10',
    description: 'Cupón de descuento de $10 en compras mayores a $50',
    shortDesc: '$10 OFF',
    type: 'DISCOUNT',
    pointsCost: 300,
    discountType: 'FIXED_AMOUNT',
    discountValue: 10,
    maxPerUser: 3,
    imageUrl: '/rewards/discount-10usd.png',
    icon: '💵',
    color: '#10B981',
    featured: false,
    sortOrder: 5,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Descuento $25',
    description: 'Cupón de descuento de $25 en compras mayores a $100',
    shortDesc: '$25 OFF',
    type: 'DISCOUNT',
    pointsCost: 750,
    discountType: 'FIXED_AMOUNT',
    discountValue: 25,
    requiresTier: 'SILVER',
    maxPerUser: 2,
    imageUrl: '/rewards/discount-25usd.png',
    icon: '💸',
    color: '#F59E0B',
    featured: false,
    sortOrder: 6,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  
  // Envío gratis
  {
    name: 'Envío Gratis',
    description: 'Envío gratis en tu próxima compra (sin mínimo)',
    shortDesc: 'Free Shipping',
    type: 'FREE_SHIPPING',
    pointsCost: 200,
    maxPerUser: 5,
    imageUrl: '/rewards/free-shipping.png',
    icon: '🚚',
    color: '#06B6D4',
    featured: true,
    sortOrder: 7,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Envío Express Gratis',
    description: 'Envío express gratis en tu próxima compra',
    shortDesc: 'Free Express',
    type: 'FREE_SHIPPING',
    pointsCost: 400,
    requiresTier: 'SILVER',
    maxPerUser: 3,
    imageUrl: '/rewards/free-express.png',
    icon: '⚡',
    color: '#8B5CF6',
    featured: true,
    sortOrder: 8,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  
  // Acceso exclusivo
  {
    name: 'Acceso VIP 30 días',
    description: 'Acceso a productos exclusivos y preventas por 30 días',
    shortDesc: 'VIP Access',
    type: 'EXCLUSIVE_ACCESS',
    pointsCost: 1500,
    requiresTier: 'GOLD',
    maxPerUser: 2,
    imageUrl: '/rewards/vip-access.png',
    icon: '👑',
    color: '#F59E0B',
    featured: true,
    sortOrder: 9,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Early Access',
    description: 'Acceso anticipado a nuevos productos (24h antes)',
    shortDesc: 'Early Bird',
    type: 'EXCLUSIVE_ACCESS',
    pointsCost: 800,
    requiresTier: 'SILVER',
    maxPerUser: 3,
    imageUrl: '/rewards/early-access.png',
    icon: '🌟',
    color: '#EC4899',
    featured: false,
    sortOrder: 10,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  
  // Recompensas físicas (limitadas)
  {
    name: 'Camiseta Premium',
    description: 'Camiseta exclusiva de Carnes Premium (edición limitada)',
    shortDesc: 'Premium Tee',
    type: 'PHYSICAL_REWARD',
    pointsCost: 2000,
    stockLimit: 100,
    currentStock: 100,
    requiresTier: 'GOLD',
    maxPerUser: 1,
    imageUrl: '/rewards/tshirt.png',
    icon: '👕',
    color: '#3B82F6',
    featured: true,
    sortOrder: 11,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Kit de Cocina',
    description: 'Kit profesional para amantes de la carne (cuchillos, tabla, termómetro)',
    shortDesc: 'Chef Kit',
    type: 'PHYSICAL_REWARD',
    pointsCost: 5000,
    stockLimit: 50,
    currentStock: 50,
    requiresTier: 'PLATINUM',
    maxPerUser: 1,
    imageUrl: '/rewards/chef-kit.png',
    icon: '🔪',
    color: '#8B5CF6',
    featured: true,
    sortOrder: 12,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  },
  
  // Experiencias
  {
    name: 'Clase de Cocina Virtual',
    description: 'Sesión virtual de cocina con chef profesional (2 horas)',
    shortDesc: 'Cooking Class',
    type: 'EXCLUSIVE_ACCESS',
    pointsCost: 3000,
    stockLimit: 20,
    currentStock: 20,
    requiresTier: 'GOLD',
    maxPerUser: 1,
    imageUrl: '/rewards/cooking-class.png',
    icon: '👨‍🍳',
    color: '#EF4444',
    featured: true,
    sortOrder: 13,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2025-12-31'),
    isActive: true,
    isVisible: true
  },
  {
    name: 'Mystery Box',
    description: 'Caja sorpresa con productos premium seleccionados',
    shortDesc: 'Surprise Box',
    type: 'PHYSICAL_REWARD',
    pointsCost: 1500,
    stockLimit: 30,
    currentStock: 30,
    maxPerUser: 2,
    imageUrl: '/rewards/mystery-box.png',
    icon: '🎁',
    color: '#EC4899',
    featured: true,
    sortOrder: 14,
    validFrom: new Date('2025-01-01'),
    isActive: true,
    isVisible: true
  }
];

async function main() {
  console.log('🚀 Iniciando carga de datos de gamificación...\n');

  try {
    // Limpiar datos existentes (opcional)
    console.log('🗑️  Limpiando datos existentes...');
    await prisma.badge.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.reward.deleteMany();
    console.log('✅ Datos existentes eliminados\n');

    // Crear Badges
    console.log('🏅 Creando badges...');
    const badgeResults = [];
    for (const badge of BADGES) {
      const created = await prisma.badge.create({ data: badge });
      badgeResults.push(created);
      console.log(`   ✓ ${badge.icon} ${badge.name} (${badge.rarity})`);
    }
    console.log(`✅ ${badgeResults.length} badges creados\n`);

    // Crear Challenges
    console.log('🎯 Creando challenges...');
    const challengeResults = [];
    for (const challenge of CHALLENGES) {
      const created = await prisma.challenge.create({ data: challenge });
      challengeResults.push(created);
      console.log(`   ✓ ${challenge.icon} ${challenge.name} (${challenge.type})`);
    }
    console.log(`✅ ${challengeResults.length} challenges creados\n`);

    // Crear Rewards
    console.log('🎁 Creando recompensas...');
    const rewardResults = [];
    for (const reward of REWARDS) {
      const created = await prisma.reward.create({ data: reward });
      rewardResults.push(created);
      console.log(`   ✓ ${reward.icon} ${reward.name} (${reward.pointsCost} pts)`);
    }
    console.log(`✅ ${rewardResults.length} recompensas creadas\n`);

    // Resumen
    console.log('📊 RESUMEN DE INICIALIZACIÓN:');
    console.log('═'.repeat(50));
    console.log(`Badges creados:      ${badgeResults.length}`);
    console.log(`  - Common:          ${badgeResults.filter(b => b.rarity === 'COMMON').length}`);
    console.log(`  - Rare:            ${badgeResults.filter(b => b.rarity === 'RARE').length}`);
    console.log(`  - Epic:            ${badgeResults.filter(b => b.rarity === 'EPIC').length}`);
    console.log(`  - Legendary:       ${badgeResults.filter(b => b.rarity === 'LEGENDARY').length}`);
    console.log(`  - Secretos:        ${badgeResults.filter(b => b.isSecret).length}`);
    console.log();
    console.log(`Challenges creados:  ${challengeResults.length}`);
    console.log(`  - Diarios:         ${challengeResults.filter(c => c.type === 'DAILY').length}`);
    console.log(`  - Semanales:       ${challengeResults.filter(c => c.type === 'WEEKLY').length}`);
    console.log(`  - Mensuales:       ${challengeResults.filter(c => c.type === 'MONTHLY').length}`);
    console.log(`  - Especiales:      ${challengeResults.filter(c => c.type === 'SPECIAL').length}`);
    console.log(`  - Únicos:          ${challengeResults.filter(c => c.type === 'ONE_TIME').length}`);
    console.log();
    console.log(`Recompensas creadas: ${rewardResults.length}`);
    console.log(`  - Descuentos:      ${rewardResults.filter(r => r.type === 'DISCOUNT').length}`);
    console.log(`  - Envío gratis:    ${rewardResults.filter(r => r.type === 'FREE_SHIPPING').length}`);
    console.log(`  - Acceso exclusivo:${rewardResults.filter(r => r.type === 'EXCLUSIVE_ACCESS').length}`);
    console.log(`  - Recompensas físicas: ${rewardResults.filter(r => r.type === 'PHYSICAL_REWARD').length}`);
    console.log(`  - Destacadas:      ${rewardResults.filter(r => r.featured).length}`);
    console.log('═'.repeat(50));
    console.log();
    console.log('🎉 ¡Inicialización completada exitosamente!');
    console.log();
    console.log('💡 PRÓXIMOS PASOS:');
    console.log('   1. Los usuarios automáticamente verán badges disponibles');
    console.log('   2. Los challenges se pueden activar/participar mediante API');
    console.log('   3. Las recompensas están listas para canje en el catálogo');
    console.log('   4. El sistema de tiers progresará automáticamente con puntos');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
