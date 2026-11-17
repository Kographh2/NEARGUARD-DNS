export const BRAND = "NEAR ADGUARD";
export const DOMAIN = "dns.nearguard.biz.id";
export const APP_URL = `https://${DOMAIN}`;
export const FREE_DOH_URL = `${APP_URL}/dns-query`;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z][a-z0-9_-]{2,19}$/;
export const DEVICE_LABEL_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;

const RESERVED_USERNAME_LIST = [
  "admin",
  "api",
  "dashboard",
  "login",
  "register",
  "logout",
  "dns-query",
  "privacy",
  "nearguard",
  "nearguard.mobileconfig",
  "_next",
  "static",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "support",
  "help",
  "root",
  "system",
  "null",
  "undefined",
  "forgot-password",
  "reset-password",
  "auth",
  "callback",
  "device",
  "devices",
  "settings",
  "profile",
  "security",
  "billing",
  "terms",
  "about",
  "contact",
  "status",
  "health",
  "test",
  "test-block",
  "install",
  "faq",
  "docs",
  "blog",
  "changelog",
  "pricing",
  "features",
  "how-it-works",
  "welcome",
  "verify",
  "confirm",
  "unsubscribe",
  "account",
  "accounts",
  "signin",
  "signup",
  "sign-in",
  "sign-up",
  "user",
  "users",
  "me",
  "app",
  "www",
  "mail",
  "smtp",
  "imap",
  "pop",
  "dns",
  "doh",
  "resolve",
  "resolver",
  "query",
  "mobileconfig",
  "apple",
  "ios",
  "macos",
  "android",
  "windows",
  "linux",
  "cdn",
  "edge",
  "function",
  "functions",
  "cron",
  "webhook",
  "webhooks",
  "ops",
  "internal",
  "private",
  "public",
  "new",
  "edit",
  "delete",
  "create",
  "update",
  "search",
  "explore",
  "download",
  "downloads",
  "upload",
  "uploads",
  "files",
  "file",
  "images",
  "image",
  "media",
  "video",
  "audio",
  "music",
  "news",
  "events",
  "event",
  "stats",
  "statistics",
  "analytics",
  "metrics",
  "monitor",
  "monitoring",
  "logs",
  "log",
  "audit",
  "reports",
  "report",
  "export",
  "import",
  "backup",
  "backups",
  "restore",
  "maintenance",
  "upgrade",
  "updates",
  "release",
  "releases",
  "beta",
  "alpha",
  "preview",
  "staging",
  "prod",
  "production",
  "dev",
  "development",
  "sandbox",
  "demo",
  "example",
  "sample",
  "documentation",
  "guide",
  "guides",
  "manual",
  "license",
  "licenses",
  "legal",
  "copyright",
  "dmca",
  "abuse",
  "security.txt",
  "humans.txt",
  "manifest.json",
  "apple-touch-icon.png",
  "icon.svg",
  "opengraph-image.png",
  "twitter-image.png",
  "favicon.svg",
  "404",
  "500",
  "error",
  "not-found",
  "loading",
  "layout",
  "page",
  "route",
  "template",
  "default",
  "global-error",
  "sitemap",
] as const;

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set(
  RESERVED_USERNAME_LIST,
);

export const RESERVED_TOP_LEVEL_SEGMENTS: ReadonlySet<string> = new Set(
  RESERVED_USERNAME_LIST,
);

export function isReservedUsername(value: string): boolean {
  return RESERVED_USERNAMES.has(value.trim().toLowerCase());
}

export function isUnroutableUsername(value: string): boolean {
  return value.includes(".") || isReservedUsername(value);
}

export const RATE_LIMITS = {
  free: {
    perMinute: 120,
    perDay: 3_000,
  },
  registered: {
    perMinute: 200,
    perDay: 8_000,
  },
  devicePerMinute: 100,
  registeredIpPerMinute: 300,
  unknownPerMinute: 20,
  newDevicesPerHour: 20,
} as const;

export const CIRCUIT_BREAKER_THRESHOLDS = {
  freeSoft: 0.6,
  freeHard: 0.75,
  registered: 0.9,
  all: 0.95,
} as const;

export const HOBBY_MONTHLY_INVOCATIONS = 1_000_000;

export const RETENTION_DEFAULTS = {
  blockedEventsDays: 14,
  usageDailyDays: 90,
  idleDevicesDays: 30,
} as const;

export const DECOY_ROTATION_SECONDS = 600;

export const UPSTREAM_DOH_URL = "https://cloudflare-dns.com/dns-query";
export const UPSTREAM_FALLBACK_DOH_URL = "https://dns.google/dns-query";
export const UPSTREAM_TIMEOUT_MS = 2_500;
export const BLOCK_MODE = "NXDOMAIN" as const;
export const BLOCKED_TTL_SECONDS = 60;
export const MAX_DNS_MESSAGE_BYTES = 4_096;
export const MAX_USERNAME_PATH_LENGTH = 128;
export const DNS_CONTENT_TYPE = "application/dns-message";

export const SESSION_COOKIE_NAME = "nearguard_session";
export const REVEAL_COOKIE_NAME = "nearguard_reveal";
export const REVEAL_SESSION_SECONDS = 300;
export const PIN_MAX_FAILED_ATTEMPTS = 5;
export const PIN_LOCKOUT_MINUTES = 15;
export const PIN_LENGTH = 8;
