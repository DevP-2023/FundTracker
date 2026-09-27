"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#f97316", "#ec4899"];

export default function AnalyticsPage() {
  const [dashData, setDashData] = useState<{
    summary: {
      totalIncome: number; totalExpenses: number; totalInvested: number;
      currentInvestmentValue: number; investmentPnL: number;
      netWorth: number; savingsRate: number;
      totalReceivable: number; totalPayable: number;
    };
    cashFlow: { month: string; income: number; expense: number }[];
    expenseByCategory: { name: string; value: number; color: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setDashData(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div style={{ padding: "20px" }}><div className="skeleton" style={{ height: "400px", borderRadius: "16px" }} /></div>;
  }

  const s = dashData?.summary;
  const expenseRatio = s && s.totalIncome > 0 ? (s.totalExpenses / s.totalIncome) * 100 : 0;
  const investmentRate = s && s.totalIncome > 0 ? (s.totalInvested / s.totalIncome) * 100 : 0;

  const netWorthData = dashData?.cashFlow.map((cf, i) => ({
    month: cf.month,
    netWorth: (s?.netWorth || 0) - (dashData.cashFlow.slice(i + 1).reduce((acc, m) => acc + m.income - m.expense, 0)),
  })) || [];

  const healthMetrics = [
    { label: "Savings Rate", value: s?.savingsRate || 0, target: 20, color: "#10b981", format: (v: number) => `${v.toFixed(1)}%` },
    { label: "Investment Rate", value: investmentRate, target: 15, color: "#3b82f6", format: (v: number) => `${v.toFixed(1)}%` },
    { label: "Expense Ratio", value: expenseRatio, target: 70, color: "#f59e0b", format: (v: number) => `${v.toFixed(1)}%`, inverse: true },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800" }}>Analytics 📊</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>Deep insights into your financial health</p>
      </div>

      {/* Financial Health Score */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px" }}>💎 Financial Health Metrics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {healthMetrics.map((m, i) => {
            const isGood = m.inverse ? m.value <= m.target : m.value >= m.target;
            return (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: `conic-gradient(${m.color} ${Math.min(m.value, 100) * 3.6}deg, var(--bg-secondary) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px",
                  position: "relative",
                }}>
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    background: "var(--bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: "800", color: m.color,
                  }}>
                    {m.format(m.value)}
                  </div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)" }}>{m.label}</div>
                <div style={{
                  fontSize: "12px", marginTop: "4px", fontWeight: "500",
                  color: isGood ? "#10b981" : "#f59e0b",
                }}>
                  {isGood ? "✅ On track" : `⚠️ Target: ${m.target}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "20px", marginBottom: "20px" }}>
        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>📈 Monthly Cash Flow</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashData?.cashFlow || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px" }}
                formatter={(v: number) => [formatCurrency(v), ""]}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>🥧 Expense Categories</h3>
          {(dashData?.expenseByCategory?.length || 0) > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={dashData?.expenseByCategory || []} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={2}>
                    {(dashData?.expenseByCategory || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "12px" }}
                    formatter={(v: number) => [formatCurrency(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {(dashData?.expenseByCategory || []).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: COLORS[i % COLORS.length] }} />
                      <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                    </div>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600" }}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>No expense data</div>
          )}
        </div>
      </div>

      {/* Net Worth Trend */}
      <div className="chart-container" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>💎 Net Worth Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={netWorthData}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px" }}
              formatter={(v: number) => [formatCurrency(v), "Net Worth"]}
            />
            <Area type="monotone" dataKey="netWorth" stroke="#8b5cf6" fill="url(#nwGrad)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Total Income (All Time)", value: formatCurrency(s?.totalIncome || 0), emoji: "💰", color: "#10b981" },
          { label: "Total Expenses (All Time)", value: formatCurrency(s?.totalExpenses || 0), emoji: "💸", color: "#ef4444" },
          { label: "Investment P&L", value: formatCurrency(s?.investmentPnL || 0), emoji: "📈", color: (s?.investmentPnL || 0) >= 0 ? "#10b981" : "#ef4444" },
          { label: "Net Worth", value: formatCurrency(s?.netWorth || 0), emoji: "💎", color: "#8b5cf6" },
        ].map((item, i) => (
          <div key={i} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{item.label}</div>
                <div style={{ fontSize: "20px", fontWeight: "800", color: item.color }}>{item.value}</div>
              </div>
              <span style={{ fontSize: "24px" }}>{item.emoji}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
