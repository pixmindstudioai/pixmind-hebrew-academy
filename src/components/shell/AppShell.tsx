import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

/**
 * The app shell.
 * - Visitors (logged-out) keep the existing public top-nav + page — the
 *   marketing/landing experience is preserved untouched.
 * - Members get the Claws-style shell: right-edge sidebar (desktop),
 *   bottom tab bar (mobile), and a top bar with XP/level/streak chips.
 */
export function AppShell() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Navigation />
        <Outlet />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 pb-24 md:pb-10">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
