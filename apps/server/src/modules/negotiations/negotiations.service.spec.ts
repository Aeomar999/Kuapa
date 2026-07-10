import { mockPrisma } from "../../prisma/prisma.mock";
import { NegotiationsService } from "./negotiations.service";
import { AgriSmsService } from "../../common/services/sms.service";
import { NegotiationStatus } from "@prisma/client";

describe("NegotiationsService", () => {
  let service: NegotiationsService;
  let prisma: ReturnType<typeof mockPrisma>;
  let smsService: AgriSmsService;

  beforeEach(() => {
    prisma = mockPrisma();
    smsService = new AgriSmsService();
    service = new NegotiationsService(prisma as any, smsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createNegotiation", () => {
    it("should create a price negotiation and trigger SMS notification if farmer has phone", async () => {
      const notifySpy = jest.spyOn(smsService, "notifyFarmerNegotiation").mockResolvedValue(true);

      prisma.product.findUnique.mockResolvedValue({
        id: "p-100",
        name: "Fresh Tomatoes",
        unit: "CRATE",
        vendor: {
          id: "v-100",
          phone: "+233240000000",
        },
      } as any);

      const mockCreated = {
        id: "neg-1",
        productId: "p-100",
        buyerId: "user-1",
        vendorId: "v-100",
        proposedPrice: 110,
        proposedQuantity: 10,
        status: NegotiationStatus.PENDING,
      };

      prisma.priceNegotiation.create.mockResolvedValue(mockCreated as any);

      const result = await service.createNegotiation("user-1", {
        productId: "p-100",
        vendorId: "v-100",
        proposedPrice: 110,
        proposedQuantity: 10,
      });

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: "p-100" },
        include: { vendor: true },
      });
      expect(prisma.priceNegotiation.create).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalledWith("+233240000000", "Fresh Tomatoes", "110", 10, "CRATE");
      expect(result).toEqual(mockCreated);
    });

    it("should throw NotFoundException if produce listing does not exist", async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createNegotiation("user-1", {
          productId: "nonexistent",
          vendorId: "v-100",
          proposedPrice: 100,
          proposedQuantity: 5,
        })
      ).rejects.toThrow("Produce listing not found");
    });
  });

  describe("findVendorNegotiations", () => {
    it("should return all negotiations received by a vendor", async () => {
      const mockList = [{ id: "neg-1", proposedPrice: 120 }];
      prisma.priceNegotiation.findMany.mockResolvedValue(mockList as any);

      const result = await service.findVendorNegotiations("v-100");
      expect(prisma.priceNegotiation.findMany).toHaveBeenCalledWith({
        where: { vendorId: "v-100" },
        include: {
          product: true,
          buyer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe("findBuyerNegotiations", () => {
    it("should return all negotiations sent by a buyer", async () => {
      const mockList = [{ id: "neg-1", proposedPrice: 110 }];
      prisma.priceNegotiation.findMany.mockResolvedValue(mockList as any);

      const result = await service.findBuyerNegotiations("buyer-1");
      expect(prisma.priceNegotiation.findMany).toHaveBeenCalledWith({
        where: { buyerId: "buyer-1" },
        include: {
          product: { include: { vendor: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe("respondToNegotiation", () => {
    it("should update negotiation status when responded to by farmer", async () => {
      prisma.priceNegotiation.findUnique.mockResolvedValue({
        id: "neg-1",
        message: "Original message",
        product: { id: "p-100" },
      } as any);

      const updatedNeg = {
        id: "neg-1",
        status: NegotiationStatus.ACCEPTED,
        message: "We accept your offer",
      };
      prisma.priceNegotiation.update.mockResolvedValue(updatedNeg as any);

      const result = await service.respondToNegotiation("neg-1", {
        status: NegotiationStatus.ACCEPTED,
        message: "We accept your offer",
      });

      expect(prisma.priceNegotiation.update).toHaveBeenCalledWith({
        where: { id: "neg-1" },
        data: {
          status: NegotiationStatus.ACCEPTED,
          message: "We accept your offer",
        },
        include: {
          product: true,
          buyer: { select: { id: true, name: true, email: true } },
        },
      });
      expect(result).toEqual(updatedNeg);
    });

    it("should throw NotFoundException if negotiation ID is invalid", async () => {
      prisma.priceNegotiation.findUnique.mockResolvedValue(null);

      await expect(
        service.respondToNegotiation("invalid-id", {
          status: NegotiationStatus.REJECTED,
        })
      ).rejects.toThrow("Negotiation offer not found");
    });
  });
});
