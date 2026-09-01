# Last Place Automation

Approval-driven product automation for **Last Place Outfitters**.

## What it does

1. A scheduled workflow asks OpenAI for one original, low-risk fantasy-football punishment concept.
2. Exact SVG typography is rendered into a 5400×3600 print-ready PNG.
3. A pull request displays the design, listing copy, tags, price, and rationale.
4. **Merge** the pull request to approve and publish through Printify to Etsy. **Close** it to reject.

Nothing is published before approval.

## Required GitHub configuration

Create these under **Settings → Secrets and variables → Actions**.

### Secrets

- `OPENAI_API_KEY`
- `PRINTIFY_API_TOKEN`
- `PRINTIFY_SHOP_ID`
- `PRINTIFY_FLAG_TEMPLATE_PRODUCT_ID`

### Optional variables

- `OPENAI_TEXT_MODEL` (default: `gpt-5-mini`)
- `RETAIL_PRICE_CENTS` (default: `2499`)

The current live flag can serve as the initial template because it already contains the desired provider, variants, placement, and shipping setup. The automation reads that configuration, creates a new product, and replaces the artwork and listing content.

After adding only the `PRINTIFY_API_TOKEN` secret, run **Actions → Inspect Printify IDs**. Its job summary displays the shop and product IDs needed for the other two secrets.

## Approval workflow

- Run **Actions → Generate candidate → Run workflow**, or wait for the Tuesday/Friday schedule.
- Review the generated pull request.
- Merge to approve, or close to reject.

## Local development

```bash
npm install
npm test
npm run typecheck
```

Copy `.env.example` to `.env` only for local testing. Never commit API tokens.

## Safety boundaries

- Team, league, platform, celebrity, and common protected terms are blocked.
- The generation prompt prohibits brand names, player names, copied slogans, and marketplace imitation.
- Human approval is mandatory.
- Automated screening is not a legal trademark clearance. Review every approved phrase before merging.
- Configure Etsy's no-returns policy as the default used for new Printify listings, then verify it on the first automatically published test.
