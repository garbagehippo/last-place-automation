import sharp from "sharp";
import type { Concept } from "./types.js";
import type { ProductType } from "./product.js";

const palettes = {
  blue: { bg: "#123B7A", ink: "#FFFFFF", accent: "#F26A21", reverse: "#FFFFFF" },
  green: { bg: "#173B2A", ink: "#F7F0D8", accent: "#D6A84B", reverse: "#173B2A" },
  orange: { bg: "#FFF5EA", ink: "#171310", accent: "#E8652A", reverse: "#FFFFFF" },
  monochrome: { bg: "#F5F5F2", ink: "#101010", accent: "#555555", reverse: "#FFFFFF" }
};

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
}[c]!));

function buildLandscapeSvg(concept: Concept): string {
  const p = palettes[concept.palette];
  const lines = concept.phrase_lines;
  const startY = lines.length === 4 ? 1260 : lines.length === 3 ? 1400 : 1580;
  const gap = lines.length === 4 ? 520 : lines.length === 3 ? 610 : 740;
  const safeTextWidth = 4200;
  const fontSizes = lines.map(line => Math.min(500, Math.floor(safeTextWidth / Math.max(1, line.length * 0.72))));
  const text = lines.map((line, i) => {
    const fontSize = fontSizes[i]!;
    const estimatedWidth = line.length * fontSize * 0.72;
    const fit = estimatedWidth > safeTextWidth
      ? ` textLength="${safeTextWidth}" lengthAdjust="spacingAndGlyphs"`
      : "";
    return `<text x="2700" y="${startY + i * gap}" text-anchor="middle" fill="${i === lines.length - 1 ? p.reverse : p.ink}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="5"${fit}>${esc(line.toUpperCase())}</text>`;
  }).join("\n");

  const lastFontSize = fontSizes[fontSizes.length - 1]!;
  const lastBandY = startY + (lines.length - 1) * gap - lastFontSize + 60;
  const band = `<rect x="360" y="${lastBandY}" width="4680" height="${lastFontSize + 135}" rx="55" fill="${p.accent}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="5400" height="3600" viewBox="0 0 5400 3600">
  <rect width="5400" height="3600" fill="${p.bg}"/>
  <rect x="120" y="120" width="5160" height="3360" rx="65" fill="none" stroke="${p.ink}" stroke-width="32"/>
  <rect x="1650" y="350" width="2100" height="230" rx="115" fill="${p.accent}"/>
  <text x="2700" y="510" text-anchor="middle" fill="${p.bg}" font-family="Arial,DejaVu Sans,sans-serif" font-size="105" font-weight="800" letter-spacing="15">${esc(concept.eyebrow.toUpperCase())}</text>
  ${band}
  ${text}
  <line x1="700" y1="3025" x2="4700" y2="3025" stroke="${p.accent}" stroke-width="20"/>
  <text x="2700" y="3260" text-anchor="middle" fill="${p.ink}" font-family="Arial,DejaVu Sans,sans-serif" font-size="135" font-weight="800" letter-spacing="12">${esc(concept.footer.toUpperCase())}</text>
  </svg>`;
}

function buildGardenSvg(concept: Concept, layout: "automatic" | "caution"): string {
  const colors = layout === "caution"
    ? { bg: "#FFD21F", primary: "#0B0B0B", accent: "#0B0B0B", accentText: "#FFD21F" }
    : concept.palette === "blue"
      ? { bg: "#123B7A", primary: "#FFFFFF", accent: "#F26A21", accentText: "#123B7A" }
      : { bg: "#123C2B", primary: "#F4E8C8", accent: "#D9AA43", accentText: "#123C2B" };

  const phrase = concept.phrase_lines.join(" ").toUpperCase();
  const lines = phrase === "FANTASY FOOTBALL LOSER"
    ? ["FANTASY", "FOOTBALL", "LOSER"]
    : phrase === "LAST PLACE IN FANTASY FOOTBALL"
      ? ["LAST PLACE", "IN FANTASY", "FOOTBALL"]
      : concept.phrase_lines.map(line => line.toUpperCase());
  const displayLines = lines.slice(0, -1);
  const featuredLine = lines[lines.length - 1]!;
  const mainText = displayLines.map((line, index) => {
    const y = 1570 + index * 610;
    return `<text x="1800" y="${y}" text-anchor="middle" fill="${colors.primary}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="500" font-weight="900" letter-spacing="10" textLength="${line.length > 9 ? 3060 : 2780}" lengthAdjust="spacingAndGlyphs">${esc(line)}</text>`;
  }).join("\n");
  const footer = concept.footer.toUpperCase();
  const footerLines = footer === "LAST PLACE AND PROUD" ? ["LAST PLACE", "AND PROUD"]
    : footer === "ASK ANYONE IN MY LEAGUE" ? ["ASK ANYONE", "IN MY LEAGUE"]
      : footer === "WORST TEAM IN THE LEAGUE" ? ["WORST TEAM", "IN THE LEAGUE"]
        : [footer];
  const footerText = footerLines.map((line, index) => `<text x="1800" y="${3860 + index * 350}" text-anchor="middle" fill="${index === 0 ? colors.accent : colors.primary}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="${footerLines.length === 1 ? 170 : index === 0 ? 205 : 165}" font-weight="900" letter-spacing="22">${esc(line)}</text>`).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="3600" height="5400" viewBox="0 0 3600 5400">
  <rect width="3600" height="5400" fill="${colors.bg}"/>
  <rect x="105" y="105" width="3390" height="5190" rx="48" fill="none" stroke="${colors.primary}" stroke-width="28"/>
  <rect x="160" y="160" width="3280" height="5080" rx="38" fill="none" stroke="${colors.accent}" stroke-width="12"/>
  <text x="1800" y="480" text-anchor="middle" fill="${colors.accent}" font-family="Arial,DejaVu Sans,sans-serif" font-size="108" font-weight="900" letter-spacing="20" textLength="2860" lengthAdjust="spacingAndGlyphs">${esc(concept.eyebrow.toUpperCase())}</text>
  <line x1="430" y1="800" x2="1310" y2="800" stroke="${colors.accent}" stroke-width="20"/>
  <line x1="2290" y1="800" x2="3170" y2="800" stroke="${colors.accent}" stroke-width="20"/>
  <ellipse cx="1800" cy="800" rx="330" ry="175" fill="${colors.accent}" transform="rotate(-12 1800 800)"/>
  <path d="M1660 765 L1940 835 M1710 710 L1690 820 M1780 725 L1760 835 M1850 740 L1830 850 M1920 755 L1900 865" stroke="${colors.accentText}" stroke-width="27" stroke-linecap="round" fill="none"/>
  ${mainText}
  <path d="M280 2470 H3320 L3160 3390 H440 Z" fill="${colors.accent}"/>
  <path d="M410 2595 H3190 L3075 3265 H525 Z" fill="${colors.bg}"/>
  <text x="1800" y="2930" text-anchor="middle" dominant-baseline="central" fill="${colors.primary}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="760" font-weight="900" letter-spacing="16" textLength="2320" lengthAdjust="spacingAndGlyphs">${esc(featuredLine)}</text>
  ${footerText}
  <g fill="${colors.accent}"><path d="M815 4470 l45 92 102 15-74 72 18 102-91-48-91 48 18-102-74-72 102-15z"/><path d="M1800 4470 l45 92 102 15-74 72 18 102-91-48-91 48 18-102-74-72 102-15z"/><path d="M2785 4470 l45 92 102 15-74 72 18 102-91-48-91 48 18-102-74-72 102-15z"/></g>
  <rect x="500" y="4910" width="2600" height="105" rx="52" fill="${colors.accent}"/>
  </svg>`;
}

function buildShirtSvg(concept: Concept, layout: "automatic" | "caution"): string {
  const caution = layout === "caution";
  const p = caution
    ? { ink: "#111111", accent: "#FFD21F", reverse: "#FFFFFF" }
    : palettes[concept.palette];
  const lines = concept.phrase_lines;
  const startY = lines.length === 4 ? 1700 : lines.length === 3 ? 1900 : 2150;
  const gap = lines.length === 4 ? 610 : lines.length === 3 ? 760 : 920;
  const safeWidth = 3500;
  const sizes = lines.map(line => Math.min(560, Math.floor(safeWidth / Math.max(1, line.length * 0.7))));
  const text = lines.map((line, index) => {
    const last = index === lines.length - 1;
    return `<text x="2250" y="${startY + index * gap}" text-anchor="middle" fill="${last ? (caution ? p.ink : p.reverse) : p.ink}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="${sizes[index]}" font-weight="900" letter-spacing="4">${esc(line.toUpperCase())}</text>`;
  }).join("\n");
  const lastSize = sizes[sizes.length - 1]!;
  const lastY = startY + (lines.length - 1) * gap;
  const band = `<rect x="300" y="${lastY - lastSize + 80}" width="3900" height="${lastSize + 190}" rx="60" fill="${p.accent}"/>`;
  const hazard = caution ? `<defs><pattern id="shirtHazard" width="250" height="170" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)"><rect width="125" height="170" fill="#111111"/><rect x="125" width="125" height="170" fill="#FFD21F"/></pattern></defs><rect x="500" y="690" width="3500" height="170" fill="url(#shirtHazard)"/><rect x="500" y="4500" width="3500" height="170" fill="url(#shirtHazard)"/>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="4500" height="5400" viewBox="0 0 4500 5400">
  ${hazard}
  <rect x="950" y="1020" width="2600" height="230" rx="115" fill="${p.ink}"/>
  <text x="2250" y="1180" text-anchor="middle" fill="${caution ? p.accent : p.reverse}" font-family="Arial,DejaVu Sans,sans-serif" font-size="110" font-weight="900" letter-spacing="14">${esc(concept.eyebrow.toUpperCase())}</text>
  ${band}
  ${text}
  <line x1="700" y1="4200" x2="3800" y2="4200" stroke="${caution ? p.accent : p.accent}" stroke-width="24"/>
  <text x="2250" y="4420" text-anchor="middle" fill="${p.ink}" font-family="Arial,DejaVu Sans,sans-serif" font-size="130" font-weight="900" letter-spacing="9">${esc(concept.footer.toUpperCase())}</text>
  </svg>`;
}

export function buildSvg(concept: Concept, productType: ProductType = "standard-flag", layout: "automatic" | "caution" = "automatic"): string {
  if (productType === "garden-flag") return buildGardenSvg(concept, layout);
  if (productType === "shirt") return buildShirtSvg(concept, layout);
  return buildLandscapeSvg(concept);
}

export async function renderPng(svg: string, destination: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(destination);
}
