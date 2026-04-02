import { useState } from "react";

export function LoginScreen({
  onLogin
}: {
  onLogin: (email: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("demo@medstudy.local");

  return (
    <main style={screenStyle}>
      <section style={panelStyle}>
        <h1>MedStudy OS Desktop</h1>
        <p>Sign in to reconnect to your current study session or create a new one.</p>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
        />
        <button onClick={() => void onLogin(email)}>Continue</button>
      </section>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(14,116,144,0.14), transparent 40%), #f7f8fa",
  padding: "2rem"
};

const panelStyle: React.CSSProperties = {
  width: "min(480px, 100%)",
  display: "grid",
  gap: "1rem",
  padding: "2rem",
  background: "#fff",
  borderRadius: "1.5rem",
  boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)"
};
