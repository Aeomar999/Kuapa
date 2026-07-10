import { PrismaClient, ProduceUnit } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌾 Seeding GDSS-PSInno AgriTech Challenge Data for Ghana...");

  // 1. Seed Agricultural Categories
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
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        isActive: true,
      },
    });
  }

  console.log("✔ Agricultural Produce categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding agricultural data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
