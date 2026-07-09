import { ROLE_LABELS, TERMS, FEATURES } from "./agri";

describe("agri config", () => {
  it("maps internal roles to agri-facing labels", () => {
    expect(ROLE_LABELS.CUSTOMER).toBe("Buyer");
    expect(ROLE_LABELS.VENDOR).toBe("Farmer");
    expect(ROLE_LABELS.DISPATCHER).toBe("Transporter");
    expect(ROLE_LABELS.ADMIN).toBe("Admin");
  });

  it("exposes agri terminology", () => {
    expect(TERMS.farm).toBe("Farm");
    expect(TERMS.produce).toBe("Produce");
    expect(TERMS.farmDashboard).toBe("Farm Dashboard");
    expect(TERMS.requestTransport).toBe("Request Transport");
  });

  it("disables off-brand surfaces in agri mode", () => {
    expect(FEATURES.restaurant).toBe(false);
    expect(FEATURES.services).toBe(false);
    expect(FEATURES.reels).toBe(false);
    expect(FEATURES.stories).toBe(false);
  });
});
