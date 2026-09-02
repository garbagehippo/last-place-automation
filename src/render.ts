import sharp from "sharp";
import type { Concept } from "./types.js";
import type { ProductType } from "./product.js";

const palettes = {
  blue: { bg: "#F4F7FF", ink: "#111318", accent: "#2F6BFF", reverse: "#FFFFFF" },
  green: { bg: "#F2F5EC", ink: "#15221A", accent: "#39734F", reverse: "#FFFFFF" },
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
  <rect x="1650" y="350" width="2100" height="230" rx="115" fill="${p.ink}"/>
  <text x="2700" y="510" text-anchor="middle" fill="${p.reverse}" font-family="Arial,DejaVu Sans,sans-serif" font-size="105" font-weight="800" letter-spacing="15">${esc(concept.eyebrow.toUpperCase())}</text>
  ${band}
  ${text}
  <line x1="700" y1="3025" x2="4700" y2="3025" stroke="${p.accent}" stroke-width="20"/>
  <text x="2700" y="3260" text-anchor="middle" fill="${p.ink}" font-family="Arial,DejaVu Sans,sans-serif" font-size="135" font-weight="800" letter-spacing="12">${esc(concept.footer.toUpperCase())}</text>
  </svg>`;
}

function buildGardenSvg(concept: Concept, layout: "automatic" | "caution"): string {
  const caution = layout === "caution";
  const base = caution ? { bg: "#FFD21F", ink: "#0B0B0B", accent: "#0B0B0B", reverse: "#FFFFFF" } : palettes[concept.palette];
  const lines = concept.phrase_lines;
  const startY = lines.length === 4 ? 1450 : lines.length === 3 ? 1600 : 1850;
  const gap = lines.length === 4 ? 620 : lines.length === 3 ? 760 : 980;
  const safeWidth = 2860;
  const fontSizes = lines.map(line => Math.min(410, Math.floor(safeWidth / Math.max(1, line.length * 0.72))));
  const lastFontSize = fontSizes[fontSizes.length - 1]!;
  const lastY = startY + (lines.length - 1) * gap;
  const bandY = lastY - lastFontSize + 80;
  const text = lines.map((line, index) => {
    const isLast = index === lines.length - 1;
    return `<text x="1800" y="${startY + index * gap}" text-anchor="middle" fill="${isLast ? (caution ? "#FFD21F" : base.reverse) : base.ink}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="${fontSizes[index]}" font-weight="900" letter-spacing="3">${esc(line.toUpperCase())}</text>`;
  }).join("\n");
  const stripes = caution ? `
  <defs><pattern id="hazard" width="260" height="180" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)"><rect width="130" height="180" fill="#0B0B0B"/><rect x="130" width="130" height="180" fill="#FFD21F"/></pattern></defs>
  <rect x="180" y="260" width="3240" height="210" fill="url(#hazard)"/>
  <rect x="180" y="4930" width="3240" height="210" fill="url(#hazard)"/>` : `
  <rect x="220" y="290" width="3160" height="75" rx="38" fill="${base.accent}"/>
  <rect x="220" y="5035" width="3160" height="75" rx="38" fill="${base.accent}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="3600" height="5400" viewBox="0 0 3600 5400">
  <rect width="3600" height="5400" fill="${base.bg}"/>
  <rect x="110" y="110" width="3380" height="5180" rx="55" fill="none" stroke="${base.ink}" stroke-width="28"/>
  ${stripes}
  <rect x="620" y="650" width="2360" height="210" rx="105" fill="${base.ink}"/>
  <text x="1800" y="795" text-anchor="middle" fill="${caution ? "#FFD21F" : base.reverse}" font-family="Arial,DejaVu Sans,sans-serif" font-size="98" font-weight="900" letter-spacing="13">${esc(concept.eyebrow.toUpperCase())}</text>
  <rect x="260" y="${bandY}" width="3080" height="${lastFontSize + 180}" rx="45" fill="${base.accent}"/>
  ${text}
  <line x1="520" y1="4300" x2="3080" y2="4300" stroke="${base.ink}" stroke-width="24"/>
  <text x="1800" y="4570" text-anchor="middle" fill="${base.ink}" font-family="Arial,DejaVu Sans,sans-serif" font-size="120" font-weight="900" letter-spacing="8">${esc(concept.footer.toUpperCase())}</text>
  </svg>`;
}

export function buildSvg(concept: Concept, productType: ProductType = "standard-flag", layout: "automatic" | "caution" = "automatic"): string {
  return productType === "garden-flag" ? buildGardenSvg(concept, layout) : buildLandscapeSvg(concept);
}

export async function renderPng(svg: string, destination: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(destination);
}
