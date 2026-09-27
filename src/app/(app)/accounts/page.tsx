"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

const ACCOUNT_TYPES = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "bank", label: "Bank Account", icon: "🏦" },
  { value: "savings", label: "Savings Account", icon: "💰" },
  { value: "credit_card", label: "Credit Card", icon: "💳" },
  { value: "upi", label: "UPI / Digital", icon: "📱" },
  { value: "investment", label: "Investment Account", icon: "📈" },
  { value: "wallet", label: "Wallet", icon: "👛" },
];

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316"];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<{
    id: string; name: string; type: string; balance: number; icon?: string; color?: string;
  }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", type: "bank", balance: "0", icon: "🏦", color: "#3b82f6",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/accounts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setShowAdd(false);
    load();
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Accounts & Wallets 🏦</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Manage your bank accounts, wallets, and payment methods
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Account</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Balance", value: formatCurrency(totalBalance), emoji: "🏦", color: "#3b82f6" },
          { label: "Total Assets", value: formatCurrency(totalAssets), emoji: "💰", color: "#10b981" },
          { label: "Total Liabilities", value: formatCurrency(totalLiabilities), emoji: "💳", color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: "28px" }}>{s.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: "140px", borderRadius: "16px" }} />)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {accounts.map(acc => {
            const typeInfo = ACCOUNT_TYPES.find(t => t.value === acc.type);
            return (
              <div key={acc.id} className="glass-card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                  background: acc.color || "#3b82f6",
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "14px",
                      background: `${acc.color || "#3b82f6"}15`,
                      border: `1px solid ${acc.color || "#3b82f6"}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px", marginBottom: "12px",
                    }}>
                      {acc.icon || typeInfo?.icon || "🏦"}
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>{acc.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {typeInfo?.label || acc.type}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "22px", fontWeight: "800",
                      color: acc.balance >= 0 ? "var(--text-primary)" : "#ef4444",
                    }}>
                      {formatCurrency(acc.balance)}
                    </div>
                    <div style={{
                      fontSize: "11px", marginTop: "4px", padding: "2px 8px",
                      borderRadius: "6px", display: "inline-block",
                      background: acc.balance >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: acc.balance >= 0 ? "#10b981" : "#ef4444",
                      fontWeight: "600",
                    }}>
                      {acc.balance >= 0 ? "Positive" : "Negative"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Account Card */}
          <button onClick={() => setShowAdd(true)} style={{
            border: "2px dashed var(--border)", borderRadius: "16px",
            background: "transparent", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "40px", gap: "8px", transition: "all 0.2s", color: "var(--text-muted)",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLButtonElement).style.color = "#3b82f6"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
          >
            <span style={{ fontSize: "32px" }}>+</span>
            <span style={{ fontSize: "14px", fontWeight: "600" }}>Add Account</span>
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: "440px" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Add Account</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Account Name *</label>
                <input className="input-field" placeholder="HDFC Savings, PhonePe, etc."
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Account Type *</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {ACCOUNT_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setForm(f => ({ ...f, type: t.value, icon: t.icon }))}
                      style={{
                        padding: "8px 4px", borderRadius: "8px", fontSize: "11px", fontWeight: "600",
                        border: `1px solid ${form.type === t.value ? "#3b82f6" : "var(--border)"}`,
                        background: form.type === t.value ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                        color: form.type === t.value ? "#3b82f6" : "var(--text-secondary)",
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                      }}>
                      <span style={{ fontSize: "16px" }}>{t.icon}</span>
                      {t.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Opening Balance (₹)</label>
                <input className="input-field" type="number" step="0.01" placeholder="0"
                  value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Color</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{
                        width: "32px", height: "32px", borderRadius: "8px", background: c, border: "none", cursor: "pointer",
                        outline: form.color === c ? "3px solid white" : "none", outlineOffset: "2px",
                      }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
