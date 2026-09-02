import OpenAI from "openai";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConceptSchema, type Concept, type Manifest } from "./types.js";
import { assertLowRisk } from "./risk.js";
import { buildSvg, renderPng } from "./render.js";
import { loadTheme, themePrompt, type Theme } from "./theme.js";

const merchandisingSchema = {
  type: "object",
  additionalProperties: false,
  required: ["style", "palette", "title", "description", "tags", "rationale"],
  properties: {
    style: { type: "string", enum: ["collegiate", "scoreboard", "minimal"] },
    palette: { type: "string", enum: ["blue", "green", "orange", "monochrome"] },
    title: { type: "string", minLength: 10, maxLength: 140 },
    description: { type: "string", minLength: 100, maxLength: 2200 },
    tags: { type: "array", minItems: 13, maxItems: 13, items: { type: "string", minLength: 1, maxLength: 20 } },
    rationale: { type: "string", minLength: 20, maxLength: 400 }
  }
};

async function usedConceptIds(themeKey: string): Promise<Set<string>> {
  const used = new Set<string>();
  try {
    const dirs = await readdir("candidates", { withFileTypes: true });
    for (const dir of dirs.filter(entry => entry.isDirectory())) {
      try {
        const manifest = JSON.parse(await readFile(path.join("candidates", dir.name, "manifest.json"), "utf8"));
        if (manifest.theme === themeKey && manifest.concept_id) used.add(manifest.concept_id);
      } catch { /* Ignore incomplete candidate folders. */ }
    }
  } catch (error: any) {
    if (error?.code !== "ENOENT") throw error;
  }
  return used;
}

async function selectConcept(theme: Theme) {
  const used = await usedConceptIds(theme.key);
  const available = theme.concepts.filter(concept => !used.has(concept.id));
  if (!available.length) throw new Error(`All curated concepts for ${theme.key} have already been used`);
  return available[Math.floor(Math.random() * available.length)]!;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  const themeKey = process.env.THEME || "fantasy-football-loser";
  const theme = await loadTheme(themeKey);
  const seed = await selectConcept(theme);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";

  const response = await client.responses.create({
    model,
    input: `Create the merchandising treatment and truthful Etsy listing for this already-approved product phrase. Do not rewrite, reinterpret, or add to the printed phrase.

${themePrompt(theme)}

Printed phrase lines: ${JSON.stringify(seed.phrase_lines)}
Eyebrow: ${seed.eyebrow}
Footer: ${seed.footer}
Product intent: ${seed.intent}
Priority buyer search terms: ${theme.search_terms.join(", ")}

Write a natural Etsy title under 15 words that clearly includes the product type and the strongest relevant search terms. Write exactly 13 unique tags of 20 characters or fewer. Do not promise shipping speed, returns, materials, or dimensions. The description must disclose AI-assisted layout/listing work and a production partner, say the flag is double-sided, works indoors or outdoors, is printed to order, and does not include a flagpole or mounting hardware.`,
    text: { format: { type: "json_schema", name: "merchandising", strict: true, schema: merchandisingSchema } }
  });

  const merchandising = JSON.parse(response.output_text);
  const concept: Concept = ConceptSchema.parse({ phrase_lines: seed.phrase_lines, eyebrow: seed.eyebrow, footer: seed.footer, ...merchandising });
  if (JSON.stringify(concept).includes("�")) throw new Error("Generated listing contains malformed characters");
  assertLowRisk(concept);

  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = `${theme.key}-${seed.id}-${date.slice(0, 19).replace("T", "-")}`;
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
    theme: theme.key,
    concept_id: seed.id,
    product_type: "flag",
    retail_price_cents: Number(process.env.RETAIL_PRICE_CENTS || 2499),
    design_file: "design.png",
    svg_file: "design.svg",
    created_at: new Date().toISOString(),
    status: "pending_approval"
  };
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(dir, "README.md"), `# Approval: ${concept.phrase_lines.join(" ")}\n\n## Design\n\nOpen **Files changed** above, then select \`design.png\` to view the full-resolution design.\n\n**Theme:** ${theme.name} (\`${theme.key}\`)\n\n**Curated concept:** \`${seed.id}\` — ${seed.intent}\n\n**Why this treatment may sell:** ${concept.rationale}\n\n**Price:** $${(manifest.retail_price_cents / 100).toFixed(2)}\n\n**Title:** ${concept.title}\n\n**Tags:** ${concept.tags.join(", ")}\n\nMerge this pull request to publish. Close it to reject.\n`);

  if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `candidate_dir=${dir}\nslug=${slug}\ntitle=${concept.phrase_lines.join(" ")}\n`, { flag: "a" });
  console.log(dir);
}

main().catch(error => { console.error(error); process.exit(1); });
