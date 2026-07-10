import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AgriSmsService } from "../../common/services/sms.service";
import { CreateNegotiationDto } from "./dto/create-negotiation.dto";
import { RespondNegotiationDto } from "./dto/respond-negotiation.dto";
import { NegotiationStatus } from "@prisma/client";

@Injectable()
export class NegotiationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: AgriSmsService
  ) {}

  async createNegotiation(buyerId: string, dto: CreateNegotiationDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { vendor: true },
    });

    if (!product) {
      throw new NotFoundException("Produce listing not found");
    }
    if (!product.vendorId) {
      throw new NotFoundException("This listing has no farmer to negotiate with");
    }

    const negotiation = await this.prisma.priceNegotiation.create({
      data: {
        productId: dto.productId,
        buyerId,
        // The product's owner is authoritative — never trust a client-supplied vendorId.
        vendorId: product.vendorId,
        proposedPrice: dto.proposedPrice,
        proposedQuantity: dto.proposedQuantity,
        message: dto.message,
        status: NegotiationStatus.PENDING,
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    // If farmer has phone number, trigger rural SMS notification
    if (product.vendor?.phone) {
      await this.smsService.notifyFarmerNegotiation(
        product.vendor.phone,
        product.name,
        dto.proposedPrice.toString(),
        dto.proposedQuantity,
        product.unit
      );
    }

    return negotiation;
  }

  async findVendorNegotiations(vendorId: string) {
    return this.prisma.priceNegotiation.findMany({
      where: { vendorId },
      include: {
        product: true,
        buyer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBuyerNegotiations(buyerId: string) {
    return this.prisma.priceNegotiation.findMany({
      where: { buyerId },
      include: {
        product: { include: { vendor: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async respondToNegotiation(id: string, dto: RespondNegotiationDto, responderId?: string) {
    const negotiation = await this.prisma.priceNegotiation.findUnique({
      where: { id },
      include: { product: true, vendor: { select: { userId: true } } },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation offer not found");
    }
    if (responderId && negotiation.vendor?.userId !== responderId) {
      throw new ForbiddenException("Only the farmer who owns this listing can respond");
    }

    return this.prisma.priceNegotiation.update({
      where: { id },
      data: {
        status: dto.status,
        message: dto.message ?? negotiation.message,
      },
      include: {
        product: true,
        buyer: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
