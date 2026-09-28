"use client";
import { useState, useEffect } from "react";
import { autoCategorize } from "@/lib/utils";

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess: () => void;
  transaction?: any;
}

const TRANSACTION_TYPES = [
  { value: "expense", label: "Expense", emoji: "🔴", color: "#ef4444" },
  { value: "income", label: "Income", emoji: "🟢", color: "#10b981" },
  { value: "transfer", label: "Transfer", emoji: "🟡", color: "#f59e0b" },
  { value: "investment", label: "Investment", emoji: "🔵", color: "#3b82f6" },
  { value: "lending", label: "Lending", emoji: "🟣", color: "#8b5cf6" },
  { value: "borrowing", label: "Borrowing", emoji: "🟠", color: "#f97316" },
];

const CATEGORY_ICONS = ["🍔","🚗","🛍️","🎬","📄","🏠","🏥","📚","✈️","🛡️","📈","👤","🛒","💰","💼","💻","🏢","🏦","📊","🎁","↩️","💚","🎮","🐶","🌿","⚡","📱","🎓","👗","🏋️","🎵","🍕","☕","🎯","🔧","💡","🌍","🎪","🏖️","🍺"];

export function AddTransactionModal({ onClose, onSuccess, transaction }: AddTransactionModalProps) {
  const [type, setType] = useState(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount ? String(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description || "");
  const [date, setDate] = useState(transaction?.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState(transaction?.category?.id || transaction?.categoryId || "");
  const [accountId, setAccountId] = useState(transaction?.account?.id || transaction?.accountId || "");
  const [transferToId, setTransferToId] = useState("");
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [tags, setTags] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string; type: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

  // Custom category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("💰");
  const [newCatLoading, setNewCatLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/accounts").then(r => r.json()),
    ]).then(([cats, accs]) => {
      const flat = cats.flatMap((c: { id: string; name: string; icon?: string; type: string; children?: { id: string; name: string; type: string }[] }) => [
        c, ...(c.children || []).map((ch: { id: string; name: string; type: string }) => ({ ...ch, name: `  ${ch.name}` }))
      ]);
      setCategories(flat);
      setAccounts(accs);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Auto-categorize when description changes
  useEffect(() => {
    if (description.length > 2 && (type === "expense" || type === "income")) {
      const suggested = autoCategorize(description);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  }, [description, type]);

  const applySuggestion = () => {
    if (!suggestedCategory) return;
    const cat = categories.find(c => c.name.trim() === suggestedCategory);
    if (cat) setCategoryId(cat.id);
    setSuggestedCategory(null);
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setNewCatLoading(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), type, icon: newCatIcon }),
    });
    if (res.ok) {
      const created = await res.json();
      loadData(); // Reload categories
      setCategoryId(created.id); // Auto-select new category
      setShowNewCategory(false);
      setNewCatName("");
      setNewCatIcon("💰");
    }
    setNewCatLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type,
      amount: parseFloat(amount),
      description,
      notes,
      date,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      transferToId: type === "transfer" ? transferToId : undefined,
      transferFromId: type === "transfer" ? accountId : undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };

    const url = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions";
    const method = transaction ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    }
    setLoading(false);
  };

  const filteredCategories = categories.filter(c => {
    if (type === "expense") return c.type === "expense" || c.type === "both";
    if (type === "income") return c.type === "income" || c.type === "both";
    return false;
  });

  const currentType = TRANSACTION_TYPES.find(t => t.value === type);

  if (success) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" style={{ padding: "48px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <div style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>
            {transaction ? "Transaction Updated!" : "Transaction Recorded!"}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {currentType?.emoji} {type.charAt(0).toUpperCase() + type.slice(1)} of ₹{parseFloat(amount).toLocaleString("en-IN")} {transaction ? "updated" : "saved"}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{transaction ? "Edit Transaction" : "Add Transaction"}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>
              {transaction ? "Update your transaction details" : "Record any financial activity"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "20px" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Type selector */}
          <div>
            <label className="form-label">Transaction Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {TRANSACTION_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "10px",
                    border: `1px solid ${type === t.value ? t.color : "var(--border)"}`,
                    background: type === t.value ? `${t.color}18` : "var(--bg-secondary)",
                    color: type === t.value ? t.color : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.15s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="form-label">Amount (₹)</label>
            <input
              className="input-field"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              required
              style={{ fontSize: "20px", fontWeight: "700" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <input
              className="input-field"
              type="text"
              placeholder={type === "expense" ? "e.g. McDonald's, Uber, Amazon..." : "e.g. Salary, Freelance work..."}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            {suggestedCategory && (
              <div style={{
                marginTop: "6px", padding: "8px 12px",
                background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "8px", fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  🤖 Suggested: <strong style={{ color: "#3b82f6" }}>{suggestedCategory}</strong>
                </span>
                <button type="button" onClick={applySuggestion}
                  style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "3px 10px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Category + Account row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {(type === "expense" || type === "income") && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Category</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategory(!showNewCategory)}
                    style={{
                      fontSize: "11px", fontWeight: "600",
                      color: "#3b82f6", background: "rgba(59,130,246,0.08)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      borderRadius: "6px", padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    {showNewCategory ? "✕ Cancel" : "+ New"}
                  </button>
                </div>

                {showNewCategory ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {/* Icon picker button */}
                      <button
                        type="button"
                        onClick={() => setShowIconPicker(!showIconPicker)}
                        style={{
                          width: "42px", height: "42px", flexShrink: 0,
                          fontSize: "20px", border: "1px solid var(--border)",
                          borderRadius: "10px", background: "var(--bg-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {newCatIcon}
                      </button>
                      <input
                        className="input-field"
                        placeholder="Category name..."
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        autoFocus
                      />
                    </div>

                    {showIconPicker && (
                      <div style={{
                        display: "flex", flexWrap: "wrap", gap: "6px",
                        padding: "10px", background: "var(--bg-secondary)",
                        border: "1px solid var(--border)", borderRadius: "10px",
                        maxHeight: "120px", overflowY: "auto",
                      }}>
                        {CATEGORY_ICONS.map(icon => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => { setNewCatIcon(icon); setShowIconPicker(false); }}
                            style={{
                              width: "32px", height: "32px", fontSize: "18px",
                              border: newCatIcon === icon ? "2px solid #3b82f6" : "1px solid transparent",
                              borderRadius: "6px", background: "none", cursor: "pointer",
                            }}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={newCatLoading || !newCatName.trim()}
                      style={{
                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                        color: "white", border: "none", borderRadius: "8px",
                        padding: "8px", fontSize: "13px", fontWeight: "600",
                        cursor: "pointer", opacity: !newCatName.trim() ? 0.5 : 1,
                      }}
                    >
                      {newCatLoading ? "Creating..." : `✓ Create "${newCatName || "Category"}"`}
                    </button>
                  </div>
                ) : (
                  <select className="input-field" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Select category</option>
                    {filteredCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="form-label">{type === "transfer" ? "From Account" : "Account"}</label>
              <select className="input-field" value={accountId} onChange={e => setAccountId(e.target.value)}>
                <option value="">Select account</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
            </div>

            {type === "transfer" && (
              <div>
                <label className="form-label">To Account</label>
                <select className="input-field" value={transferToId} onChange={e => setTransferToId(e.target.value)}>
                  <option value="">Select account</option>
                  {accounts.filter(a => a.id !== accountId).map(a => (
                    <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Date</label>
            <input
              className="input-field"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="input-field"
              placeholder="Any additional details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ resize: "none" }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. work, personal, urgent"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, justifyContent: "center" }}>
              {loading ? "Saving..." : `Save ${currentType?.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
