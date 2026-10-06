import { describe, expect, it } from "vitest";
import { ageFromBirthDate } from "@/lib/age";

describe("ageFromBirthDate", () => {
  it("counts the birthday on the day itself", () => {
    expect(ageFromBirthDate("2000-06-15", new Date(2026, 5, 15))).toBe(26);
  });
  it("does not count it the day before", () => {
    expect(ageFromBirthDate("2000-06-15", new Date(2026, 5, 14))).toBe(25);
  });
  it("handles a month that has not come yet", () => {
    expect(ageFromBirthDate("2000-12-31", new Date(2026, 0, 1))).toBe(25);
  });
  it("handles a leap-day birthday", () => {
    expect(ageFromBirthDate("2000-02-29", new Date(2026, 1, 28))).toBe(25);
    expect(ageFromBirthDate("2000-02-29", new Date(2026, 2, 1))).toBe(26);
  });
});
