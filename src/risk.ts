import type { Concept } from "./types.js";

const blocked = [
  "nfl", "super bowl", "espn", "yahoo", "sleeper", "draftkings", "fanduel",
  "eagles", "cowboys", "giants", "commanders", "chiefs", "bills", "packers",
  "steelers", "patriots", "49ers", "raiders", "ravens", "bengals", "browns",
  "broncos", "texans", "colts", "jaguars", "titans", "chargers", "dolphins",
  "jets", "bears", "lions", "vikings", "falcons", "panthers", "saints",
  "buccaneers", "cardinals", "rams", "seahawks", "sacko"
];

export function assertLowRisk(concept: Concept): void {
  const text = [
    ...concept.phrase_lines,
    concept.eyebrow,
    concept.footer,
    concept.title,
    concept.description,
    ...concept.tags
  ].join(" ").toLowerCase();

  const hit = blocked.find(term => text.includes(term));
  if (hit) throw new Error(`Risk check rejected blocked term: ${hit}`);

  if (new Set(concept.tags.map(t => t.toLowerCase())).size !== 13) {
    throw new Error("Risk check rejected duplicate Etsy tags");
  }
}
