import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryProductsDto, ProductSort, SmartMatchQueryDto } from "./dto/query-products.dto";
import { getCache, setCache } from "../../utils/cache";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QueryProductsDto) {
    const where: any = { isActive: true, isDeleted: false };

    if (dto.vendorId) {
      where.vendorId = dto.vendorId;
    }

    if (dto.category && dto.category !== "All") {
      where.category = { name: dto.category };
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: "insensitive" } },
        { vendor: { shopName: { contains: dto.search, mode: "insensitive" } } },
      ];
    }

    const orderBy: any[] = [];
    switch (dto.sort) {
      case ProductSort.PRICE_LOW:
        orderBy.push({ price: "asc" });
        break;
      case ProductSort.PRICE_HIGH:
        orderBy.push({ price: "desc" });
        break;
      case ProductSort.NEWEST:
        orderBy.push({ createdAt: "desc" });
        break;
      case ProductSort.POPULAR:
      default:
        orderBy.push({ reviews: { _count: "desc" } });
        orderBy.push({ createdAt: "desc" });
        break;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          category: true,
          vendor: { select: { id: true, shopName: true, logo: true } },
        },
        orderBy,
        ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : { skip: dto.skip }),
        take: dto.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        stock: p.stock,
        category: p.category.name,
        vendor: p.vendor?.shopName ?? null,
        vendorId: p.vendor?.id ?? null,
        image: p.images[0]?.url ?? null,
        isFeatured: p.isFeatured,
        rating: 0,
        reviewCount: 0,
        createdAt: p.createdAt,
      })),
      meta: {
        total,
        page: dto.page ?? 1,
        limit: dto.limit ?? 20,
        totalPages: Math.ceil(total / (dto.limit ?? 20)),
        nextCursor: data.length === dto.limit ? data[data.length - 1].id : null,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id, isActive: true, isDeleted: false },
      include: {
        images: { orderBy: { order: "asc" } },
        category: true,
        vendor: {
          select: {
            id: true,
            shopName: true,
            logo: true,
            description: true,
          },
        },
        reviews: {
          take: 3,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });

    if (!product) throw new NotFoundException("Product not found");

    const reviewStats = await this.prisma.review.aggregate({
      where: { productId: id },
      _avg: { rating: true },
      _count: true,
    });

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      category: product.category.name,
      deliveryOptions: product.deliveryOptions,
      seller: product.vendor
        ? {
            id: product.vendor.id,
            name: product.vendor.shopName,
            logo: product.vendor.logo,
            description: product.vendor.description,
          }
        : null,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary,
      })),
      rating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : 0,
      reviewCount: reviewStats._count,
      reviews: product.reviews.map((r) => ({
        id: r.id,
        user: r.user.name,
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt,
      })),
      createdAt: product.createdAt,
    };
  }

  async getCategories() {
    const cached = getCache<any[]>("categories_list");
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });

    const result = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      count: c._count.products,
    }));

    setCache("categories_list", result, 3600); // cache for 1 hour
    return result;
  }

  async getStore(id: string) {
    const store = await this.prisma.vendorProfile.findUnique({
      where: { id, isActive: true },
    });

    if (!store) {
      throw new NotFoundException("Store not found");
    }

    try {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "VendorProfile" SET "visits" = "visits" + 1 WHERE "id" = $1`,
        id
      );
    } catch (e) {
      console.error(`Failed to track visit for store ${id}:`, e);
    }

    const stats = await this.prisma.product.aggregate({
      where: { vendorId: id, isActive: true, isDeleted: false },
      _count: true,
    });

    return {
      id: store.id,
      name: store.shopName,
      slug: store.slug,
      description: store.description,
      logo: store.logo,
      banner: store.banner,
      address: store.address,
      city: store.city,
      state: store.state,
      phone: store.phone,
      totalProducts: stats._count,
      rating: 4.5,
      visits: (store as any).visits ? (store as any).visits + 1 : 1,
    };
  }

  async getFeatured() {
    const cached = getCache<any[]>("featured_products");
    if (cached) return cached;

    const products = await this.prisma.product.findMany({
      where: { isActive: true, isDeleted: false, isFeatured: true },
      take: 10,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: true,
        vendor: { select: { id: true, shopName: true } },
      },
    });

    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      category: p.category.name,
      vendor: p.vendor?.shopName ?? null,
      image: p.images[0]?.url ?? null,
    }));

    setCache("featured_products", result, 300); // Cache for 5 minutes
    return result;
  }

  async searchProducts(query: string, limit: number = 20) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isDeleted: false,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { vendor: { shopName: { contains: query, mode: "insensitive" } } },
        ],
      },
      take: limit,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: true,
        vendor: { select: { id: true, shopName: true } },
      },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      category: p.category.name,
      vendor: p.vendor?.shopName ?? null,
      image: p.images[0]?.url ?? null,
    }));
  }

  /**
   * Smart produce matching algorithm computing multi-factor score:
   * Score = 0.40 * Freshness + 0.35 * Proximity + 0.25 * PriceCompetitiveness
   */
  async getSmartMatchedProducts(query: SmartMatchQueryDto) {
    const where: any = { isActive: true, isDeleted: false, stock: { gt: 0 } };
    if (query.category && query.category !== "All") {
      where.category = { name: query.category };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: true,
        vendor: { select: { id: true, shopName: true, logo: true } },
      },
      take: 100,
    });

    const avgPriceByCategory: Record<string, number> = {};
    const countByCategory: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category.name;
      avgPriceByCategory[cat] = (avgPriceByCategory[cat] ?? 0) + Number(p.price);
      countByCategory[cat] = (countByCategory[cat] ?? 0) + 1;
    }
    for (const cat of Object.keys(avgPriceByCategory)) {
      avgPriceByCategory[cat] = avgPriceByCategory[cat] / countByCategory[cat];
    }

    const now = new Date();
    const scored = products.map((p) => {
      let distanceKm: number | null = null;
      let proximityScore = 70;
      if (
        query.lat != null &&
        query.lng != null &&
        p.farmLocationLat != null &&
        p.farmLocationLng != null
      ) {
        distanceKm = this.calculateHaversineKm(
          query.lat,
          query.lng,
          p.farmLocationLat,
          p.farmLocationLng
        );
        proximityScore = Math.max(0, 100 - (distanceKm / 50) * 100);
      }

      const harvestDate = p.harvestDate ? new Date(p.harvestDate) : p.createdAt;
      const shelfLifeDays = p.shelfLifeDays ?? 7;
      const daysSinceHarvest = Math.max(
        0,
        (now.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const remainingDays = Math.max(0, shelfLifeDays - daysSinceHarvest);
      const freshnessScore = Math.min(100, Math.max(0, (remainingDays / shelfLifeDays) * 100));

      const avgPrice = avgPriceByCategory[p.category.name] || Number(p.price) || 1;
      const priceRatio = Number(p.price) / avgPrice;
      const priceScore = Math.min(100, Math.max(0, (2 - priceRatio) * 50));

      const smartMatchScore = Math.round(
        0.4 * freshnessScore + 0.35 * proximityScore + 0.25 * priceScore
      );

      let tag = "PEAK_FRESHNESS";
      if (remainingDays <= 2 && p.isPerishable) {
        tag = "URGENT_SALE_DISCOUNT";
      } else if (distanceKm != null && distanceKm <= 10) {
        tag = "LOCAL_FARM_NEARBY";
      }

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        stock: p.stock,
        unit: p.unit,
        category: p.category.name,
        vendor: p.vendor?.shopName ?? null,
        image: p.images[0]?.url ?? null,
        isPerishable: p.isPerishable,
        remainingShelfLifeDays: Math.round(remainingDays * 10) / 10,
        distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
        smartMatchScore,
        tag,
      };
    });

    scored.sort((a, b) => b.smartMatchScore - a.smartMatchScore);
    return scored.slice(0, query.limit ?? 20);
  }

  private calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
