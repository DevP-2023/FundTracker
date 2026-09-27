"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function LoansPage() {
  const [loans, setLoans] = useState<{
    id: string; type: string; personName: string; amount: number; remainingAmount: number;
    purpose?: string; status: string; date: string; dueDate?: string;
    repayments: { id: string; amount: number; date: string; notes?: string }[];
  }[]>([]);
  const [summary, setSummary] = useState({ totalLent: 0, totalBorrowed: 0, totalReceivable: 0, totalPayable: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [showRepay, setShowRepay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"lent" | "borrowed">("lent");
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    type: "lent", personName: "", amount: "", purpose: "",
    date: new Date().toISOString().split("T")[0], dueDate: "", notes: "", accountId: "",
  });
  const [repayForm, setRepayForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], notes: "", accountId: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [loanRes, accRes] = await Promise.all([fetch("/api/loans"), fetch("/api/accounts")]);
    const [loanData, accData] = await Promise.all([loanRes.json(), accRes.json()]);
    setLoans(loanData.loans || []);
    setSummary(loanData.summary || {});
    setAccounts(accData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/loans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowAdd(false);
    load();
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/loans/${showRepay}/repay`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(repayForm),
    });
    setShowRepay(null);
    load();
  };

  const filtered = loans.filter(l => l.type === activeTab);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#10b981" };
      case "overdue": return { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", color: "#ef4444" };
      case "partially_paid": return { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", color: "#f59e0b" };
      default: return { bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)", color: "#94a3b8" };
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Lending & Borrowing 🤝</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Track money owed and receivable</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Record</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Lent", value: formatCurrency(summary.totalLent), color: "#8b5cf6", emoji: "🤲" },
          { label: "Total Borrowed", value: formatCurrency(summary.totalBorrowed), color: "#f97316", emoji: "🤝" },
          { label: "Receivable", value: formatCurrency(summary.totalReceivable), color: "#10b981", emoji: "📥" },
          { label: "Payable", value: formatCurrency(summary.totalPayable), color: "#ef4444", emoji: "📤" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: "24px" }}>{s.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--bg-card)", borderRadius: "10px", padding: "4px", border: "1px solid var(--border-subtle)", marginBottom: "20px", width: "fit-content" }}>
        {(["lent", "borrowed"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "8px 24px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: activeTab === tab ? "var(--accent-blue)" : "transparent",
            color: activeTab === tab ? "white" : "var(--text-secondary)",
            fontWeight: "600", fontSize: "14px", transition: "all 0.15s",
          }}>
            {tab === "lent" ? "🤲 Money Lent" : "🤝 Money Borrowed"}
          </button>
        ))}
      </div>

      {/* Loans List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />)
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>{activeTab === "lent" ? "🤲" : "🤝"}</div>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>
              No {activeTab === "lent" ? "lending" : "borrowing"} records
            </div>
            <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: "12px" }}>
              + Add {activeTab === "lent" ? "Lending" : "Borrowing"} Record
            </button>
          </div>
        ) : (
          filtered.map(loan => {
            const sc = getStatusColor(loan.status);
            const paidPct = loan.amount > 0 ? ((loan.amount - loan.remainingAmount) / loan.amount) * 100 : 0;
            return (
              <div key={loan.id} className="glass-card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: "16px", flex: 1 }}>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "14px",
                      background: activeTab === "lent" ? "rgba(139,92,246,0.1)" : "rgba(249,115,22,0.1)",
                      border: `1px solid ${activeTab === "lent" ? "rgba(139,92,246,0.2)" : "rgba(249,115,22,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0,
                    }}>
                      {activeTab === "lent" ? "🤲" : "🤝"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)" }}>{loan.personName}</span>
                        <span style={{
                          fontSize: "11px", padding: "2px 10px", borderRadius: "100px",
                          background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontWeight: "600",
                        }}>{loan.status.replace("_", " ")}</span>
                      </div>
                      {loan.purpose && (
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          {loan.purpose}
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatDate(loan.date)}
                        {loan.dueDate && ` • Due: ${formatDate(loan.dueDate)}`}
                      </div>

                      {/* Progress */}
                      <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                          <span style={{ color: "var(--text-muted)" }}>
                            Paid: {formatCurrency(loan.amount - loan.remainingAmount)}
                          </span>
                          <span style={{ color: loan.remainingAmount > 0 ? (activeTab === "lent" ? "#8b5cf6" : "#f97316") : "#10b981", fontWeight: "600" }}>
                            Remaining: {formatCurrency(loan.remainingAmount)}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{
                            width: `${paidPct}%`,
                            background: paidPct >= 100 ? "#10b981" : (activeTab === "lent" ? "#8b5cf6" : "#f97316"),
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", marginLeft: "16px" }}>
                    <div style={{ fontSize: "22px", fontWeight: "800", color: activeTab === "lent" ? "#8b5cf6" : "#f97316" }}>
                      {formatCurrency(loan.amount)}
                    </div>
                    {loan.remainingAmount > 0 && (
                      <button
                        className="btn-secondary"
                        onClick={() => { setShowRepay(loan.id); setRepayForm({ amount: String(loan.remainingAmount), date: new Date().toISOString().split("T")[0], notes: "", accountId: "" }); }}
                        style={{ marginTop: "8px", padding: "6px 14px", fontSize: "13px" }}
                      >
                        Record Repayment
                      </button>
                    )}
                  </div>
                </div>

                {/* Repayment history */}
                {loan.repayments.length > 0 && (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", marginBottom: "8px" }}>
                      REPAYMENT HISTORY ({loan.repayments.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {loan.repayments.map(r => (
                        <div key={r.id} style={{
                          fontSize: "12px", padding: "4px 10px", borderRadius: "6px",
                          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)",
                          color: "#10b981",
                        }}>
                          {formatCurrency(r.amount)} on {formatDate(r.date)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Add Lending / Borrowing</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleAddLoan} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[{ v: "lent", l: "🤲 Money Lent", c: "#8b5cf6" }, { v: "borrowed", l: "🤝 Money Borrowed", c: "#f97316" }].map(t => (
                    <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, type: t.v }))}
                      style={{
                        padding: "12px", borderRadius: "10px",
                        border: `1px solid ${form.type === t.v ? t.c : "var(--border)"}`,
                        background: form.type === t.v ? `${t.c}18` : "var(--bg-secondary)",
                        color: form.type === t.v ? t.c : "var(--text-secondary)",
                        cursor: "pointer", fontWeight: "600", fontSize: "14px",
                      }}>{t.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Person Name *</label>
                <input className="input-field" placeholder="Person's name" value={form.personName}
                  onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input className="input-field" type="number" placeholder="5000" min="1" step="0.01"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Account</label>
                  <select className="input-field" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                    <option value="">None</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Purpose</label>
                <input className="input-field" placeholder="Personal loan, Emergency, etc." value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Date *</label>
                  <input className="input-field" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input className="input-field" type="date" value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Modal */}
      {showRepay && (
        <div className="modal-overlay" onClick={() => setShowRepay(null)}>
          <div className="modal-box" style={{ maxWidth: "400px" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Record Repayment</h2>
              <button onClick={() => setShowRepay(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleRepay} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input className="input-field" type="number" min="1" step="0.01"
                  value={repayForm.amount} onChange={e => setRepayForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="input-field" type="date" value={repayForm.date}
                  onChange={e => setRepayForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Account</label>
                <select className="input-field" value={repayForm.accountId} onChange={e => setRepayForm(f => ({ ...f, accountId: e.target.value }))}>
                  <option value="">None</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <input className="input-field" value={repayForm.notes} onChange={e => setRepayForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowRepay(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Record Repayment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
