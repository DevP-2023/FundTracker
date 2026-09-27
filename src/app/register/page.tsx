"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
    } else {
      router.push("/login?registered=1");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
          }}>💼</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800" }}>
            Wealth<span className="gradient-text">OS</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "14px" }}>
            Start managing your finances today
          </p>
        </div>

        <div className="glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Create your account</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
            Free forever. No credit card required.
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", padding: "12px", marginBottom: "20px",
              color: "#ef4444", fontSize: "14px",
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label className="form-label">Full Name</label>
              <input className="input-field" type="text" placeholder="Your full name"
                value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Email address</label>
              <input className="input-field" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input className="input-field" type="password" placeholder="Min. 8 characters"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input className="input-field" type="password" placeholder="Repeat password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px", marginTop: "4px" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "14px", marginTop: "24px" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>

        <div style={{
          display: "flex", justifyContent: "center", gap: "24px",
          marginTop: "24px", flexWrap: "wrap"
        }}>
          {["✅ Expense Tracking", "📈 Investments", "🎯 Budgets", "🏆 Goals"].map(f => (
            <span key={f} style={{ color: "var(--text-muted)", fontSize: "12px" }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
