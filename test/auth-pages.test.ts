import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function tsxFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(join(ROOT, directory), {
    withFileTypes: true,
  })) {
    const relative = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...tsxFiles(relative));
      continue;
    }
    if (entry.name.endsWith(".tsx")) {
      files.push(relative);
    }
  }
  return files;
}

function read(relative: string): string {
  return readFileSync(join(ROOT, relative), "utf8");
}

describe("auth links and forms", () => {
  it("never points page links at API routes", () => {
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      expect(read(file)).not.toMatch(/href=["']\/api\//);
    }
  });

  it("keeps guest auth links on page routes", () => {
    const account = read("components/site-account.tsx");
    expect(account).toContain('href="/login"');
    expect(account).toContain('href="/register"');
    expect(account).toContain('action="/api/auth/logout"');
    const state = read("components/use-signed-in.ts");
    expect(state).toContain("useSyncExternalStore");
    expect(state).toContain("AUTH_CHANGE_EVENT");
    expect(state).toContain("document.cookie");
    expect(read("app/(site)/page.tsx")).toContain('href="/register"');
  });

  it("renders the session-aware account menu instead of static auth links", () => {
    const header = read("components/site-header.tsx");
    expect(header).toContain("<SiteAccountNav />");
    expect(header).not.toContain('href="/login"');
    expect(header).not.toContain('href="/register"');
  });

  it("posts register and login forms to the auth API routes", () => {
    expect(read("app/(site)/(auth)/register/page.tsx")).toContain(
      'action="/api/auth/register"',
    );
    expect(read("app/(site)/(auth)/login/page.tsx")).toContain(
      'action="/api/auth/login"',
    );
  });

  it("renders the register fields, password toggles, and Turnstile", () => {
    const source = read("app/(site)/(auth)/register/page.tsx");
    for (const field of [
      'name="name"',
      'name="username"',
      'name="email"',
      'name="password"',
      'name="confirmPassword"',
    ]) {
      expect(source).toContain(field);
    }
    expect(source).toContain("<PasswordField");
    expect(source).toContain("<TurnstileWidget");
    expect(source).toContain('action="register"');
  });

  it("renders Turnstile on the login form", () => {
    const source = read("app/(site)/(auth)/login/page.tsx");
    expect(source).toContain("<TurnstileWidget");
    expect(source).toContain('action="login"');
  });

  it("checks the dashboard session, provides logout, and offers profiles", () => {
    const source = read("app/(site)/dashboard/page.tsx");
    expect(source).toContain("getUser");
    expect(source).toContain('export const dynamic = "force-dynamic"');
    expect(source).toContain('action="/api/auth/logout"');
    expect(source).toContain("/dashboard/install/");
    expect(source).toContain("PROFILE_SIGNER_NAME");
  });

  it("redirects an existing session away from the login page", () => {
    const source = read("app/(site)/(auth)/login/page.tsx");
    expect(source).toContain('redirect("/dashboard")');
  });

  it("guards the admin layout and renders the sidebar", () => {
    const layout = read("app/admin/layout.tsx");
    expect(layout).toContain("requireAdmin");
    expect(layout).toContain("<AdminSidebarNav />");
    expect(layout).toContain('export const dynamic = "force-dynamic"');
    expect(read("lib/admin.ts")).toContain('redirect("/dashboard")');
  });
});
