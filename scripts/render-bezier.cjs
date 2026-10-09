const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ViewBox 0 0 32 32
// Smooth curves matching Aurelia brand wing motif
const pathD = "M 7 2 C 2 7 1 15 1.5 26 C 2 29 4 30 7 30 C 13 30 19 26 29 18 C 21 18 15.5 16 12.5 14.5 C 17 11 20.5 7.5 24 3.5 C 17 5.5 11.5 4 7 2 Z";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="256" height="256" fill="none">
  <path fill="#c85b5b" d="${pathD}" />
</svg>`;

async function run() {
  await sharp(Buffer.from(svg)).png().toFile(path.join(__dirname, '..', 'public', 'aurelia-bezier-32.png'));
  console.log('Saved aurelia-bezier-32.png');
}
run().catch(console.error);
