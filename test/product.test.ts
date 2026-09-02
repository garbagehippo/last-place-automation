import test from "node:test";
import assert from "node:assert/strict";
import { getProductProfile } from "../src/product.js";

test("uses independent dimensions, templates, and prices by product format", () => {
  const standard = getProductProfile("standard-flag");
  const garden = getProductProfile("garden-flag");
  assert.deepEqual([standard.width, standard.height, standard.defaultPriceCents], [5400, 3600, 2499]);
  assert.deepEqual([garden.width, garden.height, garden.defaultPriceCents], [3600, 5400, 2499]);
  assert.equal(garden.templateSecret, "PRINTIFY_GARDEN_FLAG_TEMPLATE_PRODUCT_ID");
});
