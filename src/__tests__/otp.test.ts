import { describe, it, expect } from "vitest";

// Utility helpers used in OTP workflows
export function isValid6DigitOtp(code: string): boolean {
  const clean = code.trim();
  return clean.length === 6 && /^\d{6}$/.test(clean);
}

export function formatCountdownTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function isPasswordValid(password: string): boolean {
  return typeof password === "string" && password.trim().length >= 6;
}

describe("OTP & Security Validation Helpers", () => {
  it("validates 6-digit numerical OTP codes correctly", () => {
    expect(isValid6DigitOtp("123456")).toBe(true);
    expect(isValid6DigitOtp("987654")).toBe(true);
    expect(isValid6DigitOtp("12345")).toBe(false); // too short
    expect(isValid6DigitOtp("1234567")).toBe(false); // too long
    expect(isValid6DigitOtp("123a56")).toBe(false); // non-digit character
    expect(isValid6DigitOtp("  ")).toBe(false);
  });

  it("formats 2-minute countdown timer into mm:ss strings", () => {
    expect(formatCountdownTimer(120)).toBe("02:00");
    expect(formatCountdownTimer(119)).toBe("01:59");
    expect(formatCountdownTimer(60)).toBe("01:00");
    expect(formatCountdownTimer(5)).toBe("00:05");
    expect(formatCountdownTimer(0)).toBe("00:00");
  });

  it("validates password length requirements correctly", () => {
    expect(isPasswordValid("Pass123")).toBe(true);
    expect(isPasswordValid("123456")).toBe(true);
    expect(isPasswordValid("12345")).toBe(false);
    expect(isPasswordValid("")).toBe(false);
  });
});
