import test from "node:test";
import assert from "node:assert/strict";
import { loadTheme, themePrompt } from "../src/theme.js";

test("loads a reusable theme configuration", async () => {
  const theme = await loadTheme("fantasy-football-loser");
  assert.equal(theme.key, "fantasy-football-loser");
  assert.match(themePrompt(theme), /Buyer motivation:/);
  const flagConcepts = theme.concepts.filter(concept => concept.product_types?.includes("standard-flag"));
  assert.equal(flagConcepts.length, 8);
  assert.equal(new Set(flagConcepts.map(concept => concept.phrase_lines.join(" "))).size, 3);
  assert.deepEqual(theme.default_product_types, ["shirt"]);
});

test("rejects unsafe theme paths", async () => {
  await assert.rejects(() => loadTheme("../secret"), /Invalid theme key/);
});
