import { describe, expect, it } from "vitest";

import { CHANGELOG, type ChangelogTag } from "@/content/changelog";
import { APP_VERSION, APP_VERSION_DISPLAY, RELEASE_DATE } from "@/lib/version";

const TAGS: readonly ChangelogTag[] = [
  "Baru",
  "Perbaikan",
  "Perubahan",
  "Keamanan",
];

describe("version and changelog", () => {
  it("has a changelog entry for the current version", () => {
    expect(CHANGELOG.some((entry) => entry.version === APP_VERSION)).toBe(true);
  });

  it("uses the display version in the changelog entry", () => {
    expect(APP_VERSION_DISPLAY).toBe(`v${APP_VERSION}`);
  });

  it("keeps changelog entries newest first", () => {
    const dates = CHANGELOG.map((entry) => entry.date);
    const sorted = [...dates].sort((left, right) => right.localeCompare(left));
    expect(dates).toEqual(sorted);
  });

  it("uses only known changelog tags", () => {
    for (const entry of CHANGELOG) {
      expect(entry.date <= RELEASE_DATE).toBe(true);
      for (const item of entry.items) {
        expect(TAGS).toContain(item.tag);
      }
    }
  });
});
