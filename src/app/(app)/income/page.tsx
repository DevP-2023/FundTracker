"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function IncomePage() {
  const [transactions, setTransactions] = useState<{
    id: string; type: string; description?: string; amount: number; date: string;
    category?: { name: string; icon?: string; color?: string }; account?: { name: string };
  }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transactions?type=income&limit=50");
    const data = await res.json();
    setTransactions(data.transactions || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this income?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  const grandTotal = transactions.reduce((s, tx) => s + tx.amount, 0);

  // Group by source/category
  const sourceMap = transactions.reduce<Record<string, number>>((acc, tx) => {
    const key = tx.category?.name || "Other";
    acc[key] = (acc[key] || 0) + tx.amount;
    return acc;
  }, {});
  const sourcesChart = Object.entries(sourceMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>Income 💰</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Total: <span style={{ color: "#10b981", fontWeight: "700" }}>{formatCurrency(grandTotal)}</span>
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Income</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Summary Cards */}
        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Income by Source</h3>
          {sourcesChart.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sourcesChart.slice(0, 5).map((s, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>{s.name}</span>
                    <span style={{ color: "#10b981", fontWeight: "700" }}>{formatCurrency(s.value)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${grandTotal > 0 ? (s.value / grandTotal) * 100 : 0}%`, background: "#10b981" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>💰</div>No income recorded
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Income Breakdown</h3>
          {sourcesChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourcesChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px" }}
                  formatter={(v: number) => [formatCurrency(v), "Amount"]}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No data yet</div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Source/Category</th>
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: "16px" }} /></td>)}</tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>💰</div>
                  No income recorded yet
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: "13px" }}>{formatDate(tx.date)}</td>
                  <td style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "13px" }}>{tx.description || "—"}</td>
                  <td>
                    {tx.category && (
                      <span style={{ fontSize: "13px" }}>{tx.category.icon} {tx.category.name}</span>
                    )}
                  </td>
                  <td style={{ fontSize: "13px" }}>{tx.account?.name || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", fontSize: "14px", color: "#10b981" }}>
                    +{formatCurrency(tx.amount)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => { setEditingTx(tx); setShowModal(true); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", marginRight: "8px" }}>✏️</button>
                    <button onClick={() => handleDelete(tx.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <AddTransactionModal transaction={editingTx} onClose={() => { setShowModal(false); setEditingTx(null); }} onSuccess={load} />}
    </div>
  );
}
