"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function GoalsPage() {
  const [goals, setGoals] = useState<{
    id: string; name: string; description?: string; targetAmount: number; currentAmount: number;
    deadline?: string; color: string; icon: string; status: string;
  }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", description: "", targetAmount: "", currentAmount: "0",
    deadline: "", color: "#3b82f6", icon: "🎯",
  });
  const [addAmount, setAddAmount] = useState<{ id: string; amount: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/goals", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setShowAdd(false);
    setForm({ name: "", description: "", targetAmount: "", currentAmount: "0", deadline: "", color: "#3b82f6", icon: "🎯" });
    load();
  };

  const handleAddContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount) return;
    const goal = goals.find(g => g.id === addAmount.id);
    if (!goal) return;
    const newAmount = goal.currentAmount + parseFloat(addAmount.amount);
    await fetch(`/api/goals/${addAmount.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentAmount: newAmount }),
    });
    setAddAmount(null);
    load();
  };

  const GOAL_ICONS = ["🎯", "🏠", "🚗", "✈️", "💻", "📱", "🎓", "💍", "🏋️", "💰", "🎁", "🏖️"];
  const GOAL_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Financial Goals 🏆</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Track your savings targets and milestones</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Create Goal</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Goals", value: goals.length, emoji: "🏆" },
          { label: "Active", value: goals.filter(g => g.status === "active").length, emoji: "🎯" },
          { label: "Completed", value: goals.filter(g => g.status === "completed").length, emoji: "✅" },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{s.emoji}</div>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>{s.value}</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: "200px", borderRadius: "16px" }} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card" style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏆</div>
          <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px", color: "var(--text-primary)" }}>No goals yet</div>
          <p style={{ marginBottom: "24px" }}>Set a financial goal and track your progress toward it</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ padding: "12px 28px" }}>
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {goals.map(goal => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const isCompleted = pct >= 100;

            return (
              <div key={goal.id} className="glass-card" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
                {/* Glow top border */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: goal.color, borderRadius: "16px 16px 0 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "16px",
                      background: `${goal.color}15`, border: `2px solid ${goal.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "26px",
                    }}>{goal.icon}</div>
                    <div>
                      <div style={{ fontSize: "17px", fontWeight: "700", color: "var(--text-primary)" }}>{goal.name}</div>
                      {goal.description && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{goal.description}</div>}
                      {goal.deadline && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          🗓️ By {formatDate(goal.deadline)}
                        </div>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <span style={{
                      padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "700",
                      background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)",
                    }}>✅ Complete</span>
                  )}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
                      {formatCurrency(goal.currentAmount)} saved
                    </span>
                    <span style={{ color: goal.color, fontWeight: "800" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: "8px" }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color, borderRadius: "100px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Target: {formatCurrency(goal.targetAmount)}</span>
                    <span style={{ color: isCompleted ? "#10b981" : "var(--text-muted)" }}>
                      {isCompleted ? "Goal achieved! 🎉" : `${formatCurrency(remaining)} to go`}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => setAddAmount({ id: goal.id, amount: "" })}
                    className="btn-secondary"
                    style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}
                  >
                    + Add Contribution
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Create Financial Goal</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Goal Name *</label>
                <input className="input-field" placeholder="Buy a Laptop, Emergency Fund..."
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <input className="input-field" placeholder="What is this goal for?"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Target Amount (₹) *</label>
                  <input className="input-field" type="number" min="1" placeholder="100000"
                    value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Current Savings (₹)</label>
                  <input className="input-field" type="number" min="0" placeholder="0"
                    value={form.currentAmount} onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Target Deadline</label>
                <input className="input-field" type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Icon</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))}
                      style={{
                        width: "40px", height: "40px", borderRadius: "10px", fontSize: "20px",
                        border: `2px solid ${form.icon === icon ? form.color : "var(--border)"}`,
                        background: form.icon === icon ? `${form.color}15` : "var(--bg-secondary)",
                        cursor: "pointer",
                      }}>{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Color</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {GOAL_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{
                        width: "32px", height: "32px", borderRadius: "8px", background: c, border: "none", cursor: "pointer",
                        outline: form.color === c ? `3px solid white` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Create Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {addAmount && (
        <div className="modal-overlay" onClick={() => setAddAmount(null)}>
          <div className="modal-box" style={{ maxWidth: "380px" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Add Contribution</h2>
              <button onClick={() => setAddAmount(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleAddContrib} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Amount to Add (₹)</label>
                <input className="input-field" type="number" min="1" placeholder="Enter amount"
                  value={addAmount.amount} onChange={e => setAddAmount(a => a ? { ...a, amount: e.target.value } : null)} required />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setAddAmount(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: "center" }}>Add to Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
