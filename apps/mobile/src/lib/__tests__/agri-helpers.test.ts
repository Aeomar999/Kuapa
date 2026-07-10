describe("AgriTech Produce & Negotiation Helpers", () => {
  const formatProduceUnitLabel = (unit: string, count: number = 1) => {
    switch (unit) {
      case "CRATE":
        return count === 1 ? "Crate" : "Crates";
      case "BAG":
        return count === 1 ? "Bag" : "Bags";
      case "BASKET":
        return count === 1 ? "Basket" : "Baskets";
      case "TONNE":
        return count === 1 ? "Tonne" : "Tonnes";
      case "KG":
      default:
        return "Kg";
    }
  };

  const calculateBulkOfferTotal = (pricePerUnit: number, quantity: number) => {
    return Number((pricePerUnit * quantity).toFixed(2));
  };

  const isPerishableWarningRequired = (shelfLifeDays?: number) => {
    return shelfLifeDays !== undefined && shelfLifeDays <= 5;
  };

  it("should correctly pluralize agricultural produce packaging units", () => {
    expect(formatProduceUnitLabel("CRATE", 1)).toBe("Crate");
    expect(formatProduceUnitLabel("CRATE", 10)).toBe("Crates");
    expect(formatProduceUnitLabel("BAG", 5)).toBe("Bags");
    expect(formatProduceUnitLabel("KG", 50)).toBe("Kg");
  });

  it("should calculate total proposed offer value accurately", () => {
    expect(calculateBulkOfferTotal(120.5, 10)).toBe(1205);
    expect(calculateBulkOfferTotal(85.75, 4)).toBe(343);
  });

  it("should flag perishable produce with shelf life <= 5 days", () => {
    expect(isPerishableWarningRequired(3)).toBe(true);
    expect(isPerishableWarningRequired(5)).toBe(true);
    expect(isPerishableWarningRequired(14)).toBe(false);
    expect(isPerishableWarningRequired(undefined)).toBe(false);
  });
});
