import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean database
  console.log('🗑️  Cleaning database...');
  await prisma.review.deleteMany();
  await prisma.detalle_pedido.deleteMany();
  await prisma.pedido_address.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cart_item.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.address.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productContainer.deleteMany();
  await prisma.category.deleteMany();
  await prisma.marca.deleteMany();
  await prisma.unidad.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ecommerce.com',
      username: 'Admin',
      password: hashedPassword,
      phones: '3001234567',
      role: Role.ADMIN,
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: 'seller1@ecommerce.com',
      username: 'Vendedor 1',
      password: hashedPassword,
      phones: '3001234568',
      role: Role.SELLER,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@ecommerce.com',
      username: 'Vendedor 2',
      password: hashedPassword,
      phones: '3001234569',
      role: Role.SELLER,
    },
  });

  const buyer1 = await prisma.user.create({
    data: {
      email: 'buyer1@ecommerce.com',
      username: 'Comprador 1',
      password: hashedPassword,
      phones: '3001234570',
      role: Role.BUYER,
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@ecommerce.com',
      username: 'Comprador 2',
      password: hashedPassword,
      phones: '3001234571',
      role: Role.BUYER,
    },
  });

  // Create Unidades
  console.log('📏 Creating unidades...');
  const unidadKg = await prisma.unidad.create({ data: { nombre: 'Kilogramo' } });
  const unidadUnd = await prisma.unidad.create({ data: { nombre: 'Unidad' } });
  const unidadLt = await prisma.unidad.create({ data: { nombre: 'Litro' } });

  // Create Marcas
  console.log('🏷️  Creating marcas...');
  const marcaNike = await prisma.marca.create({ data: { nombre: 'Nike' } });
  const marcaAdidas = await prisma.marca.create({ data: { nombre: 'Adidas' } });
  const marcaSamsung = await prisma.marca.create({ data: { nombre: 'Samsung' } });
  const marcaApple = await prisma.marca.create({ data: { nombre: 'Apple' } });

  // Create Categories
  console.log('📂 Creating categories...');
  const catElectronics = await prisma.category.create({
    data: { name: 'Electrónica', slug: 'electronica' },
  });
  const catClothing = await prisma.category.create({
    data: { name: 'Ropa', slug: 'ropa' },
  });
  const catSports = await prisma.category.create({
    data: { name: 'Deportes', slug: 'deportes', parentId: catClothing.id },
  });
  const catPhones = await prisma.category.create({
    data: { name: 'Celulares', slug: 'celulares', parentId: catElectronics.id },
  });

  // Create Product Containers
  console.log('📦 Creating product containers...');
  const container1 = await prisma.productContainer.create({
    data: { name: 'Tienda Principal', userId: seller1.id },
  });
  const container2 = await prisma.productContainer.create({
    data: { name: 'Almacén Secundario', userId: seller2.id },
  });

  // Create Products
  console.log('🛍️  Creating products...');
  const product1 = await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro',
      sku: 'IPH15PRO-001',
      quantity: 50,
      price: 4999000,
      minStock: 5,
      isActive: true,
      description: 'El último iPhone con procesador A17 Pro, cámara de 48MP y pantalla Super Retina XDR',
      containerId: container1.id,
      unidadId: unidadUnd.id,
      marcaId: marcaApple.id,
      ProductCategory: {
        create: [{ categoryId: catElectronics.id }, { categoryId: catPhones.id }],
      },
      ProductImage: {
        create: [
          {
            base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+aVBob25lIDE1IFBybzwvdGV4dD48L3N2Zz4=',
            alt: 'iPhone 15 Pro',
            position: 0,
          },
        ],
      },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra',
      sku: 'SGS24U-001',
      quantity: 30,
      price: 4499000,
      minStock: 5,
      isActive: true,
      description: 'Samsung Galaxy con S Pen incluido, cámara de 200MP y pantalla Dynamic AMOLED 2X',
      containerId: container2.id,
      unidadId: unidadUnd.id,
      marcaId: marcaSamsung.id,
      ProductCategory: {
        create: [{ categoryId: catElectronics.id }, { categoryId: catPhones.id }],
      },
      ProductImage: {
        create: [
          {
            base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwN2RiMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+R2FsYXh5IFMyNCBVbHRyYTwvdGV4dD48L3N2Zz4=',
            alt: 'Samsung Galaxy S24 Ultra',
            position: 0,
          },
        ],
      },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Nike Air Max 270',
      sku: 'NKAM270-001',
      quantity: 100,
      price: 459000,
      minStock: 10,
      isActive: true,
      description: 'Zapatillas deportivas Nike con tecnología Air Max, cómodas y elegantes',
      containerId: container1.id,
      unidadId: unidadUnd.id,
      marcaId: marcaNike.id,
      ProductCategory: {
        create: [{ categoryId: catClothing.id }, { categoryId: catSports.id }],
      },
      ProductImage: {
        create: [
          {
            base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmNjYwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TmlrZSBBaXIgTWF4IDI3MDwvdGV4dD48L3N2Zz4=',
            alt: 'Nike Air Max 270',
            position: 0,
          },
        ],
      },
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Adidas Ultraboost 22',
      sku: 'ADUB22-001',
      quantity: 80,
      price: 689000,
      minStock: 10,
      isActive: true,
      description: 'Zapatillas de running Adidas con tecnología Boost para mayor comodidad y rendimiento',
      containerId: container2.id,
      unidadId: unidadUnd.id,
      marcaId: marcaAdidas.id,
      ProductCategory: {
        create: [{ categoryId: catClothing.id }, { categoryId: catSports.id }],
      },
      ProductImage: {
        create: [
          {
            base64: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+VWx0cmFib29zdCAyMjwvdGV4dD48L3N2Zz4=',
            alt: 'Adidas Ultraboost 22',
            position: 0,
          },
        ],
      },
    },
  });

  // Create Addresses
  console.log('📍 Creating addresses...');
  await prisma.address.create({
    data: {
      userId: buyer1.id,
      name: 'Casa',
      fullName: 'Juan Pérez',
      phone: '3001234570',
      line1: 'Calle 123 #45-67',
      line2: 'Apto 301',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'CO',
      zip: '110111',
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: buyer2.id,
      name: 'Oficina',
      fullName: 'María García',
      phone: '3001234571',
      line1: 'Carrera 7 #32-10',
      city: 'Medellín',
      state: 'Antioquia',
      country: 'CO',
      zip: '050021',
      isDefault: true,
    },
  });

  // Create Reviews
  console.log('⭐ Creating reviews...');
  await prisma.review.create({
    data: {
      userId: buyer1.id,
      productId: product1.id,
      rating: 5,
      comment: 'Excelente teléfono, muy rápido y con una cámara increíble',
    },
  });

  await prisma.review.create({
    data: {
      userId: buyer2.id,
      productId: product1.id,
      rating: 4,
      comment: 'Muy buen producto, pero un poco costoso',
    },
  });

  await prisma.review.create({
    data: {
      userId: buyer1.id,
      productId: product3.id,
      rating: 5,
      comment: 'Las zapatillas más cómodas que he tenido',
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log('\n📊 Created:');
  console.log(`  - ${5} users (1 admin, 2 sellers, 2 buyers)`);
  console.log(`  - ${3} unidades`);
  console.log(`  - ${4} marcas`);
  console.log(`  - ${4} categories`);
  console.log(`  - ${2} product containers`);
  console.log(`  - ${4} products`);
  console.log(`  - ${2} addresses`);
  console.log(`  - ${3} reviews`);
  console.log('\n🔑 Login credentials:');
  console.log('  Admin: admin@ecommerce.com / password123');
  console.log('  Seller 1: seller1@ecommerce.com / password123');
  console.log('  Seller 2: seller2@ecommerce.com / password123');
  console.log('  Buyer 1: buyer1@ecommerce.com / password123');
  console.log('  Buyer 2: buyer2@ecommerce.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
