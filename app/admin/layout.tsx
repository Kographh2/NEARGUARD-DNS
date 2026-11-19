import type { Metadata } from "next";
import Link from "next/link";

import { AdminSidebarNav } from "@/components/admin-sidebar";
import { requireAdmin } from "@/lib/admin";
import { BRAND } from "@/lib/constants";
import { APP_VERSION_DISPLAY } from "@/lib/version";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: `%s · Admin ${BRAND}`,
  },
  description: "Konsol administrasi NEAR ADGUARD.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireAdmin();

  return (
    <div className="admin-shell">
      <a href="#main" className="skip-link">
        Lewati ke konten
      </a>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin">{BRAND}</Link>
          <span>Konsol admin</span>
        </div>

        <AdminSidebarNav />

        <div className="admin-sidebar-footer">
          <p>
            <strong>{profile.username}</strong>
            <br />
            {user.email}
          </p>
          <Link href="/">Lihat situs</Link>
          <form action="/api/auth/logout" method="post" className="nav-form">
            <button type="submit" className="nav-button">
              Keluar
            </button>
          </form>
          <p>Admin {APP_VERSION_DISPLAY}</p>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <span>NEAR ADGUARD admin</span>
          <span>Status akun: {profile.status}</span>
        </header>
        <main id="main" className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
