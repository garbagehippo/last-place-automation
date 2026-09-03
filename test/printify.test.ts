import test from "node:test";
import assert from "node:assert/strict";
import { normalizeMarketplaceTitle, priceForVariant, templateSecretForManifest } from "../src/printify.js";

const manifest = {
  product_type: "shirt",
  retail_price_cents: 2499
} as any;

test("prices shirt variants by size", () => {
  assert.equal(priceForVariant({ title: "Black / S" }, manifest), 2499);
  assert.equal(priceForVariant({ title: "White / XL" }, manifest), 2499);
  assert.equal(priceForVariant({ title: "Black / 2XL" }, manifest), 2699);
  assert.equal(priceForVariant({ title: "Navy / 3XL" }, manifest), 2799);
});

test("keeps flat pricing for non-shirt products", () => {
  assert.equal(priceForVariant({ title: "2XL" }, { ...manifest, product_type: "standard-flag" }), 2499);
});

test("routes surgical-tech shirts to the healthcare template", () => {
  assert.equal(templateSecretForManifest({ ...manifest, theme: "surgical-tech" }), "PRINTIFY_HEALTHCARE_SHIRT_TEMPLATE_PRODUCT_ID");
  assert.equal(templateSecretForManifest({ ...manifest, theme: "fantasy-football-loser" }), "PRINTIFY_SHIRT_TEMPLATE_PRODUCT_ID");
});

test("normalizes excessive title capitalization while preserving medical acronyms", () => {
  assert.equal(normalizeMarketplaceTitle("SURGICAL TECH AND PROUD SHIRT"), "Surgical Tech And Proud Shirt");
  assert.equal(normalizeMarketplaceTitle("BUILT FOR THE OR Surgical Tech Shirt"), "Built For The OR Surgical Tech Shirt");
});
