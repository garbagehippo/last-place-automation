import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./types.js";

const base = "https://api.printify.com/v1";

async function request(endpoint: string, init: RequestInit = {}) {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is required");
  const response = await fetch(`${base}${endpoint}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Printify ${response.status}: ${body}`);
  return body ? JSON.parse(body) : {};
}

export async function publishCandidate(candidateDir: string, manifest: Manifest): Promise<string> {
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const templateId = process.env.PRINTIFY_FLAG_TEMPLATE_PRODUCT_ID;
  if (!shopId || !templateId) throw new Error("PRINTIFY_SHOP_ID and PRINTIFY_FLAG_TEMPLATE_PRODUCT_ID are required");

  const image = await readFile(path.join(candidateDir, manifest.design_file));
  const upload = await request("/uploads/images.json", {
    method: "POST",
    body: JSON.stringify({ file_name: `${manifest.slug}.png`, contents: image.toString("base64") })
  });
  const template = await request(`/shops/${shopId}/products/${templateId}.json`);
  const enabledVariants = template.variants.filter((v: any) => v.is_enabled).map((v: any) => ({
    id: v.id, price: manifest.retail_price_cents, is_enabled: true
  }));
  const printAreas = template.print_areas.map((area: any) => ({
    variant_ids: area.variant_ids.filter((id: number) => enabledVariants.some((v: any) => v.id === id)),
    placeholders: area.placeholders.map((holder: any) => ({
      position: holder.position,
      images: holder.images.map((old: any) => ({
        id: upload.id, x: old.x, y: old.y, scale: old.scale, angle: old.angle
      }))
    }))
  })).filter((area: any) => area.variant_ids.length);

  const product = await request(`/shops/${shopId}/products.json`, {
    method: "POST",
    body: JSON.stringify({
      title: manifest.title,
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
