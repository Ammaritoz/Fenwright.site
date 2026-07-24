import { site } from "@/config/site";

/** Human-readable business label for a given industry id. Falls back gracefully. */
export function industryLabel(id: string): string {
  const found = site.industries.find((i) => i.id === id);
  return found ? found.label.toLowerCase() : "small business";
}

/** Valid industry ids, used for zod validation. */
export const industryIds = site.industries.map((i) => i.id) as [string, ...string[]];
