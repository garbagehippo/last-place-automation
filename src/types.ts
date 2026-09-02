import { z } from "zod";

export const ConceptSchema = z.object({
  phrase_lines: z.array(z.string().min(1).max(28)).min(2).max(4),
  eyebrow: z.string().max(30),
  footer: z.string().max(45),
  style: z.enum(["collegiate", "scoreboard", "minimal"]),
  palette: z.enum(["blue", "green", "orange", "monochrome"]),
  title: z.string().min(10).max(140),
  description: z.string().min(100).max(2200),
  tags: z.array(z.string().min(1).max(20)).length(13),
  rationale: z.string().min(20).max(400)
});

export const ManifestSchema = ConceptSchema.extend({
  slug: z.string(),
  theme: z.string(),
  concept_id: z.string(),
  product_type: z.literal("flag"),
  retail_price_cents: z.number().int().positive(),
  design_file: z.string(),
  svg_file: z.string(),
  created_at: z.string(),
  status: z.enum(["pending_approval", "published"]).default("pending_approval"),
  printify_product_id: z.string().optional()
});

export type Concept = z.infer<typeof ConceptSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;
