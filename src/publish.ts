import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ManifestSchema } from "./types.js";
import { assertLowRisk } from "./risk.js";
import { publishCandidate } from "./printify.js";

async function main() {
  const candidateDir = process.argv[2];
  if (!candidateDir) throw new Error("Usage: npm run publish -- candidates/<slug>");
  const manifestPath = path.join(candidateDir, "manifest.json");
  const manifest = ManifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
  if (manifest.status === "published") throw new Error("Candidate is already marked published");
  assertLowRisk(manifest);
  const productId = await publishCandidate(candidateDir, manifest);
  const updated = { ...manifest, status: "published" as const, printify_product_id: productId };
  await writeFile(manifestPath, JSON.stringify(updated, null, 2) + "\n");
  console.log(`Published Printify product ${productId}`);
}

main().catch(error => { console.error(error); process.exit(1); });
