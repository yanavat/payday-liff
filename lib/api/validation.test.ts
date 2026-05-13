import { describe, it, expect } from "vitest";

// EWA request validation — matches backend business rules
// Backend enforces: minAmount, maxPercent of earned wage, max requests per period

function validateEWAAmount(
  amount: number,
  maxWithdrawable: number,
  minAmount = 500,
): { valid: boolean; reason?: string } {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { valid: false, reason: "amount_not_positive" };
  }
  if (amount < minAmount) {
    return { valid: false, reason: "below_minimum" };
  }
  if (amount > maxWithdrawable) {
    return { valid: false, reason: "exceeds_limit" };
  }
  return { valid: true };
}

function validateOnBehalfNote(note: string): { valid: boolean; reason?: string } {
  if (!note || note.trim().length < 10) {
    return { valid: false, reason: "note_too_short" };
  }
  return { valid: true };
}

describe("EWA amount validation", () => {
  it("accepts a valid amount within limit", () => {
    expect(validateEWAAmount(2000, 5000)).toEqual({ valid: true });
  });

  it("rejects zero amount", () => {
    expect(validateEWAAmount(0, 5000).valid).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(validateEWAAmount(-100, 5000).valid).toBe(false);
  });

  it("rejects amount below default minimum (฿500)", () => {
    const result = validateEWAAmount(300, 5000);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("below_minimum");
  });

  it("rejects amount above maxWithdrawable", () => {
    const result = validateEWAAmount(6000, 5000);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("exceeds_limit");
  });

  it("accepts amount exactly at minAmount boundary", () => {
    expect(validateEWAAmount(500, 5000)).toEqual({ valid: true });
  });

  it("accepts amount exactly at maxWithdrawable boundary", () => {
    expect(validateEWAAmount(5000, 5000)).toEqual({ valid: true });
  });

  it("respects custom minAmount", () => {
    expect(validateEWAAmount(800, 5000, 1000).valid).toBe(false);
    expect(validateEWAAmount(1000, 5000, 1000).valid).toBe(true);
  });
});

describe("On-behalf HR note validation", () => {
  it("accepts a note with at least 10 characters", () => {
    expect(validateOnBehalfNote("Medical emergency cover").valid).toBe(true);
  });

  it("rejects note shorter than 10 characters", () => {
    expect(validateOnBehalfNote("Short").valid).toBe(false);
  });

  it("rejects empty note", () => {
    expect(validateOnBehalfNote("").valid).toBe(false);
  });

  it("trims whitespace before checking length", () => {
    expect(validateOnBehalfNote("   short   ").valid).toBe(false);
  });

  it("accepts note with exactly 10 non-whitespace chars", () => {
    expect(validateOnBehalfNote("1234567890").valid).toBe(true);
  });
});

describe("EWA max percent business rule", () => {
  // maxWithdrawable = earnedWage * maxPercent / 100
  function computeMaxWithdrawable(earnedWage: number, maxPercent: number): number {
    return Math.round(earnedWage * (maxPercent / 100));
  }

  it("monthly employee at 25% of salary", () => {
    // 25% of 20,000 earned so far
    expect(computeMaxWithdrawable(20000, 25)).toBe(5000);
  });

  it("weekly employee at 50% of weekly salary", () => {
    expect(computeMaxWithdrawable(6000, 50)).toBe(3000);
  });

  it("rounds to nearest integer", () => {
    // 25% of 15,001 = 3750.25 → 3750
    expect(computeMaxWithdrawable(15001, 25)).toBe(3750);
  });
});
