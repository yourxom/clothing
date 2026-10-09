const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function testCleanPath() {
  // Clean bezier curve without any self-intersection
  // Bounding box: 0 to 24
  const pathD = "M 11.5 2.5 C 6.5 6.5 4.8 11.5 5.5 18 C 10.5 19 15.5 17 19.5 12.2 C 16.5 13.2 13.5 13 11 11.2 C 14 10.2 16 8.2 17 5.2 C 14 7 11.2 6.8 8.8 5 C 10 3.8 11 2.8 11.5 2.5 Z";

  const motifSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" aria-hidden="true">
  <path fill="#c85b5b" d="${pathD}" />
</svg>`;

  await sharp(Buffer.from(motifSvg))
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'aurelia-motif-clean.png'));

  console.log('Saved aurelia-motif-clean.png');
}

testCleanPath().catch(console.error);
