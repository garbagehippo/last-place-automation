# Last Place Automation

Approval-driven product automation for **Last Place Outfitters**.

## What it does

1. A scheduled workflow selects an unused human-curated concept from a reusable theme file.
2. OpenAI creates the visual treatment and truthful Etsy listing without changing the approved printed phrase.
3. Exact SVG typography is rendered into a 5400×3600 print-ready PNG.
4. A pull request displays the design, listing copy, tags, price, and rationale.
5. **Merge** the pull request to approve and publish through Printify to Etsy. **Close** it to reject.

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
- `ACTIVE_THEME` (default: `fantasy-football-loser`; used by scheduled runs)

The current live flag can serve as the initial template because it already contains the desired provider, variants, placement, and shipping setup. The automation reads that configuration, creates a new product, and replaces the artwork and listing content.

After adding only the `PRINTIFY_API_TOKEN` secret, run **Actions → Inspect Printify IDs**. Its job summary displays the shop and product IDs needed for the other two secrets.

## Approval workflow

- Run **Actions → Generate candidate → Run workflow**, enter a theme key, or wait for the Tuesday/Friday schedule.
- Review the generated pull request.
- Merge to approve, or close to reject.

## Switching themes

Themes live in `config/themes`. The automation logic, Printify connection, approval flow, and publishing code do not change when the audience changes.

1. Copy `config/themes/_template.json` to a new lowercase key such as `hunting-humor.json`.
2. Describe the audience, motivation, tone, occasions, search language, subjects to avoid, and a curated queue of phrases worth producing.
3. Commit the file.
4. Enter `hunting-humor` when manually running **Generate candidate**, or set the repository variable `ACTIVE_THEME` to use it for scheduled runs.

Theme switching currently reuses the configured flag product. Product formats are intentionally separate: adding shirts later requires one shirt template and renderer configuration, but every theme can then use it.

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
