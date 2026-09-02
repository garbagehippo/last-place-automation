import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConceptSchema, type Concept, type Manifest } from "./types.js";
import { assertLowRisk } from "./risk.js";
import { buildSvg, renderPng } from "./render.js";
import { loadTheme, themePrompt } from "./theme.js";

const conceptJsonSchema = {
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

const batchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["candidates"],
  properties: {
    candidates: { type: "array", minItems: 5, maxItems: 5, items: conceptJsonSchema }
  }
};

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["winner_index", "clarity", "humor", "natural_language", "buyer_intent", "reason"],
  properties: {
    winner_index: { type: "integer", minimum: 0, maximum: 4 },
    clarity: { type: "integer", minimum: 1, maximum: 10 },
    humor: { type: "integer", minimum: 1, maximum: 10 },
    natural_language: { type: "integer", minimum: 1, maximum: 10 },
    buyer_intent: { type: "integer", minimum: 1, maximum: 10 },
    reason: { type: "string", minLength: 20, maxLength: 400 }
  }
};

const globalPrompt = `Create exactly five distinct original print-on-demand flag concepts for Last Place Outfitters.
The product must be immediately readable, visually distinctive, and clearly relevant to the configured buyer.
Every phrase must sound like something a real American buyer would understand without explanation.
The phrase lines must read together as one coherent joke or statement, not a pile of themed words.
Prefer direct confessions, mock awards, and unmistakable punchlines.
Never invent vague labels such as "pity cup holder" or use unexplained metaphors.
Do not use league, team, player, platform, television-show, celebrity, or brand names.
Do not quote existing slogans or copy common marketplace artwork.
Use 2-4 short phrase lines. Keep every phrase line under 28 characters.
Write a natural Etsy title under 15 words, a useful description that discloses AI-assisted design and a print partner, and exactly 13 unique Etsy tags of 20 characters or fewer.
Do not promise shipping speed, returns, materials, or dimensions because those vary by provider.
The description must say the product is double-sided, works indoors or outdoors, is printed to order, and does not include a flagpole or mounting hardware.`;

function hasMalformedText(concept: Concept): boolean {
  const text = JSON.stringify(concept);
  return text.includes("�") || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text);
}

async function chooseCandidate(client: OpenAI, model: string, candidates: Concept[]): Promise<{ concept: Concept; review: any }> {
  const response = await client.responses.create({
    model,
    input: `Act as a strict merchandising editor. Choose the single strongest product from the candidates below.

Reject AI-sounding word salad, invented award terminology, vague metaphors, and phrases that require the rationale to make sense. The words printed on the flag must communicate one complete joke in under two seconds. Score natural spoken American English, immediate clarity, actual humor, and likelihood that a fantasy league member would buy it as a punishment.

Do not reward novelty at the expense of comprehension. A direct, funny confession is stronger than a clever-sounding but confusing phrase.

Candidates:\n${JSON.stringify(candidates.map((candidate, index) => ({ index, phrase_lines: candidate.phrase_lines, eyebrow: candidate.eyebrow, footer: candidate.footer, title: candidate.title, rationale: candidate.rationale })), null, 2)}`,
    text: { format: { type: "json_schema", name: "quality_review", strict: true, schema: reviewSchema } }
  });
  const review = JSON.parse(response.output_text);
  if (review.clarity < 8 || review.natural_language < 8 || review.humor < 6 || review.buyer_intent < 7) {
    throw new Error(`No candidate passed quality review: ${review.reason}`);
  }
  const concept = candidates[review.winner_index];
  if (!concept) throw new Error(`Quality reviewer selected invalid candidate index ${review.winner_index}`);
  return { concept, review };
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
  const themeKey = process.env.THEME || "fantasy-football-loser";
  const theme = await loadTheme(themeKey);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  const response = await client.responses.create({
    model,
    input: `${globalPrompt}\n\n${themePrompt(theme)}`,
    text: { format: { type: "json_schema", name: "product_candidates", strict: true, schema: batchSchema } }
  });

  const raw = JSON.parse(response.output_text);
  const candidates = raw.candidates.map((candidate: unknown) => ConceptSchema.parse(candidate))
    .filter((candidate: Concept) => !hasMalformedText(candidate))
    .filter((candidate: Concept) => {
      try { assertLowRisk(candidate); return true; } catch { return false; }
    });
  if (candidates.length < 1) throw new Error("No generated candidates passed the text and risk filters");
  const { concept, review } = await chooseCandidate(client, model, candidates);
  const date = new Date().toISOString().replace(/[:.]/g, "-");
  const slug = `${theme.key}-${slugify(concept.phrase_lines.join(" "))}-${date.slice(0, 10)}`;
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
    product_type: "flag",
    retail_price_cents: Number(process.env.RETAIL_PRICE_CENTS || 2499),
    design_file: "design.png",
    svg_file: "design.svg",
    created_at: new Date().toISOString(),
    status: "pending_approval"
  };
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  await writeFile(path.join(dir, "README.md"), `# Approval: ${concept.phrase_lines.join(" ")}\n\n## Design\n\nOpen **Files changed** above, then select \`design.png\` to view the full-resolution design.\n\n**Theme:** ${theme.name} (\`${theme.key}\`)\n\n**Independent quality review:** clarity ${review.clarity}/10, humor ${review.humor}/10, natural language ${review.natural_language}/10, buyer intent ${review.buyer_intent}/10. ${review.reason}\n\n**Why it may sell:** ${concept.rationale}\n\n**Price:** $${(manifest.retail_price_cents / 100).toFixed(2)}\n\n**Title:** ${concept.title}\n\n**Tags:** ${concept.tags.join(", ")}\n\nMerge this pull request to publish. Close it to reject.\n`);

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(process.env.GITHUB_OUTPUT, `candidate_dir=${dir}\nslug=${slug}\ntitle=${concept.phrase_lines.join(" ")}\n`, { flag: "a" });
  }
  console.log(dir);
}

main().catch(error => { console.error(error); process.exit(1); });
