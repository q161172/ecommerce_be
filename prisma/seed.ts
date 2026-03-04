import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

async function main() {
    console.log('Start seeding...');

    // Create an admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@maison.com' },
        update: {},
        create: {
            email: 'admin@maison.com',
            name: 'Admin Maison',
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log(`Admin user created: ${admin.email} (Password: admin123)`);

    // Create an explicit customer user for testing
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@maison.com' },
        update: {},
        create: {
            email: 'customer@maison.com',
            name: 'John Doe',
            password: customerPassword,
            role: 'CUSTOMER',
        },
    });
    console.log(`Customer user created: ${customer.email} (Password: customer123)`);

    // Empty categories and products
    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Create Categories
    const catOuterwear = await prisma.category.create({
        data: { name: 'Outerwear', slug: 'outerwear', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80' }
    });
    const catKnitwear = await prisma.category.create({
        data: { name: 'Knitwear', slug: 'knitwear', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80' }
    });
    const catSuits = await prisma.category.create({
        data: { name: 'Suits & Tailoring', slug: 'suits', image: 'https://images.unsplash.com/photo-1593030761756-1d82f254e0c4?w=500&q=80' }
    });
    console.log('Categories created');

    // Create Products
    const ptrenchoat = await prisma.product.create({
        data: {
            name: 'Classic Wool Trench Coat',
            slug: 'classic-wool-trench-coat',
            description: 'A timeless silhouette crafted from double-faced Italian wool. Featuring a double-breasted closure, storm flap, and belted waist for a distinguished look.',
            price: 12500000,
            comparePrice: 15000000,
            categoryId: catOuterwear.id,
            images: ['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80'],
            isFeatured: true,
            variants: {
                create: [
                    { size: 'M', color: 'Camel', stock: 15, sku: 'TRENCH-M-CAMEL' },
                    { size: 'L', color: 'Camel', stock: 20, sku: 'TRENCH-L-CAMEL' },
                    { size: 'XL', color: 'Camel', stock: 15, sku: 'TRENCH-XL-CAMEL' },
                ]
            }
        }
    });

    const pCashmere = await prisma.product.create({
        data: {
            name: 'Pure Cashmere Rollneck',
            slug: 'pure-cashmere-rollneck',
            description: 'Indulgent softness meets relaxed refinement. This 100% Mongolian cashmere rollneck provides unparalleled warmth without bulk.',
            price: 6800000,
            categoryId: catKnitwear.id,
            images: ['https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&q=80'],
            isFeatured: true,
            variants: {
                create: [
                    { size: 'S', color: 'Navy', stock: 10, sku: 'CASHMERE-S-NAVY' },
                    { size: 'M', color: 'Navy', stock: 20, sku: 'CASHMERE-M-NAVY' },
                    { size: 'L', color: 'Navy', stock: 10, sku: 'CASHMERE-L-NAVY' },
                ]
            }
        }
    });

    const pSuit = await prisma.product.create({
        data: {
            name: 'Charcoal Two-Piece Suit',
            slug: 'charcoal-two-piece-suit',
            description: 'The foundation of a formal wardrobe. Expertly tailored in a modern fit using premium worsted wool. Features a half-canvas construction for superior drape.',
            price: 18500000,
            categoryId: catSuits.id,
            images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'],
            isFeatured: false,
            variants: {
                create: [
                    { size: '48', color: 'Charcoal', stock: 5, sku: 'SUIT-48-CHARCOAL' },
                    { size: '50', color: 'Charcoal', stock: 10, sku: 'SUIT-50-CHARCOAL' },
                    { size: '52', color: 'Charcoal', stock: 10, sku: 'SUIT-52-CHARCOAL' },
                ]
            }
        }
    });
    console.log('Products created');

    // Add some fake reviews to the trench coat
    await prisma.review.create({
        data: {
            rating: 5,
            comment: 'An absolute masterpiece. The weight of the wool feels incredibly luxurious.',
            productId: ptrenchoat.id,
            userId: customer.id,
        }
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
