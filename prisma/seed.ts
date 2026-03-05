import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';

const slug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const mkVariants = (colors: string[], stocks = [15, 20, 15, 10]) =>
    ['S', 'M', 'L', 'XL'].flatMap((size, si) =>
        colors.map((color) => ({
            size, color,
            stock: stocks[si] ?? 10,
            sku: `${color.slice(0, 3).toUpperCase()}-${size}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        }))
    );

async function main() {
    console.log('🌱 Start seeding...');

    const adminPw = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@maison.com' }, update: {},
        create: { email: 'admin@maison.com', name: 'Admin Maison', password: adminPw, role: 'ADMIN' },
    });
    console.log(`✅ Admin: ${admin.email} / admin123`);

    const custPw = await bcrypt.hash('customer123', 10);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@maison.com' }, update: {},
        create: { email: 'customer@maison.com', name: 'Sophie Laurent', password: custPw, role: 'CUSTOMER' },
    });
    console.log(`✅ Customer: ${customer.email} / customer123`);

    await prisma.review.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    console.log('🧹 Cleared old data');

    // ─── Categories ────────────────────────────────────────────────────────────
    const catDefs = [
        { name: 'Trench Coats',    img: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80' },
        { name: 'Wool Coats',      img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80' },
        { name: 'Blazers',         img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80' },
        { name: 'Suits',           img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80' },
        { name: 'Knitwear',        img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80' },
        { name: 'Shirts',          img: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80' },
        { name: 'Trousers',        img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80' },
        { name: 'Jeans',           img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80' },
        { name: 'Dresses',         img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&q=80' },
        { name: 'Skirts',          img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80' },
        { name: 'Tops & Blouses',  img: 'https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=600&q=80' },
        { name: 'Jumpsuits',       img: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80' },
        { name: 'Activewear',      img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80' },
        { name: 'Swimwear',        img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80' },
        { name: 'Loungewear',      img: 'https://images.unsplash.com/photo-1617952986600-802ba8f9a9b8?w=600&q=80' },
        { name: 'Accessories',     img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80' },
        { name: 'Scarves & Wraps', img: 'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=600&q=80' },
        { name: 'Footwear',        img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80' },
        { name: 'Bags',            img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80' },
        { name: 'Formal Wear',     img: 'https://images.unsplash.com/photo-1532453288672-3a17ac36f32a?w=600&q=80' },
    ];

    const cats: Record<string, string> = {};
    for (const c of catDefs) {
        const cat = await prisma.category.create({
            data: { name: c.name, slug: slug(c.name), image: c.img, description: `Premium ${c.name.toLowerCase()} for the discerning wardrobe.` },
        });
        cats[c.name] = cat.id;
    }
    console.log(`✅ ${catDefs.length} categories created`);

    // ─── Products (unique image per product) ───────────────────────────────────
    type P = { name: string; cat: string; price: number; compare?: number | null; featured?: boolean; imgs: string[]; colors: string[] };

    const products: P[] = [
        // ── TRENCH COATS ──────────────────────────────────────────────────────
        { name: 'Classic Belted Trench Coat',         cat: 'Trench Coats', price: 12500000, compare: 15000000, featured: true,  colors: ['Camel', 'Black'],        imgs: ['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80'] },
        { name: 'Slim-Fit Double-Breasted Trench',    cat: 'Trench Coats', price: 11000000, compare: 13500000, featured: false, colors: ['Khaki', 'Beige'],        imgs: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80'] },
        { name: 'Oversized Cotton Trench',            cat: 'Trench Coats', price: 9500000,  compare: 11000000, featured: false, colors: ['Stone', 'Navy'],          imgs: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'] },
        { name: 'Waterproof Belted Trench',           cat: 'Trench Coats', price: 13200000, compare: null,     featured: false, colors: ['Camel', 'Black'],        imgs: ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=80'] },
        { name: 'Maxi Trench Coat',                   cat: 'Trench Coats', price: 15500000, compare: 18000000, featured: true,  colors: ['Camel', 'Ivory'],         imgs: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=80'] },
        { name: 'Short Trench Jacket',                cat: 'Trench Coats', price: 7500000,  compare: 9000000,  featured: false, colors: ['Beige', 'Olive'],         imgs: ['https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80'] },

        // ── WOOL COATS ────────────────────────────────────────────────────────
        { name: 'Double-Faced Wool Overcoat',         cat: 'Wool Coats', price: 16000000, compare: 20000000, featured: true,  colors: ['Camel', 'Charcoal'],      imgs: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80'] },
        { name: 'Bouclé Wool Coat',                   cat: 'Wool Coats', price: 14500000, compare: 17000000, featured: false, colors: ['Ecru', 'Black'],           imgs: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80'] },
        { name: 'Plaid Wool Cape Coat',               cat: 'Wool Coats', price: 13000000, compare: null,     featured: false, colors: ['Tartan'],                   imgs: ['https://images.unsplash.com/photo-1520975922882-10b96b1a7c5e?w=800&q=80'] },
        { name: 'Long Cashmere Overcoat',             cat: 'Wool Coats', price: 22000000, compare: 27000000, featured: true,  colors: ['Camel', 'Midnight'],       imgs: ['https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=800&q=80'] },
        { name: 'Belted Wool Wrap Coat',              cat: 'Wool Coats', price: 13800000, compare: 16000000, featured: false, colors: ['Camel', 'Navy'],            imgs: ['https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=800&q=80'] },
        { name: 'Merino Wool Peacoat',                cat: 'Wool Coats', price: 10500000, compare: 12500000, featured: false, colors: ['Navy', 'Black'],            imgs: ['https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=800&q=80'] },
        { name: 'Checked Wool A-Line Coat',           cat: 'Wool Coats', price: 12000000, compare: 14500000, featured: false, colors: ['Houndstooth'],              imgs: ['https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=800&q=80'] },

        // ── BLAZERS ───────────────────────────────────────────────────────────
        { name: 'Structured Linen Blazer',            cat: 'Blazers', price: 7500000,  compare: 9000000,  featured: true,  colors: ['Ivory', 'Navy', 'Sand'],   imgs: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'] },
        { name: 'Pinstripe Single-Breasted Blazer',   cat: 'Blazers', price: 8800000,  compare: null,     featured: false, colors: ['Charcoal', 'Navy'],          imgs: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80'] },
        { name: 'Checked Tweed Blazer',               cat: 'Blazers', price: 11000000, compare: 13000000, featured: true,  colors: ['Camel', 'Greige'],           imgs: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'] },
        { name: 'Velvet Evening Blazer',              cat: 'Blazers', price: 10500000, compare: null,     featured: false, colors: ['Midnight', 'Burgundy'],      imgs: ['https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80'] },
        { name: 'Cropped White Blazer',               cat: 'Blazers', price: 6800000,  compare: 8000000,  featured: false, colors: ['White', 'Black', 'Blush'],   imgs: ['https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80'] },
        { name: 'Oversized Boyfriend Blazer',         cat: 'Blazers', price: 7200000,  compare: 8500000,  featured: false, colors: ['Greige', 'Camel'],           imgs: ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800&q=80'] },
        { name: 'Double-Breasted Gold-Button Blazer', cat: 'Blazers', price: 9500000,  compare: 11500000, featured: false, colors: ['Navy', 'Stone'],             imgs: ['https://images.unsplash.com/photo-1516826957135-700dedea698c?w=800&q=80'] },

        // ── SUITS ─────────────────────────────────────────────────────────────
        { name: 'Charcoal Two-Piece Suit',            cat: 'Suits', price: 18500000, compare: 22000000, featured: true,  colors: ['Charcoal'],                     imgs: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'] },
        { name: 'Navy Slim-Fit Suit',                 cat: 'Suits', price: 17000000, compare: null,     featured: false, colors: ['Navy'],                          imgs: ['https://images.unsplash.com/photo-1560243563-062bfc001d68?w=800&q=80'] },
        { name: 'Linen Summer Suit',                  cat: 'Suits', price: 14000000, compare: 16500000, featured: false, colors: ['Sand', 'Ivory', 'Sky'],          imgs: ['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800&q=80'] },
        { name: 'Three-Piece Chalk-Stripe Suit',      cat: 'Suits', price: 24000000, compare: 28000000, featured: true,  colors: ['Charcoal', 'Navy'],             imgs: ['https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=800&q=80'] },
        { name: "Women's Tailored Power Suit",        cat: 'Suits', price: 16500000, compare: null,     featured: false, colors: ['Black', 'Ivory', 'Rust'],       imgs: ['https://images.unsplash.com/photo-1532453288672-3a17ac36f32a?w=800&q=80'] },

        // ── KNITWEAR ──────────────────────────────────────────────────────────
        { name: 'Pure Cashmere Rollneck',             cat: 'Knitwear', price: 6800000, compare: null,    featured: true,  colors: ['Navy', 'Camel', 'Ivory'],     imgs: ['https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=800&q=80'] },
        { name: 'Oversized Wool Crewneck Sweater',    cat: 'Knitwear', price: 4500000, compare: 5500000, featured: false, colors: ['Oatmeal', 'Rust', 'Forest'],   imgs: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'] },
        { name: 'Cable-Knit Fisherman Sweater',       cat: 'Knitwear', price: 5200000, compare: null,    featured: true,  colors: ['Ecru', 'Oatmeal'],             imgs: ['https://images.unsplash.com/photo-1617952986600-802ba8f9a9b8?w=800&q=80'] },
        { name: 'Ribbed Merino V-Neck Pullover',      cat: 'Knitwear', price: 3800000, compare: 4500000, featured: false, colors: ['Burgundy', 'Navy', 'Camel'],   imgs: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'] },
        { name: 'Ribbed Merino Cardigan',             cat: 'Knitwear', price: 4200000, compare: 5000000, featured: false, colors: ['Camel', 'Black', 'Blush'],     imgs: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80'] },
        { name: 'Chunky Knit Turtleneck',             cat: 'Knitwear', price: 4800000, compare: 5800000, featured: false, colors: ['Cream', 'Stone'],              imgs: ['https://images.unsplash.com/photo-1537832816519-689ad163239b?w=800&q=80'] },
        { name: 'Open-Front Mohair Cardigan',         cat: 'Knitwear', price: 5500000, compare: null,    featured: false, colors: ['Lilac', 'Mint', 'Peach'],      imgs: ['https://images.unsplash.com/photo-1470309864661-68328b2cd0a5?w=800&q=80'] },
        { name: 'Cotton-Linen Striped Sweater',       cat: 'Knitwear', price: 3200000, compare: 3900000, featured: false, colors: ['Ecru/Navy', 'Blue/White'],     imgs: ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80'] },

        // ── SHIRTS ────────────────────────────────────────────────────────────
        { name: 'Classic Oxford Shirt',               cat: 'Shirts', price: 2800000, compare: null,    featured: false, colors: ['White', 'Blue', 'Pink'],         imgs: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'] },
        { name: 'Oversized Silk Shirt',               cat: 'Shirts', price: 5500000, compare: 6500000, featured: true,  colors: ['Ivory', 'Blush', 'Sage'],        imgs: ['https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&q=80'] },
        { name: 'Poplin Button-Down Shirt',           cat: 'Shirts', price: 2500000, compare: 3000000, featured: false, colors: ['White', 'Light Blue'],           imgs: ['https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80'] },
        { name: 'Striped French Cuff Shirt',          cat: 'Shirts', price: 3500000, compare: null,    featured: false, colors: ['Blue/White', 'Pink/White'],      imgs: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'] },
        { name: 'Linen Camp Collar Shirt',            cat: 'Shirts', price: 3200000, compare: 3800000, featured: false, colors: ['Sand', 'Sage', 'White'],         imgs: ['https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80'] },
        { name: 'Satin Tie-Neck Blouse',              cat: 'Shirts', price: 4800000, compare: 5800000, featured: false, colors: ['Ivory', 'Blush', 'Black'],       imgs: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80'] },
        { name: 'Relaxed Chambray Shirt',             cat: 'Shirts', price: 3000000, compare: 3600000, featured: false, colors: ['Indigo', 'Light Blue'],          imgs: ['https://images.unsplash.com/photo-1620207418302-439b387441b0?w=800&q=80'] },

        // ── TROUSERS ──────────────────────────────────────────────────────────
        { name: 'Tailored Wool Trousers',             cat: 'Trousers', price: 5200000, compare: 6500000, featured: false, colors: ['Charcoal', 'Navy', 'Camel'],   imgs: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80'] },
        { name: 'Wide-Leg Crepe Trousers',            cat: 'Trousers', price: 4800000, compare: 5800000, featured: true,  colors: ['Black', 'Ivory', 'Camel'],     imgs: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'] },
        { name: 'Linen Drawstring Trousers',          cat: 'Trousers', price: 3800000, compare: null,    featured: false, colors: ['Ecru', 'Sage', 'Stone'],        imgs: ['https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80'] },
        { name: 'Pinstripe Trousers',                 cat: 'Trousers', price: 5500000, compare: 6500000, featured: false, colors: ['Navy', 'Charcoal'],             imgs: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'] },
        { name: 'Straight-Leg Ponte Trousers',        cat: 'Trousers', price: 4200000, compare: 5000000, featured: false, colors: ['Black', 'Navy', 'Burgundy'],   imgs: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'] },
        { name: 'Cropped Flared Trousers',            cat: 'Trousers', price: 4500000, compare: 5500000, featured: false, colors: ['Ivory', 'Navy'],                imgs: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80'] },

        // ── JEANS ─────────────────────────────────────────────────────────────
        { name: 'High-Rise Slim Jeans',               cat: 'Jeans', price: 3500000, compare: 4500000, featured: true,  colors: ['Indigo', 'Black'],               imgs: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80'] },
        { name: 'Wide-Leg Barrel Jeans',              cat: 'Jeans', price: 4200000, compare: null,    featured: false, colors: ['Washed Blue', 'Ecru'],           imgs: ['https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?w=800&q=80'] },
        { name: 'Straight-Cut Selvedge Jeans',        cat: 'Jeans', price: 5500000, compare: 6500000, featured: false, colors: ['Raw Indigo', 'Black'],           imgs: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80'] },
        { name: 'Mom Jeans',                          cat: 'Jeans', price: 3800000, compare: null,    featured: false, colors: ['Medium Wash', 'Black'],          imgs: ['https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800&q=80'] },
        { name: 'Distressed Slim Jeans',              cat: 'Jeans', price: 3200000, compare: 4000000, featured: false, colors: ['Light Wash'],                    imgs: ['https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80'] },

        // ── DRESSES ───────────────────────────────────────────────────────────
        { name: 'Silk Slip Dress',                    cat: 'Dresses', price: 8500000,  compare: 10000000, featured: true,  colors: ['Champagne', 'Black', 'Blush'],  imgs: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'] },
        { name: 'Broderie Anglaise Mini Dress',       cat: 'Dresses', price: 6200000,  compare: null,     featured: false, colors: ['White', 'Ecru'],                imgs: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80'] },
        { name: 'Pleated Midi Dress',                 cat: 'Dresses', price: 7500000,  compare: 9000000,  featured: false, colors: ['Dusty Rose', 'Slate', 'Olive'],  imgs: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'] },
        { name: 'Wrap Maxi Dress',                    cat: 'Dresses', price: 6800000,  compare: 8000000,  featured: true,  colors: ['Navy', 'White'],                imgs: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80'] },
        { name: 'Knit Column Dress',                  cat: 'Dresses', price: 7200000,  compare: null,     featured: false, colors: ['Black', 'Cream', 'Camel'],      imgs: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'] },
        { name: 'Satin Evening Gown',                 cat: 'Dresses', price: 15000000, compare: 18000000, featured: true,  colors: ['Champagne', 'Midnight'],        imgs: ['https://images.unsplash.com/photo-1508162462267-dba900861f8c?w=800&q=80'] },
        { name: 'Smocked Cotton Sundress',            cat: 'Dresses', price: 4200000,  compare: 5000000,  featured: false, colors: ['Sky', 'White', 'Yellow'],       imgs: ['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&q=80'] },
        { name: 'Tailored Shirt Dress',               cat: 'Dresses', price: 5800000,  compare: 7000000,  featured: false, colors: ['White', 'Camel'],               imgs: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'] },

        // ── SKIRTS ────────────────────────────────────────────────────────────
        { name: 'Pleated Satin Midi Skirt',           cat: 'Skirts', price: 5500000, compare: 6500000, featured: false, colors: ['Champagne', 'Black', 'Blush'],    imgs: ['https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80'] },
        { name: 'Asymmetric Leather Skirt',           cat: 'Skirts', price: 9500000, compare: null,    featured: true,  colors: ['Black', 'Cognac'],                imgs: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80'] },
        { name: 'A-Line Wool Midi Skirt',             cat: 'Skirts', price: 5000000, compare: 6000000, featured: false, colors: ['Camel', 'Charcoal', 'Navy'],      imgs: ['https://images.unsplash.com/photo-1593030761756-1d82f254e0c4?w=800&q=80'] },
        { name: 'Mini Denim Skirt',                   cat: 'Skirts', price: 2800000, compare: 3500000, featured: false, colors: ['Mid Wash', 'Black'],              imgs: ['https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=800&q=80'] },
        { name: 'Tiered Boho Maxi Skirt',             cat: 'Skirts', price: 4500000, compare: null,    featured: false, colors: ['Terracotta', 'Sage'],              imgs: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'] },
        { name: 'Pencil Skirt',                       cat: 'Skirts', price: 3800000, compare: 4500000, featured: false, colors: ['Black', 'Navy', 'Camel'],          imgs: ['https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=800&q=80'] },

        // ── TOPS & BLOUSES ────────────────────────────────────────────────────
        { name: 'Silk Cami Top',                      cat: 'Tops & Blouses', price: 3500000, compare: 4200000, featured: false, colors: ['Ivory', 'Black', 'Sage'], imgs: ['https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?w=800&q=80'] },
        { name: 'Broderie Eyelet Blouse',             cat: 'Tops & Blouses', price: 4200000, compare: null,    featured: false, colors: ['White', 'Blush'],           imgs: ['https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80'] },
        { name: 'Draped Crepe Top',                   cat: 'Tops & Blouses', price: 3800000, compare: 4600000, featured: false, colors: ['Camel', 'Black', 'Ivory'], imgs: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&q=80'] },
        { name: 'Puff-Sleeve Blouse',                 cat: 'Tops & Blouses', price: 3200000, compare: 3900000, featured: true,  colors: ['White', 'Sky', 'Blush'],    imgs: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80'] },
        { name: 'Crisp Fitted Tank Top',              cat: 'Tops & Blouses', price: 1800000, compare: 2200000, featured: false, colors: ['White', 'Black', 'Navy'],   imgs: ['https://images.unsplash.com/photo-1527719327859-c952b315e695?w=800&q=80'] },
        { name: 'Tie-Front Cropped Blouse',           cat: 'Tops & Blouses', price: 3000000, compare: null,    featured: false, colors: ['Ivory', 'Blush'],           imgs: ['https://images.unsplash.com/photo-1553830591-d8632a99e6ff?w=800&q=80'] },

        // ── JUMPSUITS ─────────────────────────────────────────────────────────
        { name: 'Wide-Leg Linen Jumpsuit',            cat: 'Jumpsuits', price: 7500000, compare: 9000000,  featured: true,  colors: ['Ecru', 'Navy', 'Sage'],       imgs: ['https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80'] },
        { name: 'Belted Crepe Jumpsuit',              cat: 'Jumpsuits', price: 8200000, compare: null,     featured: false, colors: ['Black', 'Camel'],              imgs: ['https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&q=80'] },
        { name: 'Sleeveless Utility Jumpsuit',        cat: 'Jumpsuits', price: 5500000, compare: 6500000,  featured: false, colors: ['Khaki', 'Black'],              imgs: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'] },
        { name: 'Silk Slip Jumpsuit',                 cat: 'Jumpsuits', price: 9000000, compare: 11000000, featured: false, colors: ['Champagne', 'Midnight'],       imgs: ['https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=800&q=80'] },

        // ── ACTIVEWEAR ────────────────────────────────────────────────────────
        { name: 'High-Waist Yoga Leggings',           cat: 'Activewear', price: 2800000, compare: 3500000, featured: false, colors: ['Black', 'Navy', 'Olive'],     imgs: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80'] },
        { name: 'Seamless Sports Bra',                cat: 'Activewear', price: 1800000, compare: 2200000, featured: false, colors: ['Black', 'Sage', 'Blush'],     imgs: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'] },
        { name: 'Zip-Up Performance Jacket',          cat: 'Activewear', price: 3500000, compare: 4200000, featured: false, colors: ['Black', 'Navy'],               imgs: ['https://images.unsplash.com/photo-1519458246479-9aa4ad3e8bfc?w=800&q=80'] },
        { name: 'Relaxed Training T-Shirt',           cat: 'Activewear', price: 1200000, compare: 1500000, featured: false, colors: ['White', 'Black', 'Grey'],     imgs: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&q=80'] },

        // ── SWIMWEAR ──────────────────────────────────────────────────────────
        { name: 'Structured One-Piece Swimsuit',      cat: 'Swimwear', price: 3500000, compare: 4200000, featured: false, colors: ['Black', 'Navy', 'White'],       imgs: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'] },
        { name: 'Triangle Bikini Set',                cat: 'Swimwear', price: 3200000, compare: null,    featured: false, colors: ['Black', 'Red', 'Floral'],        imgs: ['https://images.unsplash.com/photo-1570976447640-ac859083963f?w=800&q=80'] },
        { name: 'High-Waist Bikini Bottom',           cat: 'Swimwear', price: 1800000, compare: 2200000, featured: false, colors: ['Black', 'Olive', 'Rust'],       imgs: ['https://images.unsplash.com/photo-1547153760-18fc86324498?w=800&q=80'] },
        { name: 'Sarong Cover-Up',                    cat: 'Swimwear', price: 2500000, compare: 3000000, featured: false, colors: ['White', 'Floral'],               imgs: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80'] },

        // ── LOUNGEWEAR ────────────────────────────────────────────────────────
        { name: 'Cashmere Lounge Set',                cat: 'Loungewear', price: 9500000, compare: 12000000, featured: true,  colors: ['Oatmeal', 'Slate', 'Rose'],  imgs: ['https://images.unsplash.com/photo-1617952986600-802ba8f9a9b8?w=800&q=80'] },
        { name: 'Modal Pajama Set',                   cat: 'Loungewear', price: 4200000, compare: 5000000,  featured: false, colors: ['Ivory', 'Blush', 'Navy'],   imgs: ['https://images.unsplash.com/photo-1559563458-527698bf5295?w=800&q=80'] },
        { name: 'Oversized Hoodie',                   cat: 'Loungewear', price: 3800000, compare: null,     featured: false, colors: ['Grey', 'Oatmeal', 'Black'],  imgs: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80'] },
        { name: 'Ribbed Lounge Set',                  cat: 'Loungewear', price: 5500000, compare: 6500000,  featured: false, colors: ['Sage', 'Pink', 'Camel'],    imgs: ['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80'] },
        { name: 'Silk Robe',                          cat: 'Loungewear', price: 6800000, compare: 8000000,  featured: false, colors: ['Ivory', 'Blush', 'Black'],  imgs: ['https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80'] },

        // ── ACCESSORIES ───────────────────────────────────────────────────────
        { name: 'Wool Beanie',                        cat: 'Accessories', price: 1200000, compare: 1500000, featured: false, colors: ['Camel', 'Navy', 'Grey'],    imgs: ['https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80'] },
        { name: 'Leather Gloves',                     cat: 'Accessories', price: 3500000, compare: 4200000, featured: false, colors: ['Black', 'Cognac'],           imgs: ['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'] },
        { name: 'Wide-Brim Felt Hat',                 cat: 'Accessories', price: 4500000, compare: null,    featured: false, colors: ['Camel', 'Black'],            imgs: ['https://images.unsplash.com/photo-1521369909029-2afed882baee?w=800&q=80'] },
        { name: 'Structured Leather Belt',            cat: 'Accessories', price: 2800000, compare: null,    featured: false, colors: ['Black', 'Cognac', 'White'],  imgs: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'] },
        { name: 'Pearl Drop Earrings',                cat: 'Accessories', price: 2200000, compare: 2800000, featured: false, colors: ['White Pearl'],               imgs: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'] },

        // ── SCARVES & WRAPS ───────────────────────────────────────────────────
        { name: 'Cashmere Plaid Scarf',               cat: 'Scarves & Wraps', price: 4500000, compare: 5500000, featured: true,  colors: ['Camel/Beige', 'Navy/Red'],  imgs: ['https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=800&q=80'] },
        { name: 'Silk Square Scarf',                  cat: 'Scarves & Wraps', price: 3500000, compare: null,    featured: false, colors: ['Floral', 'Geometric'],      imgs: ['https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80'] },
        { name: 'Wool Throw Wrap',                    cat: 'Scarves & Wraps', price: 5800000, compare: 7000000, featured: false, colors: ['Camel', 'Grey', 'Burgundy'], imgs: ['https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=80'] },
        { name: 'Lightweight Linen Scarf',            cat: 'Scarves & Wraps', price: 1800000, compare: 2200000, featured: false, colors: ['Ivory', 'Sky', 'Sand'],     imgs: ['https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=800&q=80'] },

        // ── FOOTWEAR ──────────────────────────────────────────────────────────
        { name: 'Block Heel Leather Pumps',           cat: 'Footwear', price: 6500000, compare: 7800000,  featured: true,  colors: ['Black', 'Nude', 'Cognac'],    imgs: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80'] },
        { name: 'Leather Chelsea Boots',              cat: 'Footwear', price: 8500000, compare: null,     featured: false, colors: ['Black', 'Tan'],               imgs: ['https://images.unsplash.com/photo-1614252235316-8c857196f400?w=800&q=80'] },
        { name: 'Pointed-Toe Mules',                  cat: 'Footwear', price: 5500000, compare: 6500000,  featured: false, colors: ['Camel', 'White', 'Black'],    imgs: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80'] },
        { name: 'White Leather Sneakers',             cat: 'Footwear', price: 4500000, compare: 5500000,  featured: false, colors: ['White', 'White/Gold'],        imgs: ['https://images.unsplash.com/photo-1556906781-9a412961d28e?w=800&q=80'] },
        { name: 'Strappy Heeled Sandals',             cat: 'Footwear', price: 5800000, compare: 7000000,  featured: false, colors: ['Gold', 'Silver', 'Black'],    imgs: ['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80'] },
        { name: 'Knee-High Suede Boots',              cat: 'Footwear', price: 10500000, compare: 13000000, featured: false, colors: ['Camel', 'Black'],             imgs: ['https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=80'] },

        // ── BAGS ──────────────────────────────────────────────────────────────
        { name: 'Structured Leather Tote',            cat: 'Bags', price: 12500000, compare: 15000000, featured: true,  colors: ['Black', 'Tan', 'Cognac'],       imgs: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'] },
        { name: 'Mini Crossbody Bag',                 cat: 'Bags', price: 5500000,  compare: 6500000,  featured: false, colors: ['Black', 'Camel', 'White'],      imgs: ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80'] },
        { name: 'Suede Clutch',                       cat: 'Bags', price: 4800000,  compare: null,     featured: false, colors: ['Blush', 'Camel', 'Black'],      imgs: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'] },
        { name: 'Leather Shopper',                    cat: 'Bags', price: 9500000,  compare: 12000000, featured: false, colors: ['Tan', 'Black'],                  imgs: ['https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80'] },
        { name: 'Chain-Strap Mini Bag',               cat: 'Bags', price: 7200000,  compare: 8500000,  featured: false, colors: ['Black', 'Gold', 'Nude'],         imgs: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'] },
        { name: 'Woven Leather Bucket Bag',           cat: 'Bags', price: 11000000, compare: null,     featured: false, colors: ['Cognac', 'Black'],               imgs: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80'] },

        // ── FORMAL WEAR ───────────────────────────────────────────────────────
        { name: 'Floor-Length Ball Gown',             cat: 'Formal Wear', price: 28000000, compare: 35000000, featured: true,  colors: ['Navy', 'Champagne'],       imgs: ['https://images.unsplash.com/photo-1532453288672-3a17ac36f32a?w=800&q=80'] },
        { name: 'Tuxedo Suit',                        cat: 'Formal Wear', price: 22000000, compare: null,     featured: false, colors: ['Black', 'Midnight Navy'],  imgs: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'] },
        { name: 'Embellished Cocktail Dress',         cat: 'Formal Wear', price: 16500000, compare: 20000000, featured: false, colors: ['Black', 'Gold', 'Silver'],  imgs: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'] },
        { name: 'Silk Halter Evening Dress',          cat: 'Formal Wear', price: 19000000, compare: 23000000, featured: false, colors: ['Champagne', 'Midnight'],   imgs: ['https://images.unsplash.com/photo-1508162462267-dba900861f8c?w=800&q=80'] },
        { name: 'Velvet Off-Shoulder Gown',           cat: 'Formal Wear', price: 25000000, compare: null,     featured: true,  colors: ['Emerald', 'Burgundy'],     imgs: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80'] },
    ];

    let count = 0;
    for (const p of products) {
        const catId = cats[p.cat];
        if (!catId) { console.warn(`⚠️  Missing cat: ${p.cat}`); continue; }
        await prisma.product.create({
            data: {
                name: p.name,
                slug: `${slug(p.name)}-${Math.random().toString(36).slice(2, 5)}`,
                description: `${p.name} — a refined piece for the modern wardrobe. Crafted with premium materials, it balances timeless elegance with contemporary ease.`,
                price: p.price,
                comparePrice: p.compare ?? null,
                categoryId: catId,
                images: p.imgs,
                isFeatured: p.featured ?? false,
                isActive: true,
                variants: { create: mkVariants(p.colors) },
            },
        });
        count++;
    }
    console.log(`✅ ${count} products created`);

    const firstFeatured = await prisma.product.findFirst({ where: { isFeatured: true } });
    if (firstFeatured) {
        await prisma.review.createMany({
            data: [
                { rating: 5, comment: 'Absolutely stunning. Worth every penny — impeccable quality.', productId: firstFeatured.id, userId: customer.id },
                { rating: 4, comment: 'Beautiful craftsmanship. The fabric drapes perfectly.', productId: firstFeatured.id, userId: admin.id },
            ],
        });
    }

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
