import { beforeEach, describe, expect, it } from "vitest";

import {
  clearTierCache,
  resolveTier,
  setTierCache,
  type TierInfo,
} from "@/lib/tiers";

const activeUser: TierInfo = {
  tier: "registered",
  username: "alice",
  userId: "user-1",
  status: "active",
  logBlocked: true,
  categories: 63,
};

describe("tier cache", () => {
  beforeEach(() => {
    clearTierCache();
  });

  it("returns null for unknown and invalid usernames", () => {
    expect(resolveTier("alice", 0)).toBeNull();
    expect(resolveTier("LOGIN", 0)).toBeNull();
    expect(resolveTier("ab", 0)).toBeNull();
  });

  it("returns a cached registered user", () => {
    setTierCache("alice", activeUser, 0);
    expect(resolveTier("alice", 1_000)).toEqual(activeUser);
  });

  it("expires positive cache entries", () => {
    setTierCache("alice", activeUser, 0);
    expect(resolveTier("alice", 61_000)).toBeNull();
  });

  it("allows a positive entry to replace a negative one", () => {
    expect(resolveTier("bob", 0)).toBeNull();
    setTierCache("bob", activeUser, 20_000);
    expect(resolveTier("bob", 21_000)).toEqual(activeUser);
  });

  it("ignores invalid usernames when seeding the cache", () => {
    setTierCache("LOGIN", activeUser, 0);
    expect(resolveTier("LOGIN", 1_000)).toBeNull();
  });
});
