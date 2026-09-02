import test from "node:test";
import assert from "node:assert/strict";
import { buildPrintAreas } from "../src/printify.js";

test("omits empty template placeholders when cloning artwork", () => {
  const result = buildPrintAreas({
    print_areas: [{
      variant_ids: [10],
      placeholders: [
        { position: "front", images: [{ id: "old", x: 0.5, y: 0.5, scale: 1, angle: 0 }] },
        { position: "back", images: [{ id: "old", x: 0.5, y: 0.5, scale: 1, angle: 0 }] },
        { position: "unused", images: [] }
      ]
    }]
  }, [{ id: 10 }], "new-upload");

  assert.equal(result[0].placeholders.length, 2);
  assert.equal(result[0].placeholders[0].images[0].id, "new-upload");
  assert.equal(result.some((area: any) => area.placeholders.some((holder: any) => holder.position === "unused")), false);
});
