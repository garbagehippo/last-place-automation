import test from "node:test";
import assert from "node:assert/strict";
import { loadTheme, themePrompt } from "../src/theme.js";

test("loads a reusable theme configuration", async () => {
  const theme = await loadTheme("fantasy-football-loser");
  assert.equal(theme.key, "fantasy-football-loser");
  assert.match(themePrompt(theme), /Buyer motivation:/);
});

test("rejects unsafe theme paths", async () => {
  await assert.rejects(() => loadTheme("../secret"), /Invalid theme key/);
});
