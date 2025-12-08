const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear categorías
  console.log('📁 Creando categorías...');
  const categorias = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Cortes Premium' },
      update: {},
      create: {
        name: 'Cortes Premium',
        description: 'Los mejores cortes de carne con la más alta calidad',
        image: '/images/categories/premium.jpg',
        sortOrder: 1
      }
    }),
    prisma.category.upsert({
      where: { name: 'Cortes Populares' },
      update: {},
      create: {
        name: 'Cortes Populares',
        description: 'Cortes tradicionales para toda la familia',
        image: '/images/categories/populares.jpg',
        sortOrder: 2
      }
    }),
    prisma.category.upsert({
      where: { name: 'Para Parrilla' },
      update: {},
      create: {
        name: 'Para Parrilla',
        description: 'Cortes ideales para asados y parrilladas',
        image: '/images/categories/parrilla.jpg',
        sortOrder: 3
      }
    }),
    prisma.category.upsert({
      where: { name: 'Carne Molida' },
      update: {},
      create: {
        name: 'Carne Molida',
        description: 'Carne molida fresca de diferentes tipos',
        image: '/images/categories/molida.jpg',
        sortOrder: 4
      }
    }),
    prisma.category.upsert({
      where: { name: 'Cerdo' },
      update: {},
      create: {
        name: 'Cerdo',
        description: 'Cortes selectos de cerdo',
        image: '/images/categories/cerdo.jpg',
        sortOrder: 5
      }
    }),
    prisma.category.upsert({
      where: { name: 'Pollo' },
      update: {},
      create: {
        name: 'Pollo',
        description: 'Pollo fresco y cortes especiales',
        image: '/images/categories/pollo.jpg',
        sortOrder: 6
      }
    })
  ]);

  console.log(`✅ ${categorias.length} categorías creadas`);

  // Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...');
  
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const usuarios = await Promise.all([
    // Usuario administrador
    prisma.user.upsert({
      where: { email: 'admin@carnespremiium.com' },
      update: {},
      create: {
        name: 'Administrador',
        email: 'admin@carnespremiium.com',
        password: hashedPassword,
        phone: '+52 55 1234 5678',
        role: 'ADMIN',
        admin: {
          create: {
            department: 'Administración',
            permissions: {
              manage_products: true,
              manage_orders: true,
              manage_users: true,
              view_analytics: true
            }
          }
        }
      }
    }),
    // Cliente de prueba
    prisma.user.upsert({
      where: { email: 'cliente@test.com' },
      update: {},
      create: {
        name: 'Cliente Prueba',
        email: 'cliente@test.com',
        password: hashedPassword,
        phone: '+52 55 9876 5432',
        role: 'CUSTOMER',
        customer: {
          create: {
            loyaltyTier: 'BRONZE'
          }
        },
        loyalty: {
          create: {
            totalPoints: 100,
            availablePoints: 100
          }
        }
      }
    }),
    // Repartidor de prueba
    prisma.user.upsert({
      where: { email: 'repartidor@test.com' },
      update: {},
      create: {
        name: 'Repartidor Prueba',
        email: 'repartidor@test.com',
        password: hashedPassword,
        phone: '+52 55 5555 1234',
        role: 'DRIVER',
        driver: {
          create: {
            licenseNumber: 'LIC123456789',
            vehicleType: 'Motocicleta',
            vehiclePlate: 'ABC-123',
            maxCapacity: 50.0,
            rating: 4.8,
            totalDeliveries: 150,
            isAvailable: true
          }
        }
      }
    })
  ]);

  console.log(`✅ ${usuarios.length} usuarios creados`);

  // Crear direcciones de prueba
  console.log('📍 Creando direcciones de prueba...');
  
  const cliente = await prisma.user.findUnique({
    where: { email: 'cliente@test.com' }
  });

  if (cliente) {
    await prisma.address.createMany({
      data: [
        {
          userId: cliente.id,
          name: 'Casa',
          street: 'Av. Reforma',
          number: '123',
          colony: 'Centro',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06000',
          country: 'México',
          latitude: 19.4326,
          longitude: -99.1332,
          isDefault: true,
          instructions: 'Casa color blanca, portón negro'
        },
        {
          userId: cliente.id,
          name: 'Oficina',
          street: 'Paseo de la Reforma',
          number: '456',
          colony: 'Juárez',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '06600',
          country: 'México',
          latitude: 19.4285,
          longitude: -99.1277,
          isDefault: false,
          instructions: 'Edificio corporativo, piso 10'
        }
      ]
    });
  }

  // Crear productos de ejemplo
  console.log('🥩 Creando productos...');

  const productos = [];

  // Cortes Premium
  const premiumCategory = categorias.find(c => c.name === 'Cortes Premium');
  if (premiumCategory) {
    const premiumProducts = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Ribeye Angus',
          description: 'Delicioso ribeye de res Angus con marmoleo excepcional. Ideal para parrilla o sartén. Nuestros ribeyes son seleccionados cuidadosamente para garantizar la mejor experiencia culinaria.',
          shortDescription: 'Ribeye premium de res Angus con excelente marmoleo',
          categoryId: premiumCategory.id,
          sku: 'RIB-ANG-001',
          price: 450.00,
          comparePrice: 520.00,
          costPrice: 280.00,
          weight: 300,
          unit: 'g',
          stock: 25,
          lowStockAlert: 5,
          isFeatured: true,
          tags: ['premium', 'angus', 'parrilla', 'ribeye'],
          cut: 'Ribeye',
          grade: 'Premium',
          origin: 'Sonora',
          marbling: 'Alto',
          aging: '21 días',
          nutritionalInfo: {
            calories: 250,
            protein: 26,
            fat: 16,
            carbs: 0
          },
          storageInfo: 'Mantener refrigerado entre 0°C y 4°C',
          preparationTips: 'Sacar de refrigeración 30 minutos antes de cocinar. Sellar a fuego alto por ambos lados.',
          seoTitle: 'Ribeye Angus Premium - Corte de Res de Alta Calidad',
          seoDescription: 'Compra ribeye Angus premium con marmoleo excepcional. Envío a domicilio en CDMX.',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/ribeye-angus-1.jpg',
                  altText: 'Ribeye Angus crudo mostrando marmoleo',
                  isPrimary: true,
                  sortOrder: 1
                },
                {
                  url: '/images/products/ribeye-angus-2.jpg',
                  altText: 'Ribeye Angus cocido en parrilla',
                  isPrimary: false,
                  sortOrder: 2
                }
              ]
            }
          },
          variants: {
            createMany: {
              data: [
                {
                  name: '300g',
                  sku: 'RIB-ANG-300',
                  price: 450.00,
                  stock: 25,
                  weight: 300,
                  sortOrder: 1
                },
                {
                  name: '400g',
                  sku: 'RIB-ANG-400',
                  price: 580.00,
                  stock: 20,
                  weight: 400,
                  sortOrder: 2
                },
                {
                  name: '500g',
                  sku: 'RIB-ANG-500',
                  price: 720.00,
                  stock: 15,
                  weight: 500,
                  sortOrder: 3
                }
              ]
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          name: 'Filete New York',
          description: 'Filete New York de res premium, conocido por su textura firme y sabor intenso. Perfecto para los amantes de la carne bien definida.',
          shortDescription: 'Filete New York de textura firme y sabor intenso',
          categoryId: premiumCategory.id,
          sku: 'NY-FIL-001',
          price: 380.00,
          comparePrice: 420.00,
          costPrice: 220.00,
          weight: 250,
          unit: 'g',
          stock: 30,
          lowStockAlert: 8,
          isFeatured: true,
          tags: ['premium', 'filete', 'new york', 'parrilla'],
          cut: 'New York',
          grade: 'Premium',
          origin: 'Chihuahua',
          marbling: 'Medio',
          aging: '14 días',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/ny-strip-1.jpg',
                  altText: 'Filete New York crudo',
                  isPrimary: true,
                  sortOrder: 1
                }
              ]
            }
          }
        }
      })
    ]);
    productos.push(...premiumProducts);
  }

  // Cortes Populares
  const popularCategory = categorias.find(c => c.name === 'Cortes Populares');
  if (popularCategory) {
    const popularProducts = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Bistec de Res',
          description: 'Bistec tradicional de res, ideal para guisar o freír. Corte versátil y económico para comidas familiares.',
          shortDescription: 'Bistec tradicional versátil y económico',
          categoryId: popularCategory.id,
          sku: 'BIS-RES-001',
          price: 180.00,
          costPrice: 120.00,
          weight: 200,
          unit: 'g',
          stock: 50,
          lowStockAlert: 15,
          isFeatured: false,
          tags: ['bistec', 'económico', 'familiar', 'versátil'],
          cut: 'Bistec',
          grade: 'Estándar',
          origin: 'Estado de México',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/bistec-res-1.jpg',
                  altText: 'Bistec de res fresco',
                  isPrimary: true,
                  sortOrder: 1
                }
              ]
            }
          }
        }
      }),
      prisma.product.create({
        data: {
          name: 'Falda de Res',
          description: 'Falda de res perfecta para fajitas y tacos. Con gran sabor y textura ideal para marinados.',
          shortDescription: 'Falda ideal para fajitas y tacos',
          categoryId: popularCategory.id,
          sku: 'FAL-RES-001',
          price: 220.00,
          costPrice: 140.00,
          weight: 300,
          unit: 'g',
          stock: 40,
          lowStockAlert: 10,
          isFeatured: false,
          tags: ['falda', 'fajitas', 'tacos', 'marinado'],
          cut: 'Falda',
          grade: 'Estándar',
          origin: 'Jalisco',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/falda-res-1.jpg',
                  altText: 'Falda de res para fajitas',
                  isPrimary: true,
                  sortOrder: 1
                }
              ]
            }
          }
        }
      })
    ]);
    productos.push(...popularProducts);
  }

  // Para Parrilla
  const parrillaCategory = categorias.find(c => c.name === 'Para Parrilla');
  if (parrillaCategory) {
    const parrillaProducts = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Arrachera Marinada',
          description: 'Arrachera premium marinada con especias secretas. Lista para la parrilla, jugosa y llena de sabor.',
          shortDescription: 'Arrachera marinada lista para parrilla',
          categoryId: parrillaCategory.id,
          sku: 'ARR-MAR-001',
          price: 320.00,
          costPrice: 200.00,
          weight: 400,
          unit: 'g',
          stock: 35,
          lowStockAlert: 8,
          isFeatured: true,
          tags: ['arrachera', 'marinada', 'parrilla', 'asado'],
          cut: 'Arrachera',
          grade: 'Premium',
          origin: 'Nuevo León',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/arrachera-1.jpg',
                  altText: 'Arrachera marinada lista para cocinar',
                  isPrimary: true,
                  sortOrder: 1
                }
              ]
            }
          }
        }
      })
    ]);
    productos.push(...parrillaProducts);
  }

  // Carne Molida
  const molidaCategory = categorias.find(c => c.name === 'Carne Molida');
  if (molidaCategory) {
    const molidaProducts = await Promise.all([
      prisma.product.create({
        data: {
          name: 'Carne Molida de Res 80/20',
          description: 'Carne molida fresca con 80% carne magra y 20% grasa. Perfecta para hamburguesas, albóndigas y guisos.',
          shortDescription: 'Carne molida fresca 80% magra',
          categoryId: molidaCategory.id,
          sku: 'MOL-8020-001',
          price: 150.00,
          costPrice: 95.00,
          weight: 500,
          unit: 'g',
          stock: 60,
          lowStockAlert: 20,
          isFeatured: false,
          tags: ['molida', 'hamburguesas', 'albóndigas', 'fresca'],
          cut: 'Molida',
          grade: 'Estándar',
          origin: 'México',
          images: {
            createMany: {
              data: [
                {
                  url: '/images/products/carne-molida-1.jpg',
                  altText: 'Carne molida fresca 80/20',
                  isPrimary: true,
                  sortOrder: 1
                }
              ]
            }
          }
        }
      })
    ]);
    productos.push(...molidaProducts);
  }

  console.log(`✅ ${productos.length} productos creados`);

  // Crear algunas reseñas de ejemplo
  console.log('⭐ Creando reseñas de prueba...');
  
  if (productos.length > 0 && cliente) {
    await Promise.all([
      prisma.review.create({
        data: {
          userId: cliente.id,
          productId: productos[0].id,
          rating: 5,
          title: 'Excelente calidad',
          comment: 'El ribeye estaba perfecto, muy buen marmoleo y sabor increíble. Lo volveré a comprar.',
          isVerified: true
        }
      }),
      prisma.review.create({
        data: {
          userId: cliente.id,
          productId: productos[0].id,
          rating: 4,
          title: 'Muy bueno',
          comment: 'Buena calidad, aunque llegó un poco más cocido de lo que esperaba.',
          isVerified: true
        }
      })
    ]);
  }

  // Crear configuraciones del sistema
  console.log('⚙️ Creando configuraciones del sistema...');
  await Promise.all([
    prisma.systemConfig.upsert({
      where: { key: 'free_shipping_threshold' },
      update: { value: '500' },
      create: {
        key: 'free_shipping_threshold',
        value: '500',
        type: 'number',
        category: 'shipping'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'tax_rate' },
      update: { value: '0.16' },
      create: {
        key: 'tax_rate',
        value: '0.16',
        type: 'number',
        category: 'pricing'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'default_shipping_cost' },
      update: { value: '50' },
      create: {
        key: 'default_shipping_cost',
        value: '50',
        type: 'number',
        category: 'shipping'
      }
    }),
    prisma.systemConfig.upsert({
      where: { key: 'points_per_peso' },
      update: { value: '0.1' },
      create: {
        key: 'points_per_peso',
        value: '0.1',
        type: 'number',
        category: 'loyalty'
      }
    })
  ]);

  // Crear planes de suscripción
  console.log('💳 Creando planes de suscripción...');
  await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { name: 'Caja Familiar Semanal' },
      update: {},
      create: {
        name: 'Caja Familiar Semanal',
        description: 'Caja con cortes variados para una familia de 4 personas',
        price: 800.00,
        billingCycle: 'weekly',
        features: {
          delivery_frequency: 'Entrega semanal',
          variety: '5-6 tipos de corte diferentes',
          quantity: '2-3 kg de carne variada',
          customization: 'Personalización básica'
        }
      }
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: 'Box Parrillero Mensual' },
      update: {},
      create: {
        name: 'Box Parrillero Mensual',
        description: 'Selección especial de cortes premium para asados',
        price: 1500.00,
        billingCycle: 'monthly',
        features: {
          delivery_frequency: 'Entrega mensual',
          variety: 'Cortes premium para parrilla',
          quantity: '4-5 kg de cortes selectos',
          extras: 'Incluye especias y marinados'
        }
      }
    })
  ]);

  console.log('✅ Seed completado exitosamente!');
  
  console.log('\n🔐 Usuarios creados:');
  console.log('Admin: admin@carnespremiium.com / password123');
  console.log('Cliente: cliente@test.com / password123');
  console.log('Repartidor: repartidor@test.com / password123');
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