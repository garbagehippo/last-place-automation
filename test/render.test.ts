import test from "node:test";
import assert from "node:assert/strict";
import { buildSvg } from "../src/render.js";

test("shrinks long lines into the safe print width", () => {
  const svg = buildSvg({
    phrase_lines: ["THE PROJECTIONS", "LIED TO ME"],
    eyebrow: "OFFICIAL LAST PLACE EXCUSE",
    footer: "I ACCEPT NO RESPONSIBILITY",
    style: "scoreboard",
    palette: "orange",
    title: "Fantasy Football Last Place Loser Flag",
    description: "A sufficiently long product description for validating a safely rendered test concept in the automated product workflow.",
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
    rationale: "A clear and readable fantasy-football punishment concept."
  });
  assert.match(svg, /THE PROJECTIONS/);
  assert.match(svg, /font-size="388"/);
});

test("renders garden flags in a portrait caution layout", () => {
  const concept = {
    phrase_lines: ["I SUCK AT", "FANTASY", "FOOTBALL"],
    eyebrow: "LAST PLACE CERTIFIED",
    footer: "ASK ANYONE IN MY LEAGUE",
    style: "scoreboard" as const,
    palette: "orange" as const,
    title: "Fantasy Football Garden Flag Last Place Punishment",
    description: "A sufficiently long product description for validating a portrait garden flag in the automated product workflow.",
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
    rationale: "A direct and readable garden-flag punishment design."
  };
  const svg = buildSvg(concept, "garden-flag", "caution");
  assert.match(svg, /width="3600" height="5400"/);
  assert.match(svg, /id="hazard"/);
  assert.match(svg, /I SUCK AT/);
});
