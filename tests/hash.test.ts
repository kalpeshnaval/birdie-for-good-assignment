import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/hash";

describe("password hashing", () => {
  it("verifies a password against the stored hash", () => {
    const hash = hashPassword("SecurePass123!");

    expect(verifyPassword("SecurePass123!", hash)).toBe(true);
    expect(verifyPassword("WrongPass123!", hash)).toBe(false);
  });
});
