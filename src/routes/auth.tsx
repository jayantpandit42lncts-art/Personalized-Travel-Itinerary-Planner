import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TravelPlanner" },
      { name: "description", content: "Sign in or create your TravelPlanner account." },
      { property: "og:title", content: "Sign in — TravelPlanner" },
      { property: "og:description", content: "Access your saved trips and AI itineraries." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 shadow-soft">
        <Link to="/" className="mb-6 flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Globe className="h-4 w-4" /></span>
          Travel<span className="-ml-2 text-primary">Planner</span>
        </Link>
        {sent ? (
          <p className="text-sm text-muted-foreground">Check your inbox at <b>{email}</b> and click the link to confirm your account.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            <input required minLength={6} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring" />
            <button disabled={busy} className="w-full rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}
            </button>
            <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-muted-foreground">
              {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
