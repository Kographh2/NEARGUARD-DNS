import { describe, expect, it } from "vitest";

import {
  deviceLabelSchema,
  domainSchema,
  firstValidationMessage,
  normalizeDomain,
  passwordStrength,
  registerSchema,
  usernameSchema,
} from "@/lib/validation";

describe("usernameSchema", () => {
  it("normalizes case and whitespace", () => {
    const result = usernameSchema.parse("  Alice_01  ");
    expect(result).toBe("alice_01");
  });

  it("rejects reserved usernames", () => {
    for (const name of [
      "login",
      "register",
      "dashboard",
      "admin",
      "privacy",
      "dns-query",
      "nearguard.mobileconfig",
      "api",
      "_next",
    ]) {
      expect(usernameSchema.safeParse(name).success).toBe(false);
    }
  });

  it("rejects reserved usernames regardless of case", () => {
    expect(usernameSchema.safeParse("LOGIN").success).toBe(false);
    expect(usernameSchema.safeParse("Dashboard").success).toBe(false);
  });

  it("rejects invalid usernames", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("1alice").success).toBe(false);
    expect(usernameSchema.safeParse("-alice").success).toBe(false);
    expect(usernameSchema.safeParse("alice.bob").success).toBe(false);
    expect(usernameSchema.safeParse("alice bob").success).toBe(false);
  });

  it("accepts valid usernames", () => {
    expect(usernameSchema.safeParse("alice").success).toBe(true);
    expect(usernameSchema.safeParse("alice-01").success).toBe(true);
    expect(usernameSchema.safeParse("a_b_c").success).toBe(true);
  });
});

describe("registerSchema", () => {
  const base = {
    name: "Alice Example",
    username: "alice",
    email: "Alice@Example.com",
    password: "correcthorse123",
    confirmPassword: "correcthorse123",
  };

  it("normalizes email and username", () => {
    const parsed = registerSchema.parse(base);
    expect(parsed.email).toBe("alice@example.com");
    expect(parsed.username).toBe("alice");
  });

  it("rejects mismatched passwords", () => {
    expect(
      registerSchema.safeParse({
        ...base,
        confirmPassword: "different123",
      }).success,
    ).toBe(false);
  });

  it("rejects weak passwords", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "short1" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "allletterslong" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, password: "password1234" }).success,
    ).toBe(false);
  });

  it("returns a clear message for missing fields", () => {
    const parsed = registerSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(firstValidationMessage(parsed.error)).toBe(
        "Isi semua kolom wajib dan coba lagi.",
      );
    }
  });
});

describe("domainSchema", () => {
  it("normalizes domains", () => {
    expect(normalizeDomain(" Example.COM. ")).toBe("example.com");
    expect(domainSchema.parse(" Example.COM. ")).toBe("example.com");
  });

  it("rejects invalid domains", () => {
    expect(domainSchema.safeParse("not a domain").success).toBe(false);
    expect(domainSchema.safeParse("localhost").success).toBe(false);
    expect(domainSchema.safeParse("-bad.example").success).toBe(false);
    expect(domainSchema.safeParse("example").success).toBe(false);
  });

  it("accepts valid domains", () => {
    expect(domainSchema.safeParse("ads.example.com").success).toBe(true);
    expect(domainSchema.safeParse("xn--bcher-kva.example").success).toBe(true);
  });
});

describe("deviceLabelSchema", () => {
  it("normalizes device labels", () => {
    expect(deviceLabelSchema.parse(" iPhone-01 ")).toBe("iphone-01");
  });

  it("rejects invalid device labels", () => {
    expect(deviceLabelSchema.safeParse("bad label").success).toBe(false);
    expect(deviceLabelSchema.safeParse("").success).toBe(false);
  });
});

describe("passwordStrength", () => {
  it("scores passwords monotonically", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abcdefghijkl").score).toBe(1);
    expect(passwordStrength("Abcdefgh1234!").score).toBe(3);
    expect(passwordStrength("Abcdefgh12345678!").score).toBe(4);
  });
});
