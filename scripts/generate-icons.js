// Run with: node scripts/generate-icons.js
// Requires: npm install canvas (optional) — or use the SVG below to generate PNGs manually.
// This script creates placeholder PNG icons using a simple approach.

const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, '..', 'public', 'icons');

// Minimal 1x1 transparent PNG base64 — replace with real icons before publishing
// For dev/testing, create SVG-based icons using a tool like Inkscape or Figma.
// The SVG source for the icon is below:
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#0f1117"/>
  <rect x="16" y="16" width="44" height="44" rx="8" fill="#4f86f7"/>
  <rect x="68" y="16" width="44" height="44" rx="8" fill="#4f86f7" opacity=".6"/>
  <rect x="16" y="68" width="44" height="44" rx="8" fill="#4f86f7" opacity=".6"/>
  <rect x="68" y="68" width="44" height="44" rx="8" fill="#4f86f7" opacity=".3"/>
</svg>`;

// Write SVG as reference
fs.writeFileSync(path.join(outDir, 'icon.svg'), SVG);

console.log('SVG icon written to public/icons/icon.svg');
console.log('');
console.log('To generate PNG icons, use one of these methods:');
console.log('');
console.log('  1. Online: https://svgtopng.com — upload icon.svg, export at 16/32/48/128px');
console.log('     Save as icon16.png, icon32.png, icon48.png, icon128.png');
console.log('');
console.log('  2. Inkscape CLI:');
sizes.forEach(s => {
  console.log(`     inkscape -w ${s} -h ${s} public/icons/icon.svg -o public/icons/icon${s}.png`);
});
console.log('');
console.log('  3. ImageMagick:');
sizes.forEach(s => {
  console.log(`     magick public/icons/icon.svg -resize ${s}x${s} public/icons/icon${s}.png`);
});

// Create 1px placeholder PNGs so webpack copy doesn't fail
// These are valid minimal PNGs (1x1 blue pixel)
const minimalPng = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
  '2e00000000c4944415478016360f8cfc00000000200016700fb2000000000049454e44ae426082',
  'hex'
);

sizes.forEach(s => {
  const fp = path.join(outDir, `icon${s}.png`);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, minimalPng);
    console.log(`Created placeholder: icon${s}.png`);
  }
});
