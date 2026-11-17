import { describe, expect, it } from "vitest";

import { GET, POST } from "@/app/[username]/route";

function context(username: string): { params: Promise<{ username: string }> } {
  return { params: Promise.resolve({ username }) };
}

describe("dynamic username route", () => {
  it.each(["register", "api", "nearguard.mobileconfig", "favicon.ico"])(
    "returns a plain 404 for reserved or dotted name %s",
    async (username) => {
      const response = await GET(
        new Request(`http://localhost/${username}`),
        context(username),
      );

      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("text/plain");
      expect(await response.text()).toBe("Not Found");
    },
  );

  it("returns a plain 404 for reserved names on POST", async () => {
    const response = await POST(
      new Request("http://localhost/register", { method: "POST" }),
      context("register"),
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("keeps the free DoH info page for ordinary usernames", async () => {
    const response = await GET(
      new Request("http://localhost/someone"),
      context("someone"),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("DoH endpoint");
  });
});
