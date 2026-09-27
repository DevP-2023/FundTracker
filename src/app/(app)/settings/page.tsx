"use client";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [saved, setSaved] = useState(false);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Settings ⚙️</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Manage your account and preferences
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Profile */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>👤 Profile</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{
              width: "64px", height: "64px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: "18px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "26px", fontWeight: "800", color: "white",
            }}>
              {(session?.user?.name || session?.user?.email || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700" }}>{session?.user?.name || "User"}</div>
              <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>{session?.user?.email}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label className="form-label">Display Name</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="input-field" value={session?.user?.email || ""} disabled style={{ opacity: 0.6 }} />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select className="input-field">
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* App Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>📱 About WealthOS</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Version", value: "1.0.0" },
                { label: "Database", value: "SQLite (Local)" },
                { label: "Framework", value: "Next.js 16" },
                { label: "Currency", value: "₹ INR" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>🔒 Security</h3>
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.6 }}>
              Your financial data is stored locally and encrypted. Passwords are hashed using bcrypt with 12 rounds.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#10b981" }}>
                ✅ Password encrypted (bcrypt)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#10b981" }}>
                ✅ Session-based auth (JWT)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#10b981" }}>
                ✅ Data isolation per user
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#ef4444" }}>⚠️ Danger Zone</h3>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn-danger"
              style={{ width: "100%", justifyContent: "center" }}
            >
              🚪 Sign Out of WealthOS
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="glass-card" style={{ padding: "24px", marginTop: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>🚀 Future Features (Roadmap)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            "📊 Bank Integration", "🤖 AI Categorization", "📸 Receipt OCR",
            "📈 Stock Market API", "💱 Crypto Tracking", "📄 PDF Reports",
            "📧 Email Alerts", "📱 Mobile App",
          ].map((f, i) => (
            <div key={i} style={{
              padding: "12px 16px", borderRadius: "10px",
              background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)",
              fontSize: "13px", color: "var(--text-muted)", fontWeight: "500",
            }}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
