import { describe, expect, it } from "vitest";
import { normalizeNumericInput } from "./NumericInput";

describe("normalizeNumericInput", () => {
  it("preserves valid decimal values", () => {
    expect(normalizeNumericInput("125.50")).toBe(125.5);
    expect(normalizeNumericInput("0.25")).toBe(0.25);
  });

  it("does not convert an empty editing value until blur normalization", () => {
    expect(normalizeNumericInput("", 0, 0.01)).toBe(0);
    expect(normalizeNumericInput("   ", 0, 0.01)).toBe(0);
  });

  it("clamps values to the minimum", () => {
    expect(normalizeNumericInput("-4", 0, 0.01)).toBe(0);
    expect(normalizeNumericInput("0", 1, 1)).toBe(1);
  });

  it("keeps whole-unit fields as positive integers", () => {
    expect(normalizeNumericInput("12.8", 1, 1)).toBe(12);
    expect(normalizeNumericInput("1", 1, 1)).toBe(1);
  });

  it("rejects non-finite values by restoring the minimum", () => {
    expect(normalizeNumericInput("Infinity", 0, 0.01)).toBe(0);
    expect(normalizeNumericInput("not-a-number", 1, 1)).toBe(1);
  });
});
