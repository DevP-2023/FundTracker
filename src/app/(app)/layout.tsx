import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{
        marginLeft: "var(--sidebar-width)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-primary)",
      }}>
        <TopBar user={session.user || {}} />
        <main style={{ flex: 1, padding: "24px", maxWidth: "1400px", width: "100%", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
