import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { itinerarySchema, tripDays, type Itinerary } from "./itinerary";

type Trip = {
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  budget_per_day: number;
  vibe: string;
  interests: string[];
  notes: string | null;
  itinerary: unknown;
};

export async function buildItinerary(
  trip: Trip,
  tweak?: string,
): Promise<{ ok: true; itinerary: Itinerary } | { ok: false; error: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false, error: "AI is not configured." };
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const days = tripDays(trip.start_date, trip.end_date);
  const prompt = [
    `Plan a ${days}-day trip to ${trip.destination} from ${trip.start_date} to ${trip.end_date}.`,
    `Travelers: ${trip.travelers}. Budget: about ₹${trip.budget_per_day} per person per day.`,
    `Travel vibe: ${trip.vibe}. Interests: ${trip.interests.join(", ") || "general"}.`,
    trip.notes ? `Extra notes: ${trip.notes}` : "",
    tweak && trip.itinerary
      ? `Here is the current itinerary JSON: ${JSON.stringify(trip.itinerary)}\nModify it according to this request: ${tweak}`
      : "",
  ].join("\n");

  try {
    const result = streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: provider.responses("openai/gpt-6-astra") as any,
      system:
        "You are an expert travel planner. Create realistic day-wise itineraries with real places, sensible timings, and costs in INR. Group each day's activities by neighbourhood to minimise travel time, order them geographically, and include meals. Respect the budget and vibe.",
      prompt,
      output: Output.object({ schema: itinerarySchema }),
      maxRetries: 0,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const itinerary = (await result.output) as Itinerary;
    return { ok: true, itinerary };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    console.error("AI itinerary error", status, e);
    if (status === 429) return { ok: false, error: "Too many requests right now. Please try again in a minute." };
    if (status === 402) return { ok: false, error: "AI credits have run out for this workspace." };
    return { ok: false, error: "The AI planner couldn't create an itinerary. Please try again." };
  }
}
