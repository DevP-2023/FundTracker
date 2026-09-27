"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
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
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
          }}>💼</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-primary)" }}>
            Capital<span className="gradient-text">Nest</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "14px" }}>
            Your complete financial portfolio manager
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px", padding: "12px", marginBottom: "20px",
              color: "#ef4444", fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "12px",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "20px",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-card)")}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19.1 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.3-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.4C9.7 35.5 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C42.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-3.9z"/>
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>or sign in with email</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label className="form-label">Email address</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px", marginTop: "4px" }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "14px", marginTop: "24px" }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px", marginTop: "24px" }}>
          🔒 Your financial data is encrypted and secure
        </p>
      </div>
    </div>
  );
}
