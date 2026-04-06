"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createApiClient } from "../../../lib/api-client";
import { writeStoredAdminSession } from "../../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@medstudy.local");
  const [password, setPassword] = useState("secret");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(undefined);
    try {
      const client = createApiClient();
      const session = await client.login(email, password);
      writeStoredAdminSession(session);
      router.replace(session.adminRole === "support" ? "/live" : "/sessions");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), #f8fafc"
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(440px, calc(100vw - 32px))",
          display: "grid",
          gap: 16,
          padding: 28,
          borderRadius: 24,
          background: "#ffffff",
          border: "1px solid #dbe4f0",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)"
        }}
      >
        <div>
          <div style={{ color: "#64748b", textTransform: "uppercase", fontSize: 12 }}>
            MedStudy OS
          </div>
          <h1 style={{ margin: "4px 0 0" }}>Web Admin Dashboard</h1>
          <p style={{ color: "#475569", marginBottom: 0 }}>
            Backend-authoritative supervisory access for admins and support.
          </p>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            style={{ padding: 12, borderRadius: 14, border: "1px solid #cbd5e1" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            style={{ padding: 12, borderRadius: 14, border: "1px solid #cbd5e1" }}
          />
        </label>

        {error ? (
          <div
            style={{
              borderRadius: 14,
              padding: 12,
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#991b1b"
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "14px 18px",
            background: isLoading ? "#94a3b8" : "#0f172a",
            color: "#ffffff",
            fontWeight: 700
          }}
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
