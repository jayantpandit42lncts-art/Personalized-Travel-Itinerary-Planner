import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ tripId: z.string().uuid(), tweak: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", data.tripId)
      .single();
    if (error || !trip) throw new Error("Trip not found");

    const { buildItinerary } = await import("./ai.server");
    const res = await buildItinerary(trip, data.tweak);
    if (!res.ok) return { ok: false as const, error: res.error };

    const { error: upErr } = await supabase
      .from("trips")
      .update({ itinerary: res.itinerary as never, updated_at: new Date().toISOString() })
      .eq("id", trip.id);
    if (upErr) return { ok: false as const, error: "Could not save itinerary" };
    return { ok: true as const };
  });
