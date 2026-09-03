import test from "node:test";
import assert from "node:assert/strict";
import { buildEnabledVariants, normalizeMarketplaceTitle, priceForVariant, templateSecretForManifest } from "../src/printify.js";

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

test("preserves the template default variant for the marketplace title mockup", () => {
  const variants = buildEnabledVariants({ variants: [
    { id: 1, title: "Black / S", is_enabled: true, is_default: false },
    { id: 2, title: "White / S", is_enabled: true, is_default: true },
    { id: 3, title: "Gray / S", is_enabled: false, is_default: false }
  ] }, manifest);
  assert.deepEqual(variants.map((variant: { id: number; is_default: boolean }) => [variant.id, variant.is_default]), [[1, false], [2, true]]);
});

test("uses the first enabled variant when a template has no explicit default", () => {
  const variants = buildEnabledVariants({ variants: [
    { id: 1, title: "Black / S", is_enabled: false },
    { id: 2, title: "White / S", is_enabled: true },
    { id: 3, title: "Gray / S", is_enabled: true }
  ] }, manifest);
  assert.deepEqual(variants.map((variant: { id: number; is_default: boolean }) => [variant.id, variant.is_default]), [[2, true], [3, false]]);
});
