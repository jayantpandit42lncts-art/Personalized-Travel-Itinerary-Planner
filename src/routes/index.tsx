import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Sparkles, Route as RouteIcon, Wallet } from "lucide-react";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TravelPlanner — Personalized AI travel itineraries" },
      { name: "description", content: "Tell us where, when and how you like to travel. Get a day-by-day plan with timings and costs." },
      { property: "og:title", content: "TravelPlanner — Personalized AI travel itineraries" },
      { property: "og:description", content: "Day-by-day AI trip plans tuned to your budget, interests and vibe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link to="/auth" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft">
          Sign in
        </Link>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-12 md:grid-cols-2">
        <div>
          <p className="eyebrow text-primary">AI travel planning</p>
          <h1 className="mt-3 text-5xl font-extrabold leading-tight tracking-tight">
            Trips planned around <em className="text-primary">you</em>.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Pick a place, dates, budget and vibe. Get a day-by-day plan with timings, costs and routes that don't zig-zag across town.
          </p>
          <Link to="/auth" className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft">
            Start planning — it's free
          </Link>
        </div>
        <img src={hero} alt="Sunrise over the ghats" width={1600} height={912} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-soft" />
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-20 md:grid-cols-3">
        {[
          { icon: Sparkles, t: "Personal itineraries", d: "Built from your interests, group size and travel style." },
          { icon: RouteIcon, t: "Smart routing", d: "Each day clusters nearby stops to save travel time." },
          { icon: Wallet, t: "Cost estimates", d: "See what each activity and the whole trip should cost." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl bg-card p-6 shadow-soft">
            <f.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Globe className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold">
        Travel<span className="text-primary">Planner</span>
      </span>
    </div>
  );
}
