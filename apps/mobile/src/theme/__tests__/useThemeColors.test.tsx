import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { useColorScheme } from "nativewind";
import { useThemeColors } from "../useThemeColors";
import { getThemeColors, lightTokens, darkTokens } from "../tokens";

function Probe() {
  const c = useThemeColors();
  return <Text>{c.background}</Text>;
}

const asMock = (fn: unknown) => fn as jest.Mock;

describe("getThemeColors", () => {
  it("returns the palette matching the scheme", () => {
    expect(getThemeColors("light")).toBe(lightTokens);
    expect(getThemeColors("dark")).toBe(darkTokens);
  });

  it("exposes the expected surface hexes", () => {
    expect(getThemeColors("light").background).toBe("#FDFBF7");
    expect(getThemeColors("dark").background).toBe("#0A110D");
    expect(getThemeColors("dark").surface).toBe("#142019");
    expect(getThemeColors("dark").textPrimary).toBe("#F8F4EA");
  });
});

describe("useThemeColors", () => {
  afterEach(() => {
    asMock(useColorScheme).mockReturnValue({
      colorScheme: "light",
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });
  });

  it("returns the light palette by default", () => {
    const { getByText } = render(<Probe />);
    expect(getByText(lightTokens.background)).toBeTruthy();
  });

  it("returns the dark palette when the scheme is dark", () => {
    asMock(useColorScheme).mockReturnValue({
      colorScheme: "dark",
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    });
    const { getByText } = render(<Probe />);
    expect(getByText(darkTokens.background)).toBeTruthy();
  });
});
