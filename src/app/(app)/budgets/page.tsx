"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, getBudgetColor, getBudgetTextColor } from "@/lib/utils";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<{
    id: string; amount: number; spentAmount: number; percentage: number; remaining: number;
    category?: { name: string; icon?: string; color?: string }; type: string;
  }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string; type: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: "category", categoryId: "", amount: "", period: "monthly" });

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([fetch("/api/budgets"), fetch("/api/categories")]);
    const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
    setBudgets(bData || []);
    setCategories(cData.filter((c: { type: string }) => c.type === "expense") || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month: now.getMonth() + 1, year: now.getFullYear() }),
    });
    setShowAdd(false);
    load();
  };

  const overallBudget = budgets.find(b => b.type === "overall");
  const categoryBudgets = budgets.filter(b => b.type === "category");
  const totalSpent = categoryBudgets.reduce((s, b) => s + b.spentAmount, 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Budgets 🎯</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Set spending limits and track your progress
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Set Budget</button>
      </div>

      {/* Important notice */}
      <div style={{
        padding: "12px 16px", borderRadius: "12px",
        background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)",
        marginBottom: "24px", fontSize: "13px", color: "var(--text-secondary)",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <span style={{ fontSize: "18px" }}>ℹ️</span>
        <span>Budgets are <strong style={{ color: "#3b82f6" }}>warnings only</strong> — they never block transactions. You can always add expenses even after exceeding a budget.</span>
      </div>

      {/* Overall Budget */}
      {overallBudget && (
        <div className="glass-card" style={{ padding: "24px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Monthly Budget Overview</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Total spending limit this month</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: getBudgetTextColor(overallBudget.percentage).replace("text-", "").replace("-400", "") }}>
                {formatCurrency(overallBudget.spentAmount)}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>of {formatCurrency(overallBudget.amount)}</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: "10px" }}>
            <div className={`progress-fill ${getBudgetColor(overallBudget.percentage)}`}
              style={{ width: `${Math.min(overallBudget.percentage, 100)}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>{overallBudget.percentage.toFixed(1)}% used</span>
            <span style={{ color: overallBudget.remaining >= 0 ? "#10b981" : "#ef4444", fontWeight: "600" }}>
              {overallBudget.remaining >= 0
                ? `${formatCurrency(overallBudget.remaining)} remaining`
                : `⚠️ Exceeded by ${formatCurrency(Math.abs(overallBudget.remaining))}`}
            </span>
          </div>
        </div>
      )}

      {/* Category Budgets */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Category Budgets</h3>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "16px" }} />)}
          </div>
        ) : categoryBudgets.length === 0 ? (
          <div className="glass-card" style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎯</div>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>No category budgets set</div>
            <p style={{ fontSize: "13px", marginBottom: "16px" }}>Create budgets to track your spending by category</p>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Create Budget</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {categoryBudgets.map(b => {
              const alerts = [];
              if (b.percentage >= 100) alerts.push({ icon: "🚨", msg: `Exceeded by ${formatCurrency(b.spentAmount - b.amount)}`, color: "#ef4444" });
              else if (b.percentage >= 90) alerts.push({ icon: "⚠️", msg: `90% used — ${formatCurrency(b.remaining)} left`, color: "#f97316" });
              else if (b.percentage >= 80) alerts.push({ icon: "⚠️", msg: `80% used — ${formatCurrency(b.remaining)} left`, color: "#f59e0b" });

              return (
                <div key={b.id} className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "12px",
                        background: `${b.category?.color || "#3b82f6"}18`,
                        border: `1px solid ${b.category?.color || "#3b82f6"}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "20px",
                      }}>{b.category?.icon || "📊"}</div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                          {b.category?.name || "Overall"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Monthly limit</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--text-primary)" }}>
                        {formatCurrency(b.amount)}
                      </div>
                      <div style={{ fontSize: "12px", color: getBudgetTextColor(b.percentage) === "text-emerald-400" ? "#10b981" : b.percentage >= 100 ? "#ef4444" : b.percentage >= 90 ? "#f97316" : "#f59e0b", fontWeight: "600" }}>
                        {b.percentage.toFixed(0)}% used
                      </div>
                    </div>
                  </div>

                  <div className="progress-bar" style={{ marginBottom: "8px" }}>
                    <div className={`progress-fill ${getBudgetColor(b.percentage)}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Spent: {formatCurrency(b.spentAmount)}</span>
                    <span>Remaining: {formatCurrency(Math.max(0, b.remaining))}</span>
                  </div>

                  {alerts.map((a, i) => (
                    <div key={i} style={{
                      marginTop: "10px", padding: "8px 12px", borderRadius: "8px",
                      background: `${a.color}10`, border: `1px solid ${a.color}20`,
                      fontSize: "12px", color: a.color, fontWeight: "500",
                    }}>
                      {a.icon} {a.msg}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: "420px" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Set Budget</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Budget Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[{ v: "overall", l: "📊 Overall Monthly" }, { v: "category", l: "🏷️ Category" }].map(t => (
                    <button key={t.v} type="button" onClick={() => setForm(f => ({ ...f, type: t.v }))}
                      style={{
                        padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
                        border: `1px solid ${form.type === t.v ? "#3b82f6" : "var(--border)"}`,
                        background: form.type === t.v ? "rgba(59,130,246,0.1)" : "var(--bg-secondary)",
                        color: form.type === t.v ? "#3b82f6" : "var(--text-secondary)", cursor: "pointer",
                      }}>{t.l}</button>
                  ))}
                </div>
              </div>
              {form.type === "category" && (
                <div>
                  <label className="form-label">Category</label>
                  <select className="input-field" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Monthly Limit (₹)</label>
                <input className="input-field" type="number" min="1" step="1" placeholder="5000"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Save Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
