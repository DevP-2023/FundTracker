"use client";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface TopBarProps {
  user: { name?: string | null; email?: string | null; };
}

export function TopBar({ user }: TopBarProps) {
  const [notifCount, setNotifCount] = useState(0);
  const [showUser, setShowUser] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => setNotifCount(d.unreadCount || 0))
      .catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header style={{
      height: "64px",
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Notification bell */}
        <Link href="/dashboard" style={{ position: "relative", cursor: "pointer", color: "var(--text-secondary)", textDecoration: "none" }}>
          <span style={{ fontSize: "20px" }}>🔔</span>
          {notifCount > 0 && (
            <span style={{
              position: "absolute", top: "-4px", right: "-4px",
              background: "#ef4444", color: "white",
              fontSize: "10px", fontWeight: "700",
              borderRadius: "100px", padding: "1px 5px",
              border: "2px solid var(--bg-secondary)",
            }}>{notifCount}</span>
          )}
        </Link>

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowUser(!showUser)}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "6px 12px 6px 6px",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{
              width: "30px", height: "30px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: "700", color: "white",
            }}>{initials}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                {user?.name || "User"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{user?.email}</div>
            </div>
            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>▾</span>
          </button>

          {showUser && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "12px", padding: "8px",
              minWidth: "180px", zIndex: 100,
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              animation: "fadeIn 0.15s ease-out",
            }}>
              <Link href="/settings" onClick={() => setShowUser(false)}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", color: "var(--text-secondary)", textDecoration: "none", fontSize: "14px" }}
                className="nav-item">
                ⚙️ Settings
              </Link>
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "4px 0" }} />
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", color: "#ef4444", fontSize: "14px", width: "100%", background: "none", border: "none", cursor: "pointer" }}
              >
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
