import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./types.js";
import { productProfiles } from "./product.js";

const base = "https://api.printify.com/v1";

async function request(endpoint: string, init: RequestInit = {}) {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is required");
  const response = await fetch(`${base}${endpoint}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "LastPlaceAutomation/1.0", ...(init.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Printify ${response.status}: ${body}`);
  return body ? JSON.parse(body) : {};
}

const titleAcronyms = new Set(["OR", "MRI", "CT", "RN", "LPN", "CNA", "MA", "ER", "ICU", "NICU"]);

export function normalizeMarketplaceTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").split(" ").map(word => {
    const letters = word.replace(/[^A-Za-z]/g, "");
    if (letters.length < 2 || letters !== letters.toUpperCase()) return word;
    if (titleAcronyms.has(letters.toUpperCase())) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
}

export function templateSecretForManifest(manifest: Manifest): string {
  if (manifest.product_type === "shirt" && manifest.theme === "surgical-tech") {
    return "PRINTIFY_HEALTHCARE_SHIRT_TEMPLATE_PRODUCT_ID";
  }
  return productProfiles[manifest.product_type].templateSecret;
}

export function buildPrintAreas(template: any, enabledVariants: Array<{ id: number }>, uploadId: string) {
  return template.print_areas.map((area: any) => ({
    variant_ids: area.variant_ids.filter((id: number) => enabledVariants.some(v => v.id === id)),
    placeholders: area.placeholders
      .filter((holder: any) => Array.isArray(holder.images) && holder.images.length > 0)
      .map((holder: any) => ({
        position: holder.position,
        images: holder.images.map((old: any) => ({
          id: uploadId, x: old.x, y: old.y, scale: old.scale, angle: old.angle
        }))
      }))
  })).filter((area: any) => area.variant_ids.length > 0 && area.placeholders.length > 0);
}

export function priceForVariant(variant: any, manifest: Manifest): number {
  if (manifest.product_type !== "shirt") return manifest.retail_price_cents;
  const searchable = [variant.title, ...(Array.isArray(variant.options) ? variant.options : [])]
    .filter(Boolean).join(" ").toUpperCase().replace(/\s+/g, " ");
  if (/(^|[ /-])3XL($|[ /-])/.test(searchable)) return 2799;
  if (/(^|[ /-])2XL($|[ /-])/.test(searchable)) return 2699;
  return 2499;
}

export async function publishCandidate(candidateDir: string, manifest: Manifest): Promise<string> {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const templateSecret = templateSecretForManifest(manifest);
  const templateId = process.env[templateSecret];
  if (!shopId || !templateId) throw new Error(`PRINTIFY_SHOP_ID and ${templateSecret} are required`);

  const image = await readFile(path.join(candidateDir, manifest.design_file));
  const upload = await request("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({ file_name: `${manifest.slug}.png`, contents: image.toString("base64") })
  });
  const template = await request(`/shops/${shopId}/products/${templateId}.json`);
  console.log(`Template routing: theme=${manifest.theme}; product=${manifest.product_type}; source=${templateSecret}; template=${template.id}; title=${template.title}`);
  if (manifest.theme === "surgical-tech" && !/healthcare/i.test(String(template.title || ""))) {
    throw new Error(`Refusing to publish surgical-tech product from non-healthcare template: ${template.title || template.id}`);
  }
  const enabledVariants = template.variants.filter((v: any) => v.is_enabled).map((v: any) => ({
    id: v.id, price: priceForVariant(v, manifest), is_enabled: true
  }));
  console.log(`Enabled template variants (${enabledVariants.length}): ${template.variants.filter((v: any) => v.is_enabled).map((v: any) => v.title).join(" | ")}`);
  const printAreas = buildPrintAreas(template, enabledVariants, upload.id);
  if (!printAreas.length) throw new Error("Template has no populated print areas to clone");

  const product = await request(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify({
      title: normalizeMarketplaceTitle(manifest.title),
      description: manifest.description,
      blueprint_id: template.blueprint_id,
      print_provider_id: template.print_provider_id,
      variants: enabledVariants,
      print_areas: printAreas,
      tags: manifest.tags
    })
  });

  await request(`/shops/${shopId}/products/${product.id}/publish.json`, {
    method: "POST",
    body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true })
  });
  return product.id;
}
