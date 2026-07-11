import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient, ProduceUnit, UserRole, NegotiationStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Shared demo password for all three role accounts (demo/judging only).
const DEMO_PASSWORD = "Kuapa1234!";

/**
 * Idempotently seeds GDSS-PSInno AgriTech Challenge demo data: produce
 * categories, one user per role (farmer / buyer / transporter) that can log in
 * via better-auth credentials, unit-bearing produce listings for the farmer,
 * and a pending price negotiation so the farmer inbox and USSD option 2 have
 * live data. Safe to run multiple times.
 */
async function main() {
  console.log("🌾 Seeding GDSS-PSInno AgriTech Challenge Data for Ghana...");

  // 1. Agricultural categories
  const agriCategories = [
    {
      name: "Fresh Tomatoes",
      slug: "fresh-tomatoes",
      description: "High shelf-life fresh tomatoes directly from Akumadan & Techiman farmers",
      icon: "🍅",
    },
    {
      name: "Peppers & Chilies",
      slug: "peppers-chilies",
      description: "Fresh Kpakpo Shito, Scotch Bonnet, and Green Peppers",
      icon: "🌶️",
    },
    {
      name: "Root Tubers",
      slug: "root-tubers",
      description: "Puna Yam, Cassava, and Cocoyam in bulk bags",
      icon: "🥔",
    },
    {
      name: "Grains & Cereals",
      slug: "grains-cereals",
      description: "Local Rice, Maize, and Sorghum",
      icon: "🌾",
    },
  ];

  for (const cat of agriCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
  }
  console.log("✔ Produce categories ready");

  // 2. Demo users — one per challenge actor, login-capable via better-auth
  //    credential accounts ("credential" provider, scrypt hash).
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const demoUsers = [
    {
      id: "demo-farmer-user",
      name: "Kofi Mensah",
      email: "kofi.farmer@kuapa.com",
      role: UserRole.VENDOR,
      phoneNumber: "+233240000001",
    },
    {
      id: "demo-buyer-user",
      name: "Ama Serwaa",
      email: "ama.buyer@kuapa.com",
      role: UserRole.CUSTOMER,
      phoneNumber: "+233240000002",
    },
    {
      id: "demo-transporter-user",
      name: "Yaw Boateng",
      email: "yaw.transporter@kuapa.com",
      role: UserRole.DISPATCHER,
      phoneNumber: "+233240000003",
    },
  ];

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { role: u.role, name: u.name, email: u.email },
      create: {
        ...u,
        emailVerified: true,
        phoneNumberVerified: true,
        onboardingCompleted: true,
        isActive: true,
      },
    });
    await prisma.account.upsert({
      where: { id: `${u.id}-credential` },
      update: { password: passwordHash },
      create: {
        id: `${u.id}-credential`,
        userId: u.id,
        accountId: u.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
  }
  console.log("✔ Demo users ready (password: %s)", DEMO_PASSWORD);

  // 3. Farmer profile — Akumadan, Ashanti Region (challenge asks for a
  //    focused supply region; Akumadan is Ghana's tomato belt).
  const farm = await prisma.vendorProfile.upsert({
    where: { userId: "demo-farmer-user" },
    update: { latitude: 7.4083, longitude: -1.9618, phone: "+233240000001" },
    create: {
      userId: "demo-farmer-user",
      shopName: "Akumadan Farms",
      slug: "akumadan-farms",
      description:
        "Family-run vegetable farm in Akumadan, Ashanti Region. Tomatoes, peppers, garden eggs and okra harvested to order.",
      address: "Akumadan, Offinso North",
      city: "Akumadan",
      state: "Ashanti Region",
      phone: "+233240000001",
      latitude: 7.4083,
      longitude: -1.9618,
      isActive: true,
    },
  });

  // 4. Transporter profile — aboboyaa online near Akumadan.
  await prisma.dispatcherProfile.upsert({
    where: { userId: "demo-transporter-user" },
    update: { status: "ONLINE", lastLatitude: 7.41, lastLongitude: -1.96 },
    create: {
      userId: "demo-transporter-user",
      vehicleType: "ABOBOYAA_TRICYCLE",
      plateNumber: "AS-1234-21",
      status: "ONLINE",
      lastLatitude: 7.41,
      lastLongitude: -1.96,
      lastLocationAt: new Date(),
    },
  });
  console.log("✔ Farm + transporter profiles ready");

  // 5. Produce listings with units, harvest dates and shelf life.
  const day = 24 * 60 * 60 * 1000;
  const listings = [
    {
      slug: "akumadan-fresh-tomatoes",
      name: "Fresh Tomatoes (Akumadan)",
      description:
        "Firm, ripe tomatoes harvested this week from Akumadan. Graded and packed in wooden crates, ideal for market women and restaurants.",
      price: 250,
      stock: 40,
      unit: ProduceUnit.CRATE,
      harvestDate: new Date(Date.now() - 1 * day),
      shelfLifeDays: 5,
      categorySlug: "fresh-tomatoes",
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80",
    },
    {
      slug: "kpakpo-shito-peppers",
      name: "Kpakpo Shito Peppers",
      description:
        "Aromatic green kpakpo shito peppers, freshly picked. Sold per bag; perfect for shito, stews and pepper sauce.",
      price: 180,
      stock: 25,
      unit: ProduceUnit.BAG,
      harvestDate: new Date(Date.now() - 2 * day),
      shelfLifeDays: 7,
      categorySlug: "peppers-chilies",
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&q=80",
    },
    {
      slug: "garden-eggs-basket",
      name: "Garden Eggs",
      description:
        "Fresh garden eggs in woven baskets, harvested today. Popular for garden egg stew and abom.",
      price: 120,
      stock: 30,
      unit: ProduceUnit.BASKET,
      harvestDate: new Date(),
      shelfLifeDays: 6,
      categorySlug: "peppers-chilies",
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=800&q=80",
    },
    {
      slug: "fresh-okra-bag",
      name: "Fresh Okra",
      description:
        "Tender okra fingers packed per bag. Harvested three days ago, moves fast — best for soups and light stews.",
      price: 90,
      stock: 20,
      unit: ProduceUnit.BAG,
      harvestDate: new Date(Date.now() - 3 * day),
      shelfLifeDays: 4,
      categorySlug: "grains-cereals",
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1664289242854-e99d345cfa92?w=800&q=80",
    },
  ];

  for (const item of listings) {
    const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
    if (!category) continue;
    await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        price: item.price,
        stock: item.stock,
        unit: item.unit,
        harvestDate: item.harvestDate,
        shelfLifeDays: item.shelfLifeDays,
        vendorId: farm.id,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        stock: item.stock,
        unit: item.unit,
        harvestDate: item.harvestDate,
        shelfLifeDays: item.shelfLifeDays,
        isPerishable: true,
        isActive: true,
        isFeatured: item.isFeatured,
        categoryId: category.id,
        vendorId: farm.id,
        images: { create: [{ url: item.image, isPrimary: true, order: 0 }] },
      },
    });
  }
  console.log("✔ Produce listings ready (crates, bags, baskets with harvest dates)");

  // 6. A pending negotiation so the farmer inbox and USSD option 2 have data.
  const tomatoes = await prisma.product.findUnique({ where: { slug: "akumadan-fresh-tomatoes" } });
  if (tomatoes) {
    await prisma.priceNegotiation.upsert({
      where: { id: "demo-negotiation-001" },
      update: { status: NegotiationStatus.PENDING },
      create: {
        id: "demo-negotiation-001",
        productId: tomatoes.id,
        buyerId: "demo-buyer-user",
        vendorId: farm.id,
        proposedPrice: 220,
        proposedQuantity: 10,
        status: NegotiationStatus.PENDING,
        message: "Weekly supply for my chop bar in Kumasi — can you do 220 per crate?",
      },
    });
    console.log("✔ Pending demo negotiation ready");
  }

  console.log("\n🎉 Kuapa demo data seeded. Demo logins (password: %s):", DEMO_PASSWORD);
  console.log("   Farmer:      kofi.farmer@kuapa.com");
  console.log("   Buyer:       ama.buyer@kuapa.com");
  console.log("   Transporter: yaw.transporter@kuapa.com");
}

main()
  .catch((e) => {
    console.error("Error seeding agricultural data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
