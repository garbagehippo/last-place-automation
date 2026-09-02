import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const ThemeSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(3),
  audience: z.string().min(10),
  buyer_motivation: z.string().min(10),
  tone: z.array(z.string().min(2)).min(1),
  occasions: z.array(z.string().min(2)).min(1),
  concept_directions: z.array(z.string().min(5)).min(1),
  avoid: z.array(z.string().min(2)).default([])
});

export type Theme = z.infer<typeof ThemeSchema>;

export async function loadTheme(key: string): Promise<Theme> {
  if (!/^[a-z0-9-]+$/.test(key)) throw new Error(`Invalid theme key: ${key}`);
  const file = path.join("config", "themes", `${key}.json`);
  const theme = ThemeSchema.parse(JSON.parse(await readFile(file, "utf8")));
  if (theme.key !== key) throw new Error(`Theme key in ${file} must be ${key}`);
  return theme;
}

export function themePrompt(theme: Theme): string {
  return `Theme: ${theme.name}
Audience: ${theme.audience}
Buyer motivation: ${theme.buyer_motivation}
Tone: ${theme.tone.join(", ")}
Buying occasions: ${theme.occasions.join(", ")}
Explore these directions without copying them literally: ${theme.concept_directions.join("; ")}
Avoid: ${theme.avoid.join(", ") || "nothing beyond the global safety rules"}`;
}
