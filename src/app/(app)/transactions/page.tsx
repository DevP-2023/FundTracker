"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, getTransactionBg, getTransactionEmoji } from "@/lib/utils";
import { AddTransactionModal } from "@/components/AddTransactionModal";

const TX_TYPES = [
  { value: "", label: "All Types" },
  { value: "expense", label: "🔴 Expenses" },
  { value: "income", label: "🟢 Income" },
  { value: "investment", label: "🔵 Investments" },
  { value: "transfer", label: "🟡 Transfers" },
  { value: "lending", label: "🟣 Lending" },
  { value: "borrowing", label: "🟠 Borrowing" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<{
    id: string; type: string; description?: string; notes?: string; amount: number;
    date: string; status: string; category?: { name: string; icon?: string; color?: string };
    account?: { name: string }; tags?: string;
  }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: "20", page: String(page),
      ...(typeFilter && { type: typeFilter }),
      ...(search && { search }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, typeFilter, search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>Transactions 💳</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {total} total transactions
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: "16px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 160px 160px", gap: "12px", alignItems: "end" }}>
          <div>
            <label className="form-label">Search</label>
            <input
              className="input-field"
              placeholder="Search transactions..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select className="input-field" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              {TX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From</label>
            <input className="input-field" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="form-label">To</label>
            <input className="input-field" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(8)].map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "18px", width: "80%" }} /></td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                  No transactions found
                </td>
              </tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>{formatDate(tx.date)}</td>
                  <td>
                    <span className={`badge ${getTransactionBg(tx.type)}`}>
                      {getTransactionEmoji(tx.type)} {tx.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "13px" }}>
                      {tx.description || "—"}
                    </div>
                    {tx.notes && <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{tx.notes}</div>}
                  </td>
                  <td>
                    {tx.category ? (
                      <span style={{ fontSize: "13px" }}>{tx.category.icon} {tx.category.name}</span>
                    ) : "—"}
                  </td>
                  <td style={{ fontSize: "13px" }}>{tx.account?.name || "—"}</td>
                  <td style={{
                    textAlign: "right", fontWeight: "700", fontSize: "14px",
                    color: tx.type === "income" ? "#10b981" : tx.type === "expense" ? "#ef4444" : "#3b82f6"
                  }}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </td>
                  <td>
                    <span style={{
                      fontSize: "11px", fontWeight: "600",
                      padding: "2px 8px", borderRadius: "6px",
                      background: tx.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: tx.status === "completed" ? "#10b981" : "#f59e0b",
                      border: `1px solid ${tx.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                    }}>
                      {tx.status}
                    </span>
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

        {/* Pagination */}
        {total > 20 && (
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Page {page} of {Math.ceil(total / 20)}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 16px" }}>← Prev</button>
              <button className="btn-secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 16px" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && <AddTransactionModal transaction={editingTx} onClose={() => { setShowModal(false); setEditingTx(null); }} onSuccess={load} />}
    </div>
  );
}
