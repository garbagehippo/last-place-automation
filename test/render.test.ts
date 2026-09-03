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
  assert.match(svg, /<ellipse[^>]*fill="#0B0B0B"/);
  assert.match(svg, /M280 2470 H3320 L3160 3390 H440 Z/);
  assert.match(svg, /I SUCK AT/);
});

test("renders shirts on a transparent portrait canvas", () => {
  const concept = {
    phrase_lines: ["I SUCK AT", "FANTASY", "FOOTBALL"],
    eyebrow: "LAST PLACE CERTIFIED",
    footer: "ASK ANYONE IN MY LEAGUE",
    style: "scoreboard" as const,
    palette: "orange" as const,
    title: "Fantasy Football Loser Shirt Last Place Punishment",
    description: "A sufficiently long product description for validating transparent shirt artwork in the automated workflow.",
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
    rationale: "A direct and readable fantasy-football punishment shirt design."
  };
  const svg = buildSvg(concept, "shirt", "caution");
  assert.match(svg, /width="4500" height="5400"/);
  assert.match(svg, /id="shirtHazard"/);
  assert.doesNotMatch(svg, /<rect width="4500" height="5400"/);
});

test("renders surgical-tech shirts with a healthcare-specific neutral layout", () => {
  const concept = {
    phrase_lines: ["SURGICAL TECH", "AND PROUD"],
    eyebrow: "CAREER MODE",
    footer: "SKILLED FOCUSED ESSENTIAL",
    style: "minimal" as const,
    palette: "monochrome" as const,
    title: "Surgical Tech and Proud Shirt",
    description: "A sufficiently long product description for validating healthcare-specific shirt artwork.",
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
    rationale: "A wearable and profession-specific surgical technologist design."
  };
  const svg = buildSvg(concept, "shirt", "automatic", "surgical-tech");
  assert.match(svg, /width="4500" height="5400"/);
  assert.match(svg, /SURGICAL TECH/);
  assert.match(svg, /<circle cx="-125" cy="-40" r="92"/);
  assert.match(svg, /M1020 1510 C1550 1230 2950 1230 3480 1510/);
  assert.doesNotMatch(svg, /floralSprig/);
  assert.doesNotMatch(svg, /id="shirtHazard"/);
  assert.doesNotMatch(svg, /<rect width="4500" height="5400"/);
});

test("keeps the blue garden-flag eyebrow readable", () => {
  const concept = {
    phrase_lines: ["I SUCK AT", "FANTASY", "FOOTBALL"],
    eyebrow: "LAST PLACE CERTIFIED",
    footer: "ASK ANYONE IN MY LEAGUE",
    style: "scoreboard" as const,
    palette: "blue" as const,
    title: "Fantasy Football Loser Garden Flag",
    description: "A sufficiently long product description for validating readable blue garden-flag artwork.",
    tags: ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"],
    rationale: "A direct and readable blue punishment flag design."
  };
  const svg = buildSvg(concept, "garden-flag", "automatic");
  assert.match(svg, /fill="#F26A21"\/?>/);
  assert.match(svg, /fill="#F26A21"[^>]*>LAST PLACE CERTIFIED/);
});
