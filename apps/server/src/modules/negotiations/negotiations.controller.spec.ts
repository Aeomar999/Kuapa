import { Test, TestingModule } from "@nestjs/testing";
import { NegotiationsController } from "./negotiations.controller";
import { NegotiationsService } from "./negotiations.service";
import { AuthGuard } from "../../guards/auth.guard";
import { NegotiationStatus } from "@prisma/client";

describe("NegotiationsController", () => {
  let controller: NegotiationsController;
  let service: NegotiationsService;

  const mockService = {
    createNegotiation: jest.fn(),
    findBuyerNegotiations: jest.fn(),
    findVendorNegotiations: jest.fn(),
    respondToNegotiation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NegotiationsController],
      providers: [{ provide: NegotiationsService, useValue: mockService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NegotiationsController>(NegotiationsController);
    service = module.get<NegotiationsService>(NegotiationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should call service.createNegotiation with buyer ID and DTO", async () => {
      const dto = {
        productId: "p-1",
        vendorId: "v-1",
        proposedPrice: 100,
        proposedQuantity: 5,
      };
      const expectedResult = { id: "neg-1", ...dto };
      mockService.createNegotiation.mockResolvedValue(expectedResult);

      const req = { user: { id: "buyer-1" } };
      const result = await controller.create(req, dto);

      expect(result).toEqual(expectedResult);
      expect(mockService.createNegotiation).toHaveBeenCalledWith("buyer-1", dto);
    });
  });

  describe("findBuyerNegotiations", () => {
    it("should call service.findBuyerNegotiations with current user ID", async () => {
      const expectedResult = [{ id: "neg-1" }];
      mockService.findBuyerNegotiations.mockResolvedValue(expectedResult);

      const req = { user: { id: "buyer-1" } };
      const result = await controller.findBuyerNegotiations(req);

      expect(result).toEqual(expectedResult);
      expect(mockService.findBuyerNegotiations).toHaveBeenCalledWith("buyer-1");
    });
  });

  describe("findVendorNegotiations", () => {
    it("should call service.findVendorNegotiations with vendorId param", async () => {
      const expectedResult = [{ id: "neg-1" }];
      mockService.findVendorNegotiations.mockResolvedValue(expectedResult);

      const result = await controller.findVendorNegotiations("vendor-1");

      expect(result).toEqual(expectedResult);
      expect(mockService.findVendorNegotiations).toHaveBeenCalledWith("vendor-1");
    });
  });

  describe("respond", () => {
    it("should call service.respondToNegotiation with negotiation ID and status DTO", async () => {
      const dto = {
        status: NegotiationStatus.ACCEPTED,
        message: "Offer accepted",
      };
      const expectedResult = { id: "neg-1", status: NegotiationStatus.ACCEPTED };
      mockService.respondToNegotiation.mockResolvedValue(expectedResult);

      const result = await controller.respond({ user: { id: "farmer-user-1" } }, "neg-1", dto);

      expect(result).toEqual(expectedResult);
      expect(mockService.respondToNegotiation).toHaveBeenCalledWith("neg-1", dto, "farmer-user-1");
    });
  });
});
