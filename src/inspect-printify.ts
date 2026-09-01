const base = "https://api.printify.com/v1";

async function get(endpoint: string) {
  const token = process.env.PRINTIFY_API_TOKEN;
  if (!token) throw new Error("PRINTIFY_API_TOKEN is required");
  const response = await fetch(`${base}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Printify ${response.status}: ${await response.text()}`);
  return response.json();
}

async function main() {
  const shops: any = await get("/shops.json");
  const rows: string[] = ["| Shop | Shop ID | Product | Product ID |", "|---|---|---|---|"];
  for (const shop of shops) {
    const products: any = await get(`/shops/${shop.id}/products.json?limit=50`);
    for (const product of products.data) {
      rows.push(`| ${shop.title} | \`${shop.id}\` | ${product.title.replace(/\|/g, "\\|")} | \`${product.id}\` |`);
    }
  }
  const output = `# Printify IDs\n\n${rows.join("\n")}\n`;
  console.log(output);
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_STEP_SUMMARY, output);
  }
}

main().catch(error => { console.error(error); process.exit(1); });
