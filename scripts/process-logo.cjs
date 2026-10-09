const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processVectorAndIcon() {
  // 1. Write the clean Aurelia motif SVG to public/aurelia-motif.svg
  const motifSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path fill="#c85b5b" d="M12 2C7 6 5 11 6 18c5 1 10-1 14-6-3 1-6 1-9-1 3-1 5-3 6-6-3 2-6 2-9 0 2-1 3-2 4-3z" />
</svg>`;

  const svgPath = path.join(__dirname, '..', 'public', 'aurelia-motif.svg');
  fs.writeFileSync(svgPath, motifSvg.trim(), 'utf8');
  console.log('Saved public/aurelia-motif.svg');

  // 2. Also update public/icon.svg (the favicon / brand icon)
  const iconPath = path.join(__dirname, '..', 'public', 'icon.svg');
  fs.writeFileSync(iconPath, motifSvg.trim(), 'utf8');
  console.log('Saved public/icon.svg');

  // Also copy to outer public directory if it exists
  const outerIcon = path.join(__dirname, '..', '..', 'public', 'icon.svg');
  if (fs.existsSync(path.dirname(outerIcon))) {
    fs.writeFileSync(outerIcon, motifSvg.trim(), 'utf8');
    console.log('Saved outer public/icon.svg');
  }

  // Render to a PNG for visual inspection
  await sharp(Buffer.from(motifSvg))
    .resize(256, 256)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'aurelia-motif-256.png'));
  console.log('Rendered 256px preview PNG');
}

processVectorAndIcon().catch(console.error);
