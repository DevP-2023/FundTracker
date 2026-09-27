"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, getTransactionBg } from "@/lib/utils";
import { AddTransactionModal } from "@/components/AddTransactionModal";

export default function ExpensesPage() {
  const [transactions, setTransactions] = useState<{
    id: string; type: string; description?: string; amount: number; date: string;
    category?: { name: string; icon?: string; color?: string }; account?: { name: string };
  }[]>([]);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: "expense", limit: "50",
      ...(categoryFilter && { categoryId: categoryFilter }),
      ...(search && { search }),
    });
    const [txRes, catRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch("/api/categories"),
    ]);
    const [txData, catData] = await Promise.all([txRes.json(), catRes.json()]);
    setTransactions(txData.transactions || []);
    setTotal(txData.total || 0);
    setCategories(catData.filter((c: { type: string }) => c.type === "expense") || []);
    setLoading(false);
  }, [categoryFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  // Group by category for summary
  const categoryTotals = transactions.reduce<Record<string, { name: string; icon?: string; color?: string; total: number; count: number }>>(
    (acc, tx) => {
      const key = tx.category?.name || "Uncategorized";
      if (!acc[key]) acc[key] = { name: key, icon: tx.category?.icon, color: tx.category?.color, total: 0, count: 0 };
      acc[key].total += tx.amount;
      acc[key].count++;
      return acc;
    }, {}
  );
  const topCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total).slice(0, 6);
  const grandTotal = transactions.reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>Expenses 💸</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Total: <span style={{ color: "#ef4444", fontWeight: "700" }}>{formatCurrency(grandTotal)}</span> across {total} transactions
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
      </div>

      {/* Category Summary Cards */}
      {topCategories.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {topCategories.map((c, i) => (
            <div key={i} className="stat-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{c.icon || "💸"}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>{c.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#ef4444" }}>{formatCurrency(c.total)}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.count} txns</div>
                </div>
              </div>
              <div className="progress-bar" style={{ marginTop: "10px" }}>
                <div className="progress-fill" style={{
                  width: `${grandTotal > 0 ? (c.total / grandTotal) * 100 : 0}%`,
                  background: c.color || "#ef4444",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: "14px 16px", marginBottom: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "12px" }}>
          <input className="input-field" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: "16px" }} /></td>)}</tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>💸</div>
                  No expenses found
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>{formatDate(tx.date)}</td>
                  <td>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "13px" }}>{tx.description || "—"}</div>
                  </td>
                  <td>
                    {tx.category ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        padding: "2px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "500",
                        background: `${tx.category.color || "#ef4444"}15`,
                        border: `1px solid ${tx.category.color || "#ef4444"}30`,
                        color: tx.category.color || "#ef4444",
                      }}>
                        {tx.category.icon} {tx.category.name}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ fontSize: "13px" }}>{tx.account?.name || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", fontSize: "14px", color: "#ef4444" }}>
                    -{formatCurrency(tx.amount)}
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
