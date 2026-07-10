import { AgriSmsService } from "./sms.service";
import { Logger } from "@nestjs/common";

describe("AgriSmsService", () => {
  let service: AgriSmsService;

  beforeEach(() => {
    service = new AgriSmsService();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should format and send price negotiation notification SMS to farmer", async () => {
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    const result = await service.notifyFarmerNegotiation(
      "+233240000000",
      "Fresh Tomatoes",
      "120.00",
      10,
      "CRATE"
    );
    expect(result).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("GDSS AgriTech: New price offer on Fresh Tomatoes")
    );
    logSpy.mockRestore();
  });

  it("should format and send bulk order confirmation SMS to farmer", async () => {
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => {});
    const result = await service.notifyFarmerOrder(
      "+233240000000",
      "ORD-1001",
      "Fresh Tomatoes",
      5,
      "CRATE"
    );
    expect(result).toBe(true);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("GDSS AgriTech: New order #ORD-1001 for 5 CRATE of Fresh Tomatoes")
    );
    logSpy.mockRestore();
  });
});
