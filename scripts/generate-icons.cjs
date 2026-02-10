// Generate PWA icons
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple tent icon SVG
const iconSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0b0b0b"/>
  <g transform="translate(256,256)">
    <path d="M -100,-80 L 0,-160 L 100,-80 L 100,100 L -100,100 Z" 
          fill="none" 
          stroke="#d4af37" 
          stroke-width="12" 
          stroke-linejoin="miter"/>
    <line x1="0" y1="-160" x2="0" y2="100" 
          stroke="#d4af37" 
          stroke-width="12"/>
    <line x1="-100" y1="20" x2="100" y2="20" 
          stroke="#d4af37" 
          stroke-width="10"/>
  </g>
</svg>
`;

// Generate 192x192 icon
sharp(Buffer.from(iconSVG))
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192.png'))
    .then(() => console.log('✓ Generated icon-192.png'))
    .catch(err => console.error('Error generating 192px icon:', err));

// Generate 512x512 icon
sharp(Buffer.from(iconSVG))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512.png'))
    .then(() => console.log('✓ Generated icon-512.png'))
    .catch(err => console.error('Error generating 512px icon:', err));
