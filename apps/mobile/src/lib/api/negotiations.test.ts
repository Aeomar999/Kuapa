jest.mock("./client", () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));

import { negotiationsApi } from "./negotiations";
import { apiClient } from "./client";

describe("negotiationsApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should create a price offer", async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "neg-1", status: "PENDING" } });
    const result = await negotiationsApi.create({
      productId: "prod-1",
      proposedPrice: 110,
      proposedQuantity: 10,
      message: "Bulk order for my restaurant",
    });
    expect(apiClient.post).toHaveBeenCalledWith("/negotiations", {
      productId: "prod-1",
      proposedPrice: 110,
      proposedQuantity: 10,
      message: "Bulk order for my restaurant",
    });
    expect(result.data.status).toBe("PENDING");
  });

  it("should list the buyer's offers", async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [{ id: "neg-1" }] });
    const result = await negotiationsApi.getBuyerNegotiations();
    expect(apiClient.get).toHaveBeenCalledWith("/negotiations/buyer");
    expect(result.data).toHaveLength(1);
  });
});
