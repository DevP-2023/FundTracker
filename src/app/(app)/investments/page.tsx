"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const INVESTMENT_TYPES = ["stock", "etf", "mutual_fund", "bond", "crypto", "other"];

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<{
    id: string; name: string; symbol?: string; type: string; exchange?: string;
    quantity: number; avgBuyPrice: number; currentPrice: number;
    investedAmount: number; currentValue: number; notes?: string;
  }[]>([]);
  const [summary, setSummary] = useState({ totalInvested: 0, currentValue: 0, totalPnL: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: "", symbol: "", type: "stock", exchange: "NSE",
    quantity: "", buyPrice: "", currentPrice: "", date: new Date().toISOString().split("T")[0],
    brokerage: "0", notes: "", accountId: "",
  });
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, accRes] = await Promise.all([
      fetch("/api/investments"),
      fetch("/api/accounts"),
    ]);
    const [invData, accData] = await Promise.all([invRes.json(), accRes.json()]);
    setInvestments(invData.investments || []);
    setSummary(invData.summary || {});
    setAccounts(accData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ name: "", symbol: "", type: "stock", exchange: "NSE", quantity: "", buyPrice: "", currentPrice: "", date: new Date().toISOString().split("T")[0], brokerage: "0", notes: "", accountId: "" });
    load();
  };

  const totalPnLPct = summary.totalInvested > 0 ? ((summary.currentValue - summary.totalInvested) / summary.totalInvested) * 100 : 0;

  // Allocation chart data
  const allocationData = investments.map(inv => ({
    name: inv.symbol || inv.name.slice(0, 10),
    value: inv.currentValue,
  }));
  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>Investments 📈</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Portfolio tracker and stock management
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>+ Add Investment</button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Invested", value: formatCurrency(summary.totalInvested), emoji: "💼", color: "#3b82f6" },
          { label: "Current Value", value: formatCurrency(summary.currentValue), emoji: "📊", color: "#8b5cf6" },
          { label: "Total P&L", value: formatCurrency(Math.abs(summary.totalPnL)), emoji: summary.totalPnL >= 0 ? "📈" : "📉", color: summary.totalPnL >= 0 ? "#10b981" : "#ef4444" },
          { label: "Overall Return", value: `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`, emoji: "🎯", color: totalPnLPct >= 0 ? "#10b981" : "#ef4444" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.value}</div>
              </div>
              <span style={{ fontSize: "24px" }}>{s.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", marginBottom: "20px" }}>
        {/* Holdings Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Holdings</h3>
          </div>
          {loading ? (
            <div style={{ padding: "20px" }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: "60px", marginBottom: "8px" }} />)}
            </div>
          ) : investments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📈</div>
              No investments yet. Add your first holding!
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Stock / Fund</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Avg Buy</th>
                  <th>Current</th>
                  <th>Invested</th>
                  <th>Value</th>
                  <th>P&L</th>
                  <th>Return</th>
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const pnl = inv.currentValue - inv.investedAmount;
                  const pct = inv.investedAmount > 0 ? (pnl / inv.investedAmount) * 100 : 0;
                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "13px" }}>
                          {inv.symbol || inv.name.slice(0, 12)}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inv.name}</div>
                        {inv.exchange && <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{inv.exchange}</div>}
                      </td>
                      <td>
                        <span style={{
                          fontSize: "11px", padding: "2px 8px", borderRadius: "6px",
                          background: "rgba(59,130,246,0.1)", color: "#3b82f6", fontWeight: "600",
                          border: "1px solid rgba(59,130,246,0.2)",
                        }}>{inv.type}</span>
                      </td>
                      <td style={{ fontSize: "13px" }}>{inv.quantity}</td>
                      <td style={{ fontSize: "13px" }}>{formatCurrency(inv.avgBuyPrice)}</td>
                      <td style={{ fontSize: "13px" }}>{formatCurrency(inv.currentPrice)}</td>
                      <td style={{ fontSize: "13px" }}>{formatCurrency(inv.investedAmount)}</td>
                      <td style={{ fontSize: "13px", fontWeight: "600" }}>{formatCurrency(inv.currentValue)}</td>
                      <td style={{ fontSize: "13px", fontWeight: "700", color: pnl >= 0 ? "#10b981" : "#ef4444" }}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                      </td>
                      <td style={{ fontSize: "13px", fontWeight: "700", color: pct >= 0 ? "#10b981" : "#ef4444" }}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Allocation Chart */}
        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Portfolio Allocation</h3>
          {allocationData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                    formatter={(v: number) => [formatCurrency(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {allocationData.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                      {summary.currentValue > 0 ? ((d.value / summary.currentValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              Add investments to see allocation
            </div>
          )}
        </div>
      </div>

      {/* Add Investment Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Add Investment</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Investment Name *</label>
                  <input className="input-field" placeholder="Reliance Industries" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Symbol / Ticker</label>
                  <input className="input-field" placeholder="RELIANCE" value={form.symbol}
                    onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {INVESTMENT_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ").toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Exchange</label>
                  <select className="input-field" value={form.exchange} onChange={e => setForm(f => ({ ...f, exchange: e.target.value }))}>
                    {["NSE", "BSE", "MCX", "NASDAQ", "NYSE", "OTHER"].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div>
                  <label className="form-label">Quantity *</label>
                  <input className="input-field" type="number" placeholder="10" min="0.001" step="0.001"
                    value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Buy Price (₹) *</label>
                  <input className="input-field" type="number" placeholder="2400" min="0.01" step="0.01"
                    value={form.buyPrice} onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Current Price (₹)</label>
                  <input className="input-field" type="number" placeholder="2650" min="0.01" step="0.01"
                    value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label">Buy Date *</label>
                  <input className="input-field" type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Brokerage (₹)</label>
                  <input className="input-field" type="number" placeholder="0" min="0" step="0.01"
                    value={form.brokerage} onChange={e => setForm(f => ({ ...f, brokerage: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Deduct from Account</label>
                  <select className="input-field" value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                    <option value="">None</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              {form.quantity && form.buyPrice && (
                <div style={{
                  padding: "12px", borderRadius: "10px",
                  background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.1)",
                  fontSize: "13px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Total Investment:</span>
                    <span style={{ color: "#3b82f6", fontWeight: "700" }}>
                      {formatCurrency(parseFloat(form.quantity || "0") * parseFloat(form.buyPrice || "0") + parseFloat(form.brokerage || "0"))}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label className="form-label">Notes</label>
                <textarea className="input-field" rows={2} style={{ resize: "none" }}
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2, justifyContent: "center" }}>
                  {saving ? "Saving..." : "Add Investment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
