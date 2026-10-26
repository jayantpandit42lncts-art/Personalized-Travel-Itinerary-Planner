import { z } from "zod/v4";

export const activitySchema = z.object({
  time: z.string().describe("Start time like 08:30"),
  title: z.string(),
  description: z.string(),
  location: z.string(),
  durationMinutes: z.number(),
  estimatedCost: z.number().describe("Estimated cost per person in INR"),
  category: z.enum(["sightseeing", "food", "adventure", "relaxation", "culture", "shopping", "transport"]),
});

export const itinerarySchema = z.object({
  summary: z.string(),
  recommendations: z.array(z.string()).describe("3-5 tips or must-see recommendations"),
  days: z.array(
    z.object({
      day: z.number(),
      date: z.string(),
      theme: z.string(),
      area: z.string().describe("Neighbourhood cluster for this day to minimise travel"),
      activities: z.array(activitySchema),
    }),
  ),
  totalEstimatedCost: z.number().describe("Total trip cost for the whole group in INR"),
});

export type Itinerary = z.infer<typeof itinerarySchema>;

export const VIBES = ["adventure", "relaxation", "luxury", "budget", "moderate"] as const;
export const INTERESTS = [
  "History",
  "Food",
  "Nature",
  "Nightlife",
  "Art",
  "Shopping",
  "Spirituality",
  "Photography",
  "Beaches",
  "Hiking",
] as const;

export function tripDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}
