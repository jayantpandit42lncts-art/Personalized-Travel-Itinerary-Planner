import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, Compass, IndianRupee, MapPin, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TravelPlanner" },
      { name: "description", content: "Your saved trips and itineraries." },
      { property: "og:title", content: "Dashboard — TravelPlanner" },
      { property: "og:description", content: "Your saved trips and itineraries." },
    ],
  }),
  component: Dashboard,
});

export const tripsQuery = {
  queryKey: ["trips"],
  queryFn: async () => {
    const { data, error } = await supabase.from("trips").select("*").order("start_date");
    if (error) throw error;
    return data;
  },
};

function Dashboard() {
  const qc = useQueryClient();
  const { data: trips = [], isLoading, error } = useQuery(tripsQuery);
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => toast.error("Couldn't delete trip"),
  });
  const today = new Date().toISOString().slice(0, 10);
  const stats = [
    { label: "Total trips", value: trips.length, icon: Compass, cls: "text-primary" },
    { label: "Destinations", value: new Set(trips.map((t) => t.destination.toLowerCase())).size, icon: MapPin, cls: "text-success" },
    { label: "Upcoming", value: trips.filter((t) => t.end_date >= today).length, icon: Calendar, cls: "text-warning" },
  ];

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="eyebrow text-primary">Workspace</p>
          <h1 className="text-3xl font-bold">Overview</h1>
        </div>
        <Link to="/plan" className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft">
          <Plus className="h-4 w-4" /> Start New Trip
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-card p-6 shadow-soft">
            <s.icon className={`h-5 w-5 ${s.cls}`} />
            <div>
              <p className="eyebrow">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-10 text-lg font-semibold">Your Itineraries</h2>
      {error && <p className="mt-4 text-destructive">Couldn't load trips.</p>}
      {isLoading ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />)}
        </div>
      ) : trips.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          No trips yet. <Link to="/plan" className="font-semibold text-primary">Plan your first one</Link>.
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <Link key={t.id} to="/trips/$id" params={{ id: t.id }} className="group overflow-hidden rounded-3xl bg-card shadow-soft transition hover:-translate-y-1">
              <div className="relative grid h-36 place-items-center bg-cover-gradient">
                <span className="text-5xl font-extrabold text-primary-foreground opacity-80">{t.destination.slice(0, 2).toUpperCase()}</span>
                <span className="eyebrow absolute bottom-3 left-3 rounded-full bg-card px-3 py-1 text-[0.6rem] text-primary">{t.vibe}</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm(`Delete trip to ${t.destination}?`)) del.mutate(t.id);
                  }}
                  className="absolute right-3 top-3 rounded-lg bg-card p-1.5 text-muted-foreground hover:text-destructive"
                  aria-label="Delete trip"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-bold italic">{t.destination}</h3>
                <p className="flex items-center gap-2 text-xs"><Calendar className="h-3.5 w-3.5 text-primary" /> {t.start_date} — {t.end_date}</p>
                <p className="flex items-center gap-2 text-xs"><Users className="h-3.5 w-3.5 text-primary" /> {t.travelers} travelers</p>
                <p className="flex items-center gap-1 pt-2 text-sm font-bold"><IndianRupee className="h-4 w-4 text-success" />{t.budget_per_day}<span className="text-xs font-normal text-muted-foreground">/DAY</span></p>
                {!t.itinerary && <p className="text-xs text-warning">Itinerary not generated yet</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
