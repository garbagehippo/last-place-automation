import { z } from "zod";

export const ProductTypeSchema = z.enum(["standard-flag", "garden-flag", "shirt"]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const productProfiles = {
  "standard-flag": {
    label: "standard flag",
    width: 5400,
    height: 3600,
    templateSecret: "PRINTIFY_FLAG_TEMPLATE_PRODUCT_ID",
    defaultPriceCents: 2499,
    facts: "double-sided; suitable indoors or outdoors; printed to order; flagpole and mounting hardware are not included"
  },
  "garden-flag": {
    label: "12 x 18 inch garden flag",
    width: 3600,
    height: 5400,
    templateSecret: "PRINTIFY_GARDEN_FLAG_TEMPLATE_PRODUCT_ID",
    defaultPriceCents: 2499,
    facts: "12 x 18 inches; the same design is printed on both sides; weather-resistant polyester; top pole sleeve; printed to order; garden-flag stand is not included"
  },
  "shirt": {
    label: "unisex graphic T-shirt",
    width: 4500,
    height: 5400,
    templateSecret: "PRINTIFY_SHIRT_TEMPLATE_PRODUCT_ID",
    defaultPriceCents: 2499,
    facts: "unisex retail fit; front print; fiber content varies by color; printed to order; consult the listing size chart before ordering"
  }
} as const;

export function getProductProfile(input: string | undefined) {
  const productType = ProductTypeSchema.parse(input || "standard-flag");
  return { productType, ...productProfiles[productType] };
}
