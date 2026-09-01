import test from "node:test";
import assert from "node:assert/strict";
import { assertLowRisk } from "../src/risk.js";

const safe = {
  phrase_lines: ["I DRAFTED", "LIKE A LOSER"], eyebrow: "LAST PLACE", footer: "ASK MY LEAGUE",
  style: "minimal" as const, palette: "blue" as const,
  title: "Funny Fantasy Football Loser Flag for League Punishment",
  description: "An original fantasy football punishment flag designed for the manager who finished last. AI-assisted design, printed by a disclosed production partner.",
  tags: ["fantasy football", "last place flag", "league loser", "loser punishment", "funny league gift", "draft day gift", "football gag gift", "toilet bowl gift", "commissioner gift", "league punishment", "fantasy loser", "funny sports flag", "last place gift"],
  rationale: "It clearly communicates the joke and targets a specific gift buyer."
};

test("accepts low-risk original concepts", () => assert.doesNotThrow(() => assertLowRisk(safe)));
test("rejects protected league terms", () => assert.throws(() => assertLowRisk({ ...safe, footer: "NFL loser" }), /blocked term/));
