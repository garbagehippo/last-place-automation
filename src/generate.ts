import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConceptSchema, type Concept, type Manifest } from "./types.js";
import { assertLowRisk } from "./risk.js";
import { buildSvg, renderPng } from "./render.js";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["phrase_lines", "eyebrow", "footer", "style", "palette", "title", "description", "tags", "rationale"],
  properties: {
    phrase_lines: { type: "array", minItems: 2, maxItems: 4, items: { type: "string", minLength: 1, maxLength: 28 } },
    eyebrow: { type: "string", maxLength: 30 },
    footer: { type: "string", maxLength: 45 },
    style: { type: "string", enum: ["collegiate", "scoreboard", "minimal"] },
    palette: { type: "string", enum: ["blue", "green", "orange", "monochrome"] },
    title: { type: "string", minLength: 10, maxLength: 140 },
    description: { type: "string", minLength: 100, maxLength: 2200 },
    tags: { type: "array", minItems: 13, maxItems: 13, items: { type: "string", minLength: 1, maxLength: 20 } },
    rationale: { type: "string", minLength: 20, maxLength: 400 }
  }
};

const prompt = `Create one original print-on-demand flag concept for Last Place Outfitters.
Audience: adult fantasy-football leagues buying funny last-place punishments.
The product must be funny, immediately readable, and useful as a humiliating gift.
Do not use league, team, player, platform, television-show, celebrity, or brand names.
Do not quote existing slogans or copy common marketplace artwork.
Use 2-4 short phrase lines. Keep every phrase line under 28 characters.
Write a natural Etsy title under 15 words, a useful description that discloses AI-assisted design and a print partner, and exactly 13 unique Etsy tags of 20 characters or fewer.
Do not promise shipping speed, returns, materials, or dimensions because those vary by provider.
The description must say the product is double-sided, works indoors or outdoors, is printed to order, and does not include a flagpole or mounting hardware.`;

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
    input: prompt,
    text: { format: { type: "json_schema", name: "product_concept", strict: true, schema } }
  });

  const concept: Concept = ConceptSchema.parse(JSON.parse(response.output_text));
  assertLowRisk(concept);
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = `${slugify(concept.phrase_lines.join(" "))}-${date.slice(0, 10)}`;
  const dir = path.join("candidates", slug);
  await mkdir(dir, { recursive: true });

  const svg = buildSvg(concept);
  const svgFile = path.join(dir, "design.svg");
  const pngFile = path.join(dir, "design.png");
  await writeFile(svgFile, svg);
  await renderPng(svg, pngFile);

  const manifest: Manifest = {
    ...concept,
    slug,
    product_type: "flag",
    retail_price_cents: Number(process.env.RETAIL_PRICE_CENTS || 2499),
    design_file: "design.png",
    svg_file: "design.svg",
    created_at: new Date().toISOString(),
    status: "pending_approval"
  };
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(dir, "README.md"), `# Approval: ${concept.phrase_lines.join(" ")}\n\n![Design](./design.png)\n\n**Why it may sell:** ${concept.rationale}\n\n**Price:** $${(manifest.retail_price_cents / 100).toFixed(2)}\n\n**Title:** ${concept.title}\n\n**Tags:** ${concept.tags.join(", ")}\n\nMerge this pull request to publish. Close it to reject.\n`);

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `candidate_dir=${dir}\nslug=${slug}\ntitle=${concept.phrase_lines.join(" ")}\n`, { flag: "a" });
  }
  console.log(dir);
}

main().catch(error => { console.error(error); process.exit(1); });
