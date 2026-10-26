import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateItinerary } from "@/lib/trips.functions";
import { INTERESTS, VIBES } from "@/lib/itinerary";

export const Route = createFileRoute("/_authenticated/plan")({
  head: () => ({
    meta: [
      { title: "Plan a new trip — TravelPlanner" },
      { name: "description", content: "Tell us about your trip and get an AI itinerary." },
      { property: "og:title", content: "Plan a new trip — TravelPlanner" },
      { property: "og:description", content: "Tell us about your trip and get an AI itinerary." },
    ],
  }),
  component: Plan,
});

const field = "w-full rounded-xl border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring";

function Plan() {
  const navigate = useNavigate();
  const gen = useServerFn(generateItinerary);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    destination: "",
    start_date: "",
    end_date: "",
    travelers: 1,
    budget_per_day: 5000,
    vibe: "moderate",
    interests: [] as string[],
    notes: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const valid0 = f.destination.trim() && f.start_date && f.end_date && f.end_date >= f.start_date;
  const steps = ["Where & when", "Group & budget", "Your vibe"];

  async function submit() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("trips")
      .insert({ ...f, destination: f.destination.trim(), user_id: u.user!.id, notes: f.notes || null })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      toast.error("Couldn't save trip");
      return;
    }
    const res = await gen({ data: { tripId: data.id } }).catch(() => ({ ok: false as const, error: "Generation failed" }));
    if (!res.ok) toast.error(res.error + " Your trip was saved — you can retry from the trip page.");
    navigate({ to: "/trips/$id", params: { id: data.id } });
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="eyebrow text-primary">Step {step + 1} of 3</p>
      <h1 className="text-3xl font-bold">{steps[step]}</h1>
      <div className="mt-3 flex gap-2">
        {steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />)}
      </div>
      <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {step === 0 && (
              <>
                <label className="block text-sm font-medium">Destination
                  <input className={field} maxLength={100} placeholder="e.g. Varanasi, Kyoto, Lisbon" value={f.destination} onChange={(e) => set("destination", e.target.value)} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Start
                    <input type="date" className={field} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
                  </label>
                  <label className="block text-sm font-medium">End
                    <input type="date" className={field} min={f.start_date} value={f.end_date} onChange={(e) => set("end_date", e.target.value)} />
                  </label>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <label className="block text-sm font-medium">Travelers
                  <input type="number" min={1} max={30} className={field} value={f.travelers} onChange={(e) => set("travelers", Math.max(1, +e.target.value))} />
                </label>
                <label className="block text-sm font-medium">Budget per person per day (₹)
                  <input type="number" min={500} step={500} className={field} value={f.budget_per_day} onChange={(e) => set("budget_per_day", Math.max(0, +e.target.value))} />
                </label>
              </>
            )}
            {step === 2 && (
              <>
                <p className="text-sm font-medium">Travel style</p>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map((v) => (
                    <button key={v} type="button" onClick={() => set("vibe", v)} className={`rounded-full px-4 py-2 text-sm capitalize ${f.vibe === v ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{v}</button>
                  ))}
                </div>
                <p className="text-sm font-medium">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((i) => {
                    const on = f.interests.includes(i);
                    return (
                      <button key={i} type="button" onClick={() => set("interests", on ? f.interests.filter((x) => x !== i) : [...f.interests, i])} className={`rounded-full px-4 py-2 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{i}</button>
                    );
                  })}
                </div>
                <label className="block text-sm font-medium">Anything else?
                  <textarea maxLength={500} className={field} rows={3} placeholder="Vegetarian food, slow mornings, no long drives…" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
                </label>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 flex justify-between">
          <button disabled={step === 0 || busy} onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-2 text-sm disabled:opacity-40">Back</button>
          {step < 2 ? (
            <button disabled={step === 0 && !valid0} onClick={() => setStep(step + 1)} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Next</button>
          ) : (
            <button disabled={busy} onClick={submit} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {busy ? "Planning your trip…" : "Generate itinerary"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
