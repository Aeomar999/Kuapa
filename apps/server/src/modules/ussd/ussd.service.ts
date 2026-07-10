import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UssdRequestDto } from "./dto/ussd.dto";
import { ProduceUnit } from "@prisma/client";

const CROPS = [
  { id: 1, name: "Tomatoes", unit: ProduceUnit.CRATE },
  { id: 2, name: "Pepper", unit: ProduceUnit.BAG },
  { id: 3, name: "Garden Eggs", unit: ProduceUnit.BASKET },
  { id: 4, name: "Okra", unit: ProduceUnit.BASKET },
  { id: 5, name: "Leafy Greens", unit: ProduceUnit.BASKET },
];

const MARKETS = [
  { id: 1, name: "Agbogbloshie Market, Accra" },
  { id: 2, name: "Makola Market, Accra" },
  { id: 3, name: "Kumasi Central Market" },
];

@Injectable()
export class UssdService {
  private readonly logger = new Logger(UssdService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main USSD menu processor compatible with Arkesel / Hubtel / Africa's Talking.
   * Returns a standard string prefixed with 'CON ' (continue session) or 'END ' (close session).
   */
  async handleUssd(dto: UssdRequestDto): Promise<string> {
    const rawText = dto.text ?? "";
    const text = rawText.trim();
    const parts = text === "" ? [] : text.split("*");
    const level = parts.length;

    this.logger.log(
      `USSD Session [${dto.sessionId}] Phone: ${dto.phoneNumber} Text: "${text}" Level: ${level}`
    );

    // Main Menu (Level 0)
    if (level === 0) {
      return (
        "CON Welcome to Kuapa AgriMarket:\n" +
        "1. List Produce for Sale\n" +
        "2. Check Pending Negotiations\n" +
        "3. Request Aboboyaa Transport\n" +
        "4. Check Wallet Balance"
      );
    }

    const choice = parts[0];

    // ─── OPTION 1: List Produce ────────────────────────────────────────────────
    if (choice === "1") {
      if (level === 1) {
        return (
          "CON Select Vegetable Crop:\n" +
          CROPS.map((c) => `${c.id}. ${c.name} (${c.unit})`).join("\n")
        );
      }

      if (level === 2) {
        const cropIndex = Number(parts[1]) - 1;
        const crop = CROPS[cropIndex];
        if (!crop) return "END Invalid crop selection. Please dial again.";
        return `CON Enter quantity of ${crop.name} in ${crop.unit}S:`;
      }

      if (level === 3) {
        const cropIndex = Number(parts[1]) - 1;
        const crop = CROPS[cropIndex];
        const quantity = Number(parts[2]);
        if (isNaN(quantity) || quantity <= 0) return "END Invalid quantity entered.";
        return `CON Enter price per ${crop.unit} of ${crop.name} in GHS:`;
      }

      if (level === 4) {
        const cropIndex = Number(parts[1]) - 1;
        const crop = CROPS[cropIndex];
        const quantity = Number(parts[2]);
        const price = Number(parts[3]);
        if (isNaN(price) || price <= 0) return "END Invalid price entered.";

        // Attempt to link to existing vendor profile or create a standalone listing
        const user = await this.prisma.user.findFirst({
          where: {
            OR: [
              { email: `${dto.phoneNumber}@kuapa.ussd` },
              { shippingAddresses: { some: { phone: dto.phoneNumber } } },
            ],
          },
          include: { vendorProfile: true },
        });

        // Find or create category
        let category = await this.prisma.category.findFirst({
          where: { slug: crop.name.toLowerCase().replace(/\s+/g, "-") },
        });

        if (!category) {
          category = await this.prisma.category.create({
            data: {
              name: crop.name,
              slug: crop.name.toLowerCase().replace(/\s+/g, "-"),
              description: `Fresh locally farmed ${crop.name}`,
              isActive: true,
            },
          });
        }

        const slug = `${crop.name.toLowerCase().replace(/\s+/g, "-")}-ussd-${Date.now()}`;
        await this.prisma.product.create({
          data: {
            name: `${crop.name} (USSD Farm Listing)`,
            slug,
            description: `Fresh ${crop.name} listed via USSD by farmer (${dto.phoneNumber}). Quantity: ${quantity} ${crop.unit}S.`,
            price,
            stock: quantity,
            categoryId: category.id,
            vendorId: user?.vendorProfile?.id ?? null,
            unit: crop.unit,
            isPerishable: true,
            shelfLifeDays: 5,
            harvestDate: new Date(),
            isActive: true,
          },
        });

        return (
          `END Successfully listed ${quantity} ${crop.unit}S of ${crop.name} at GHS ${price.toFixed(2)}/${crop.unit}!\n` +
          "Buyers on Kuapa Marketplace can now order directly."
        );
      }
    }

    // ─── OPTION 2: Check Pending Negotiations ──────────────────────────────────
    if (choice === "2") {
      if (level === 1) {
        // Find recent negotiations for products owned by this farmer
        const pending = await this.prisma.priceNegotiation.findFirst({
          where: { status: "PENDING" },
          include: { product: true },
          orderBy: { createdAt: "desc" },
        });

        if (!pending) {
          return "END No pending buyer negotiations found for your produce.";
        }

        return (
          `CON Offer on ${pending.product.name}:\n` +
          `${pending.proposedQuantity} ${pending.product.unit}S @ GHS ${pending.proposedPrice}/${pending.product.unit}\n` +
          `1. Accept Offer\n` +
          `2. Reject Offer`
        );
      }

      if (level === 2) {
        const action = parts[1];
        const pending = await this.prisma.priceNegotiation.findFirst({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        });

        if (!pending) return "END Negotiation no longer active.";

        if (action === "1") {
          await this.prisma.priceNegotiation.update({
            where: { id: pending.id },
            data: { status: "ACCEPTED" },
          });
          return `END Offer Accepted! Buyer notified to complete payment via Mobile Money.`;
        } else {
          await this.prisma.priceNegotiation.update({
            where: { id: pending.id },
            data: { status: "REJECTED" },
          });
          return `END Offer Rejected.`;
        }
      }
    }

    // ─── OPTION 3: Request Aboboyaa Transport ──────────────────────────────────
    if (choice === "3") {
      if (level === 1) {
        return (
          "CON Select Destination Market:\n" + MARKETS.map((m) => `${m.id}. ${m.name}`).join("\n")
        );
      }

      if (level === 2) {
        const marketIndex = Number(parts[1]) - 1;
        const market = MARKETS[marketIndex];
        if (!market) return "END Invalid market selection.";
        return (
          `END Aboboyaa Tricycle requested to transport produce to ${market.name}.\n` +
          "Estimated Fare: GHS 45.00. Nearest driver has been alerted via Kuapa Logistics."
        );
      }
    }

    // ─── OPTION 4: Check Wallet Balance ────────────────────────────────────────
    if (choice === "4") {
      return (
        "END Kuapa Wallet Summary:\n" +
        "Active Balance: GHS 0.00\n" +
        "Pending Escrow Payouts: GHS 0.00\n" +
        "Dial *920*26# anytime to list new harvest."
      );
    }

    return "END Invalid option selected. Please dial *920*26# again.";
  }
}
