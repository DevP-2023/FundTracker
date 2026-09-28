"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const bottomNavItems = [
  { href: "/dashboard", icon: "🏠", label: "Home" },
  { href: "/transactions", icon: "💳", label: "Txns" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/goals", icon: "🏆", label: "Goals" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      {bottomNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              color: isActive ? "var(--accent-blue)" : "var(--text-muted)",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "20px", filter: isActive ? "none" : "grayscale(100%) opacity(60%)" }}>
              {item.icon}
            </span>
            <span style={{ fontSize: "10px", fontWeight: isActive ? "700" : "500" }}>
              {item.label}
            </span>
            {isActive && (
              <div style={{
                position: "absolute",
                top: "-12px",
                width: "32px",
                height: "3px",
                background: "var(--accent-blue)",
                borderRadius: "0 0 4px 4px",
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
