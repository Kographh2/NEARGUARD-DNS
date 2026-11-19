"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/perangkat", label: "Perangkat" },
  { href: "/admin/rate-limit", label: "Rate limit" },
  { href: "/admin/blocklist", label: "Blocklist" },
  { href: "/admin/keamanan", label: "Keamanan" },
] as const;

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi admin" className="admin-nav">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(`${item.href}/`) || pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
