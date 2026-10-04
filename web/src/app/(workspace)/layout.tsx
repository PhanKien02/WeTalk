import { NavRail } from "@/components/layout/nav-rail";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen overflow-hidden bg-background dark:bg-[#0f111a] text-foreground">
        <NavRail />
        <main className="flex-1 flex h-full min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
