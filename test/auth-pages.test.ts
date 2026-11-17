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

  it("keeps public auth links on page routes", () => {
    for (const file of [
      "components/site-header.tsx",
      "components/site-footer.tsx",
    ]) {
      const source = read(file);
      expect(source).toContain('href="/login"');
      expect(source).toContain('href="/register"');
    }
    expect(read("app/page.tsx")).toContain('href="/register"');
  });

  it("posts register and login forms to the auth API routes", () => {
    expect(read("app/(auth)/register/page.tsx")).toContain(
      'action="/api/auth/register"',
    );
    expect(read("app/(auth)/login/page.tsx")).toContain(
      'action="/api/auth/login"',
    );
  });

  it("renders the register fields, password toggles, and Turnstile", () => {
    const source = read("app/(auth)/register/page.tsx");
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
    const source = read("app/(auth)/login/page.tsx");
    expect(source).toContain("<TurnstileWidget");
    expect(source).toContain('action="login"');
  });
});
