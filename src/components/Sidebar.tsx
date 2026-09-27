"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/transactions", icon: "💳", label: "Transactions" },
  { href: "/expenses", icon: "💸", label: "Expenses" },
  { href: "/income", icon: "💰", label: "Income" },
  { href: "/investments", icon: "📈", label: "Investments" },
  { href: "/loans", icon: "🤝", label: "Lending & Borrowing" },
  { href: "/budgets", icon: "🎯", label: "Budgets" },
  { href: "/goals", icon: "🏆", label: "Goals" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/accounts", icon: "🏦", label: "Accounts" },
  { href: "/statements", icon: "📄", label: "Statements" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: "var(--sidebar-width)",
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      background: "var(--bg-secondary)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            borderRadius: "10px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", flexShrink: 0,
            boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
          }}>💼</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)" }}>
              Capital<span style={{
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>Nest</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Portfolio Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", padding: "4px 12px 8px" }}>
            Menu
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
                <span style={{ fontSize: "16px", lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div style={{
        padding: "12px 8px",
        borderTop: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          padding: "12px",
          borderRadius: "10px",
          background: "rgba(59,130,246,0.05)",
          border: "1px solid rgba(59,130,246,0.1)",
        }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
            💡 Tip of the day
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
            Track every ₹1 — small expenses add up!
          </div>
        </div>
      </div>
    </aside>
  );
}
