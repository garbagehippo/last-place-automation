import sharp from "sharp";
import type { Concept } from "./types.js";

const palettes = {
  blue: { bg: "#F4F7FF", ink: "#111318", accent: "#2F6BFF", reverse: "#FFFFFF" },
  green: { bg: "#F2F5EC", ink: "#15221A", accent: "#39734F", reverse: "#FFFFFF" },
  orange: { bg: "#FFF5EA", ink: "#171310", accent: "#E8652A", reverse: "#FFFFFF" },
  monochrome: { bg: "#F5F5F2", ink: "#101010", accent: "#555555", reverse: "#FFFFFF" }
};

const esc = (value: string) => value.replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
}[c]!));

export function buildSvg(concept: Concept): string {
  const p = palettes[concept.palette];
  const lines = concept.phrase_lines;
  const startY = lines.length === 4 ? 1260 : lines.length === 3 ? 1400 : 1580;
  const gap = lines.length === 4 ? 520 : lines.length === 3 ? 610 : 740;
  const fontSize = lines.reduce((max, line) => Math.max(max, line.length), 0) > 20 ? 410 : 500;
  const text = lines.map((line, i) =>
    `<text x="2700" y="${startY + i * gap}" text-anchor="middle" fill="${i === lines.length - 1 ? p.reverse : p.ink}" font-family="Arial Black,DejaVu Sans,sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="5">${esc(line.toUpperCase())}</text>`
  ).join("\n");

  const lastBandY = startY + (lines.length - 1) * gap - fontSize + 60;
  const band = `<rect x="360" y="${lastBandY}" width="4680" height="${fontSize + 135}" rx="55" fill="${p.accent}"/>`;

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

export async function renderPng(svg: string, destination: string): Promise<void> {
  await sharp(Buffer.from(svg)).png().toFile(destination);
}
