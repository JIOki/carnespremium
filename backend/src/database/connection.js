const { PrismaClient } = require('@prisma/client');

let prisma;

/**
 * Obtiene la instancia de Prisma Client
 * Implementa patrón singleton
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Middleware para logging personalizado
    prisma.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Query ${params.model}.${params.action} tomó ${after - before}ms`);
      }
      
      return result;
    });
  }
  
  return prisma;
}

/**
 * Inicializa la conexión a la base de datos
 */
async function initializeDatabase() {
  try {
    const prismaClient = getPrismaClient();
    
    // Verificar conexión
    await prismaClient.$connect();
    console.log('Conexión a PostgreSQL establecida');
    
    // Verificar que las tablas existen
    const userCount = await prismaClient.user.count();
    console.log(`Base de datos inicializada (${userCount} usuarios)`);
    
    return prismaClient;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
}

/**
 * Cierra la conexión a la base de datos
 */
async function disconnectDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    console.log('Conexión a base de datos cerrada');
  }
}

/**
 * Función helper para transacciones
 */
async function transaction(callback) {
  const prismaClient = getPrismaClient();
  return await prismaClient.$transaction(callback);
}

/**
 * Función helper para queries raw
 */
async function rawQuery(query, params = []) {
  const prismaClient = getPrismaClient();
  return await prismaClient.$queryRawUnsafe(query, ...params);
}

/**
 * Función helper para queries geoespaciales
 */
async function geoQuery(latitude, longitude, radiusKm = 10) {
  const prismaClient = getPrismaClient();
  
  // Query para encontrar direcciones dentro del radio especificado
  return await prismaClient.$queryRaw`
    SELECT *, 
      (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(${longitude})) + 
      sin(radians(${latitude})) * sin(radians(latitude)))) AS distance
    FROM addresses 
    HAVING distance < ${radiusKm}
    ORDER BY distance;
  `;
}

module.exports = {
  getPrismaClient,
  initializeDatabase,
  disconnectDatabase,
  transaction,
  rawQuery,
  geoQuery
};