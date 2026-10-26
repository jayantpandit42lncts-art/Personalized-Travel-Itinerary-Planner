import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, PlusCircle, LogOut, Globe, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
    { to: "/plan", label: "Plan New Trip", icon: PlusCircle },
  ] as const;
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-sidebar p-4 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Globe className="h-5 w-5" /></span>
          Travel<span className="-ml-2 text-primary">Planner</span>
        </Link>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="mt-auto flex items-center gap-3 px-3 py-2 text-sm font-medium">
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-end gap-3 border-b px-6 py-3">
          <span className="eyebrow text-muted-foreground">{user.email}</span>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-success"><User className="h-4 w-4" /></span>
          <button onClick={signOut} className="md:hidden"><LogOut className="h-4 w-4" /></button>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
