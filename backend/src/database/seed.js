const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear categorías
  console.log('📁 Creando categorías...');
  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'cortes-premium' },
      update: {},
      create: {
        name: 'Cortes Premium',
        slug: 'cortes-premium',
        description: 'Los mejores cortes de carne con la más alta calidad',
        imageUrl: '/images/categories/premium.jpg',
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { slug: 'cortes-populares' },
      update: {},
      create: {
        name: 'Cortes Populares',
        slug: 'cortes-populares',
        description: 'Cortes tradicionales para toda la familia',
        imageUrl: '/images/categories/populares.jpg',
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { slug: 'para-parrilla' },
      update: {},
      create: {
        name: 'Para Parrilla',
        slug: 'para-parrilla',
        description: 'Cortes ideales para asados y parrilladas',
        imageUrl: '/images/categories/parrilla.jpg',
        sortOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { slug: 'cerdo' },
      update: {},
      create: {
        name: 'Cerdo',
        slug: 'cerdo',
        description: 'Cortes selectos de cerdo',
        imageUrl: '/images/categories/cerdo.jpg',
        sortOrder: 4
      }
    }),
    prisma.category.upsert({
      where: { slug: 'pollo' },
      update: {},
      create: {
        name: 'Pollo',
        slug: 'pollo',
        description: 'Pollo fresco y cortes especiales',
        imageUrl: '/images/categories/pollo.jpg',
        sortOrder: 5
      }
    })
  ]);
  console.log(`✅ ${categorias.length} categorías creadas`);

  // Crear usuarios
  console.log('👥 Creando usuarios de prueba...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const usuarios = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Admin Test',
        email: 'admin@test.com',
        password: hashedPassword,
        phone: '+52 55 1234 5678',
        role: 'ADMIN'
      }
    }),
    prisma.user.upsert({
      where: { email: 'cliente@test.com' },
      update: {},
      create: {
        name: 'Cliente Prueba',
        email: 'cliente@test.com',
        password: hashedPassword,
        phone: '+52 55 9876 5432',
        role: 'CUSTOMER'
      }
    })
  ]);
  console.log(`✅ ${usuarios.length} usuarios creados`);

  // Crear productos
  console.log('🥩 Creando productos...');
  const premiumCategory = categorias[0];
  
  const productos = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'ribeye-angus' },
      update: {},
      create: {
        name: 'Ribeye Angus',
        slug: 'ribeye-angus',
        description: 'Delicioso ribeye de res Angus con marmoleo excepcional',
        shortDesc: 'Ribeye premium con excelente marmoleo',
        sku: 'RIB-ANG-001',
        categoryId: premiumCategory.id,
        imageUrl: '/images/products/ribeye.jpg',
        isFeatured: true,
        weight: 0.3,
        unit: 'kg',
        origin: 'Sonora',
        variants: {
          create: [
            { name: '300g', sku: 'RIB-300', price: 450, stock: 25, weight: 0.3, isDefault: true },
            { name: '400g', sku: 'RIB-400', price: 580, stock: 20, weight: 0.4 },
            { name: '500g', sku: 'RIB-500', price: 720, stock: 15, weight: 0.5 }
          ]
        }
      }
    }),
    prisma.product.upsert({
      where: { slug: 'filete-new-york' },
      update: {},
      create: {
        name: 'Filete New York',
        slug: 'filete-new-york',
        description: 'Filete New York de res premium, textura firme y sabor intenso',
        shortDesc: 'Filete de textura firme',
        sku: 'NY-FIL-001',
        categoryId: premiumCategory.id,
        imageUrl: '/images/products/new-york.jpg',
        isFeatured: true,
        weight: 0.25,
        unit: 'kg',
        origin: 'Chihuahua',
        variants: {
          create: [
            { name: '250g', sku: 'NY-250', price: 380, stock: 30, weight: 0.25, isDefault: true },
            { name: '350g', sku: 'NY-350', price: 520, stock: 25, weight: 0.35 }
          ]
        }
      }
    }),
    prisma.product.upsert({
      where: { slug: 'arrachera-marinada' },
      update: {},
      create: {
        name: 'Arrachera Marinada',
        slug: 'arrachera-marinada',
        description: 'Arrachera premium marinada con especias. Lista para la parrilla',
        shortDesc: 'Arrachera lista para parrilla',
        sku: 'ARR-MAR-001',
        categoryId: categorias[2].id,
        imageUrl: '/images/products/arrachera.jpg',
        isFeatured: true,
        weight: 0.4,
        unit: 'kg',
        origin: 'Nuevo León',
        variants: {
          create: [
            { name: '400g', sku: 'ARR-400', price: 320, stock: 35, weight: 0.4, isDefault: true },
            { name: '600g', sku: 'ARR-600', price: 470, stock: 25, weight: 0.6 }
          ]
        }
      }
    }),
    prisma.product.upsert({
      where: { slug: 'bistec-res' },
      update: {},
      create: {
        name: 'Bistec de Res',
        slug: 'bistec-res',
        description: 'Bistec tradicional de res, ideal para guisar o freír',
        shortDesc: 'Bistec tradicional',
        sku: 'BIS-RES-001',
        categoryId: categorias[1].id,
        imageUrl: '/images/products/bistec.jpg',
        weight: 0.5,
        unit: 'kg',
        origin: 'México',
        variants: {
          create: [
            { name: '500g', sku: 'BIS-500', price: 180, stock: 50, weight: 0.5, isDefault: true },
            { name: '1kg', sku: 'BIS-1000', price: 340, stock: 30, weight: 1.0 }
          ]
        }
      }
    })
  ]);
  console.log(`✅ ${productos.length} productos creados`);

  console.log('\n✅ Seed completado exitosamente!');
  console.log('\n🔐 Usuarios de prueba:');
  console.log('  Admin: admin@test.com / password123');
  console.log('  Cliente: cliente@test.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });