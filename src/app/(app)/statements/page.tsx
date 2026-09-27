"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function StatementsPage() {
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [statementData, setStatementData] = useState<{
    transactions: any[];
    openingBalance: number;
    closingBalance: number;
    totalIn: number;
    totalOut: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then(res => res.json())
      .then(data => {
        setAccounts(data || []);
        if (data.length > 0) setSelectedAccount(data[0].id);
      });
      
    // Default to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const generateStatement = useCallback(async () => {
    if (!selectedAccount || !startDate || !endDate) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        accountId: selectedAccount,
        startDate,
        endDate,
      });
      const res = await fetch(`/api/transactions?${params}&limit=1000`);
      const data = await res.json();
      
      const txs = data.transactions || [];
      const totalIn = txs.filter((t: any) => ["income"].includes(t.type)).reduce((s: number, t: any) => s + t.amount, 0);
      const totalOut = txs.filter((t: any) => ["expense", "investment", "lending"].includes(t.type)).reduce((s: number, t: any) => s + t.amount, 0);
      
      setStatementData({
        transactions: txs,
        openingBalance: 0, // Simplified for now since we'd need a separate endpoint for historic balance
        closingBalance: totalIn - totalOut, // Also simplified
        totalIn,
        totalOut,
      });
    } catch (e) {}
    setLoading(false);
  }, [selectedAccount, startDate, endDate]);

  useEffect(() => {
    if (selectedAccount && startDate && endDate) {
      generateStatement();
    }
  }, [selectedAccount, startDate, endDate, generateStatement]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Account Statements 📄</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Generate and view consolidated account statements
          </p>
        </div>
        <button className="btn-primary" onClick={() => window.print()}>🖨️ Print Statement</button>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ padding: "16px", marginBottom: "20px" }} id="no-print">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label className="form-label">Account</label>
            <select className="input-field" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
              <option value="">All Accounts</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input className="input-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input className="input-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Statement View */}
      {loading ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>Loading statement data...</div>
      ) : statementData ? (
        <div className="glass-card print-section" style={{ padding: "32px", background: "#fff", color: "#000" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e2e8f0", paddingBottom: "24px", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", margin: 0, color: "#0f172a" }}>CapitalNest Statement</h2>
              <div style={{ fontSize: "14px", color: "#475569", marginTop: "4px" }}>
                {accounts.find(a => a.id === selectedAccount)?.name || "All Accounts"}
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: "13px", color: "#475569" }}>
              <div>Statement Period:</div>
              <div style={{ fontWeight: "600", color: "#0f172a" }}>{formatDate(startDate)} — {formatDate(endDate)}</div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Money In</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#10b981" }}>{formatCurrency(statementData.totalIn)}</div>
            </div>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", fontWeight: "600", marginBottom: "8px" }}>Money Out</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#ef4444" }}>{formatCurrency(statementData.totalOut)}</div>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#475569", fontWeight: "600" }}>Date</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#475569", fontWeight: "600" }}>Description</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#475569", fontWeight: "600" }}>Category</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "#475569", fontWeight: "600" }}>Debit</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "#475569", fontWeight: "600" }}>Credit</th>
              </tr>
            </thead>
            <tbody>
              {statementData.transactions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>No transactions in this period</td></tr>
              ) : (
                statementData.transactions.map((tx, i) => {
                  const isCredit = ["income"].includes(tx.type);
                  return (
                    <tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 8px", color: "#0f172a" }}>{formatDate(tx.date)}</td>
                      <td style={{ padding: "12px 8px", color: "#0f172a", fontWeight: "500" }}>{tx.description || tx.type}</td>
                      <td style={{ padding: "12px 8px", color: "#475569" }}>{tx.category?.name || "-"}</td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: "#0f172a" }}>
                        {!isCredit ? formatCurrency(tx.amount) : "-"}
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", color: "#0f172a" }}>
                        {isCredit ? formatCurrency(tx.amount) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          <div style={{ textAlign: "center", marginTop: "40px", fontSize: "11px", color: "#94a3b8" }}>
            Generated by CapitalNest • {new Date().toLocaleString()}
          </div>
        </div>
      ) : null}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          #no-print { display: none; }
        }
      `}} />
    </div>
  );
}
