export const BLOCK_CATEGORIES = {
  ads: 1,
  trackers: 2,
  malware: 4,
  phishing: 8,
  scam: 16,
  cryptoScam: 32,
  gambling: 64,
} as const;

export type BlockCategory = keyof typeof BLOCK_CATEGORIES;

export const DEFAULT_CATEGORIES =
  BLOCK_CATEGORIES.ads |
  BLOCK_CATEGORIES.trackers |
  BLOCK_CATEGORIES.malware |
  BLOCK_CATEGORIES.phishing |
  BLOCK_CATEGORIES.scam |
  BLOCK_CATEGORIES.cryptoScam;

export const CATEGORY_ORDER: readonly BlockCategory[] = [
  "ads",
  "trackers",
  "malware",
  "phishing",
  "scam",
  "cryptoScam",
  "gambling",
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  ads: "Iklan",
  trackers: "Pelacak",
  malware: "Malware",
  phishing: "Phishing",
  scam: "Penipuan",
  cryptoScam: "Penipuan kripto",
  gambling: "Judi online",
};

export function categoryMask(categories: readonly BlockCategory[]): number {
  let mask = 0;
  for (const category of categories) {
    mask |= BLOCK_CATEGORIES[category];
  }
  return mask;
}

export function categoriesFromMask(mask: number): BlockCategory[] {
  return CATEGORY_ORDER.filter(
    (category) => (mask & BLOCK_CATEGORIES[category]) !== 0,
  );
}

export function categoryEnabled(mask: number, category: BlockCategory): boolean {
  return (mask & BLOCK_CATEGORIES[category]) !== 0;
}
