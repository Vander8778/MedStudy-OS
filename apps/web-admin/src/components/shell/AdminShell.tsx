"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  clearStoredAdminSession,
  readStoredAdminSession,
  type AdminSession
} from "../../lib/auth";
import { getVisibleNavItems } from "../../lib/permissions";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const nextSession = readStoredAdminSession();
    if (!nextSession) {
      router.replace("/login");
      return;
    }

    setSession(nextSession);
    setReady(true);
  }, [router]);

  if (!ready || !session) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "#475569" }}>Checking admin access…</p>
      </main>
    );
  }

  const navItems = getVisibleNavItems(session.adminRole);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        background:
          "radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 35%), #f8fafc"
      }}
    >
      <aside
        style={{
          padding: 24,
          borderRight: "1px solid #dbe4f0",
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)"
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", color: "#64748b" }}>
            MedStudy OS
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>Admin</div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: "none",
                  borderRadius: 14,
                  padding: "12px 14px",
                  color: active ? "#0f172a" : "#334155",
                  background: active ? "#dbeafe" : "transparent",
                  fontWeight: active ? 700 : 500
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div style={{ display: "grid", gridTemplateRows: "auto 1fr" }}>
        <header
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #dbe4f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(248,250,252,0.84)",
            backdropFilter: "blur(10px)"
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{session.user.email}</div>
            <div style={{ color: "#64748b", fontSize: 14 }}>{session.adminRole}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearStoredAdminSession();
              router.replace("/login");
            }}
            style={{
              borderRadius: 999,
              border: "1px solid #cbd5e1",
              padding: "10px 14px",
              background: "#fff"
            }}
          >
            Log out
          </button>
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}
