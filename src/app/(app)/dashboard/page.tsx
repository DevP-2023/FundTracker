"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate, getTransactionBg, getTransactionEmoji, getBudgetColor, getBudgetTextColor } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { AddTransactionModal } from "@/components/AddTransactionModal";

interface DashboardData {
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    totalInvested: number;
    currentInvestmentValue: number;
    investmentPnL: number;
    totalLent: number;
    totalBorrowed: number;
    totalReceivable: number;
    totalPayable: number;
    netWorth: number;
    savingsRate: number;
  };
  cashFlow: { month: string; income: number; expense: number }[];
  expenseByCategory: { name: string; value: number; color: string }[];
  accounts: { id: string; name: string; balance: number; type: string; icon?: string; color?: string }[];
}

const PERIODS = [
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "3months" },
  { label: "6 Months", value: "6months" },
  { label: "This Year", value: "year" },
];

const StatCard = ({
  label, value, sub, color, emoji, trend
}: {
  label: string; value: string; sub?: string; color?: string; emoji: string; trend?: number
}) => (
  <div className="stat-card" style={{ "--accent-color": color || "#3b82f6" } as React.CSSProperties}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
          {label}
        </div>
        <div style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: "12px", color: trend !== undefined ? (trend >= 0 ? "#10b981" : "#ef4444") : "var(--text-muted)", marginTop: "4px", fontWeight: "500" }}>
            {trend !== undefined && (trend >= 0 ? "▲" : "▼")} {sub}
          </div>
        )}
      </div>
      <div style={{
        width: "42px", height: "42px",
        borderRadius: "12px",
        background: `${color || "#3b82f6"}18`,
        border: `1px solid ${color || "#3b82f6"}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px",
      }}>{emoji}</div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentTx, setRecentTx] = useState<{
    id: string; type: string; description?: string; amount: number; date: string;
    category?: { name: string; icon?: string }; account?: { name: string };
  }[]>([]);
  const [budgets, setBudgets] = useState<{
    id: string; spentAmount: number; amount: number; percentage: number;
    category?: { name: string; icon?: string };
  }[]>([]);
  const [period, setPeriod] = useState("month");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, txRes, budgetRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/transactions?limit=8"),
        fetch("/api/budgets"),
      ]);
      const [dash, tx, bud] = await Promise.all([dashRes.json(), txRes.json(), budgetRes.json()]);
      setData(dash);
      setRecentTx(tx.transactions || []);
      setBudgets(bud || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div style={{ padding: "0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "100px" }} />
          ))}
        </div>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Financial Dashboard 📊
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Your complete financial overview at a glance
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-card)", borderRadius: "10px", padding: "4px", border: "1px solid var(--border-subtle)" }}>
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "6px 14px", borderRadius: "8px", fontSize: "13px",
                  fontWeight: "500", border: "none", cursor: "pointer",
                  background: period === p.value ? "var(--accent-blue)" : "transparent",
                  color: period === p.value ? "white" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >{p.label}</button>
            ))}
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            style={{ whiteSpace: "nowrap" }}
          >
            + Add Transaction
          </button>
        </div>
      </div>

      {/* Key Metrics - Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "16px" }}>
        <StatCard emoji="🏦" label="Total Balance" value={formatCurrency(s?.totalBalance || 0)} color="#3b82f6" />
        <StatCard emoji="💎" label="Net Worth" value={formatCurrency(s?.netWorth || 0)} color="#8b5cf6" />
        <StatCard emoji="📈" label="Investments" value={formatCurrency(s?.currentInvestmentValue || 0)}
          sub={s?.investmentPnL !== undefined ? `${s.investmentPnL >= 0 ? "+" : ""}${formatCurrency(Math.abs(s.investmentPnL))} P&L` : undefined}
          trend={s?.investmentPnL} color="#10b981" />
        <StatCard emoji="💾" label="Savings Rate"
          value={`${(s?.savingsRate || 0).toFixed(1)}%`}
          sub="of total income" color="#f59e0b" />
      </div>

      {/* Key Metrics - Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
        <StatCard emoji="💰" label="Total Income" value={formatCurrency(s?.totalIncome || 0)} color="#10b981" />
        <StatCard emoji="💸" label="Total Expenses" value={formatCurrency(s?.totalExpenses || 0)} color="#ef4444" />
        <StatCard emoji="🤲" label="Money Receivable" value={formatCurrency(s?.totalReceivable || 0)} color="#06b6d4" />
        <StatCard emoji="💳" label="Money Payable" value={formatCurrency(s?.totalPayable || 0)} color="#f97316" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Cash Flow Chart */}
        <div className="chart-container">
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Income vs Expenses</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>Last 6 months trend</p>
            </div>
            <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
              <span style={{ color: "#10b981" }}>● Income</span>
              <span style={{ color: "#ef4444" }}>● Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.cashFlow || []}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px" }}
                formatter={(v: number) => [formatCurrency(v), ""]}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Category */}
        <div className="chart-container">
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Spending Breakdown</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>By category</p>
          </div>
          {(data?.expenseByCategory?.length || 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data?.expenseByCategory || []}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    dataKey="value" paddingAngle={3}
                  >
                    {(data?.expenseByCategory || []).map((entry, i) => (
                      <Cell key={i} fill={entry.color || `hsl(${i * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                    formatter={(v: number) => [formatCurrency(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                {(data?.expenseByCategory || []).slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: c.color, flexShrink: 0 }} />
                      <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
              <div>No expenses yet</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent Transactions */}
        <div className="chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Recent Transactions</h3>
            <a href="/transactions" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>View all →</a>
          </div>
          {recentTx.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {recentTx.map(tx => (
                <div key={tx.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid var(--border-subtle)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontSize: "18px" }}>{tx.category?.icon || getTransactionEmoji(tx.type)}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {tx.description || tx.type}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {tx.category?.name} • {formatDate(tx.date)}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: "14px", fontWeight: "700",
                    color: tx.type === "income" ? "#10b981" : tx.type === "expense" ? "#ef4444" : "#3b82f6"
                  }}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💳</div>
              <div>No transactions yet</div>
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: "12px", fontSize: "13px" }}>
                Add First Transaction
              </button>
            </div>
          )}
        </div>

        {/* Budget Status */}
        <div className="chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Budget Status</h3>
            <a href="/budgets" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Manage →</a>
          </div>
          {budgets.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {budgets.slice(0, 5).map(b => (
                <div key={b.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{b.category?.icon || "📊"}</span>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                        {b.category?.name || "Overall"}
                      </span>
                    </div>
                    <span className={getBudgetTextColor(b.percentage)} style={{ fontSize: "12px", fontWeight: "700" }}>
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getBudgetColor(b.percentage)}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                    <span>{formatCurrency(b.spentAmount)} spent</span>
                    <span>of {formatCurrency(b.amount)}</span>
                  </div>
                  {b.percentage >= 100 && (
                    <div style={{ fontSize: "11px", color: "#ef4444", marginTop: "4px", fontWeight: "500" }}>
                      🚨 Exceeded by {formatCurrency(b.spentAmount - b.amount)}
                    </div>
                  )}
                  {b.percentage >= 80 && b.percentage < 100 && (
                    <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", fontWeight: "500" }}>
                      ⚠️ {formatCurrency(b.amount - b.spentAmount)} remaining
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎯</div>
              <div>No budgets set</div>
              <a href="/budgets" className="btn-primary" style={{ marginTop: "12px", fontSize: "13px", display: "inline-flex" }}>
                Set Budget
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Accounts Row */}
      <div style={{ marginTop: "20px" }}>
        <div className="chart-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Accounts & Wallets</h3>
            <a href="/accounts" style={{ fontSize: "13px", color: "#3b82f6", textDecoration: "none", fontWeight: "500" }}>Manage →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {(data?.accounts || []).map(acc => (
              <div key={acc.id} style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${acc.color || "#3b82f6"}30`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>{acc.icon || "🏦"}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>{acc.name}</div>
                <div style={{
                  fontSize: "16px", fontWeight: "700",
                  color: acc.balance >= 0 ? "var(--text-primary)" : "#ef4444"
                }}>
                  {formatCurrency(acc.balance)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <AddTransactionModal onClose={() => setShowModal(false)} onSuccess={loadData} />
      )}
    </div>
  );
}
