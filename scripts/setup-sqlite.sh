#!/bin/bash

echo "🥩 Instalación SQLite de Carnes Premium"
echo "======================================"

cd /workspace/backend

echo "[1/3] Configurando base de datos SQLite..."
# Usar el schema compatible con SQLite
cp prisma/schema.sqlite.prisma prisma/schema.prisma
cp .env.dev .env

# Generar cliente Prisma
npx prisma generate
echo "✅ Cliente Prisma generado"

# Crear la base de datos
npx prisma db push
echo "✅ Base de datos SQLite creada"

echo "[2/3] Creando datos de prueba..."
# Crear un seed simplificado
cat > src/database/seed-simple.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@carnes.com' },
    update: {},
    create: {
      email: 'admin@carnes.com',
      password: hashedPassword,
      name: 'Admin Carnes',
      role: 'ADMIN',
      phone: '+1234567890'
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'cliente@test.com' },
    update: {},
    create: {
      email: 'cliente@test.com',
      password: await bcrypt.hash('cliente123', 10),
      name: 'Cliente de Prueba',
      role: 'CUSTOMER',
      phone: '+1234567891'
    }
  });

  // Crear categoría
  const category = await prisma.category.upsert({
    where: { slug: 'carnes-rojas' },
    update: {},
    create: {
      name: 'Carnes Rojas',
      slug: 'carnes-rojas',
      description: 'Las mejores carnes rojas premium'
    }
  });

  // Crear productos
  const product1 = await prisma.product.upsert({
    where: { slug: 'carne-de-res-premium' },
    update: {},
    create: {
      name: 'Carne de Res Premium',
      slug: 'carne-de-res-premium',
      description: 'Carne de res de la mejor calidad',
      shortDesc: 'Res premium',
      sku: 'RES-001',
      categoryId: category.id,
      imageUrl: 'https://images.unsplash.com/photo-1588881362771-ce4cf8e69e0a?w=500',
      weight: 1.0,
      unit: 'kg',
      origin: 'Argentina'
    }
  });

  // Crear variante del producto
  await prisma.productVariant.upsert({
    where: { sku: 'RES-001-1KG' },
    update: {},
    create: {
      productId: product1.id,
      name: '1kg',
      sku: 'RES-001-1KG',
      price: 25.99,
      stock: 100,
      weight: 1.0,
      isDefault: true
    }
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

# Ejecutar el seed
node src/database/seed-simple.js
echo "✅ Datos de prueba creados"

echo "[3/3] Iniciando servidor backend..."
echo ""
echo "🎉 CONFIGURACIÓN COMPLETADA!"
echo "=========================="
echo "Para iniciar el backend:"
echo "  cd backend && npx nodemon src/server.js"
echo ""
echo "URLs:"
echo "  Backend API: http://localhost:3001"
echo "  Health Check: http://localhost:3001/health"
echo ""
echo "Usuarios de prueba:"
echo "  Admin: admin@carnes.com / admin123"
echo "  Cliente: cliente@test.com / cliente123"