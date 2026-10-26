import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, IndianRupee, Loader2, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/trips.functions";
import type { Itinerary } from "@/lib/itinerary";

export const Route = createFileRoute("/_authenticated/trips/$id")({
  head: () => ({
    meta: [
      { title: "Trip itinerary — TravelPlanner" },
      { name: "description", content: "Your day-by-day AI travel itinerary." },
      { property: "og:title", content: "Trip itinerary — TravelPlanner" },
      { property: "og:description", content: "Your day-by-day AI travel itinerary." },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const gen = useServerFn(generateItinerary);
  const [busy, setBusy] = useState(false);
  const [tweak, setTweak] = useState("");
  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  async function run(t?: string) {
    setBusy(true);
    try {
      const res = await gen({ data: { tripId: id, tweak: t } });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(t ? "Itinerary updated" : "Itinerary ready");
        setTweak("");
        qc.invalidateQueries({ queryKey: ["trip", id] });
        qc.invalidateQueries({ queryKey: ["trips"] });
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />;
  if (!trip) return <p>Trip not found.</p>;
  const it = trip.itinerary as Itinerary | null;

  return (
    <div>
      <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">{trip.vibe} · {trip.travelers} travelers</p>
          <h1 className="text-4xl font-extrabold italic">{trip.destination}</h1>
          <p className="text-sm text-muted-foreground">{trip.start_date} — {trip.end_date} · ₹{trip.budget_per_day}/day</p>
        </div>
        <button disabled={busy} onClick={() => run()} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {it ? "Regenerate" : "Generate itinerary"}
        </button>
      </div>

      {busy && <p className="mt-6 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">Planning your days… this can take up to a minute.</p>}

      {!it && !busy && <p className="mt-8 rounded-3xl border border-dashed p-10 text-center text-muted-foreground">No itinerary yet — hit Generate.</p>}

      {it && (
        <>
          <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft">
            <p>{it.summary}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {it.recommendations.map((r) => <li key={r}>{r}</li>)}
            </ul>
            <p className="mt-4 flex items-center gap-1 font-bold"><IndianRupee className="h-4 w-4 text-success" />{it.totalEstimatedCost.toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">estimated total for the group</span></p>
          </div>

          <div className="mt-6 flex gap-2 rounded-2xl bg-card p-3 shadow-soft">
            <Sparkles className="mt-2.5 h-4 w-4 shrink-0 text-primary" />
            <input value={tweak} maxLength={500} onChange={(e) => setTweak(e.target.value)} placeholder="Ask for changes: “make day 2 more relaxed”, “add street food”…" className="flex-1 bg-transparent px-2 outline-none" />
            <button disabled={busy || !tweak.trim()} onClick={() => run(tweak.trim())} className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-50">Update</button>
          </div>

          <div className="mt-8 space-y-8">
            {it.days.map((d) => (
              <section key={d.day}>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-bold">Day {d.day}</h2>
                  <span className="text-sm text-muted-foreground">{d.date} · {d.theme}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-primary"><MapPin className="h-3 w-3" /> {d.area}</p>
                <ol className="mt-4 space-y-3 border-l-2 border-accent pl-5">
                  {d.activities.map((a, i) => (
                    <li key={i} className="relative rounded-2xl bg-card p-4 shadow-soft">
                      <span className="absolute -left-[1.85rem] top-5 h-3 w-3 rounded-full bg-primary" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold"><span className="mr-2 text-primary">{a.time}</span>{a.title}</p>
                        <span className="eyebrow rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] text-secondary-foreground">{a.category}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{a.estimatedCost}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
