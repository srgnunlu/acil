#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates all required PWA icons from an SVG source
 * Phase 12 - PWA Enhancement
 */

const fs = require('fs')
const path = require('path')

// Icon sizes needed for PWA
const ICON_SIZES = {
  // Favicon
  favicon: [16, 32],

  // Android/Chrome
  android: [48, 72, 96, 144, 192, 512],

  // Apple/iOS
  apple: [76, 120, 152, 180],

  // Apple Splash Screens (using square icons for now)
  splash: [1024, 1536, 2048],
}

// All sizes combined and deduplicated
const ALL_SIZES = [...new Set([
  ...ICON_SIZES.favicon,
  ...ICON_SIZES.android,
  ...ICON_SIZES.apple,
])]

// SVG Logo Template - Simple, professional medical cross design
const SVG_LOGO = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="1024" height="1024" rx="180" fill="#2563EB"/>

  <!-- Medical Cross -->
  <g transform="translate(512, 512)">
    <!-- Vertical bar -->
    <rect x="-80" y="-320" width="160" height="640" rx="20" fill="white"/>

    <!-- Horizontal bar -->
    <rect x="-320" y="-80" width="640" height="160" rx="20" fill="white"/>

    <!-- Center circle (pulse/heartbeat indicator) -->
    <circle cx="0" cy="0" r="100" fill="#EF4444"/>
    <circle cx="0" cy="0" r="60" fill="white"/>

    <!-- Pulse line in center -->
    <path d="M -30 0 L -15 0 L -10 -20 L 0 20 L 10 -15 L 15 0 L 30 0"
          stroke="#EF4444"
          stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"/>
  </g>

  <!-- ACIL Text -->
  <text x="512" y="880"
        font-family="Arial, sans-serif"
        font-size="120"
        font-weight="bold"
        fill="white"
        text-anchor="middle">
    ACIL
  </text>
</svg>`

// Create output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Save SVG source
const svgPath = path.join(OUTPUT_DIR, 'logo-source.svg')
fs.writeFileSync(svgPath, SVG_LOGO)
console.log(`✅ Created SVG source: ${svgPath}`)

// Create simple HTML file to manually convert SVG to PNG
// (Since we don't have sharp/canvas dependencies)
const HTML_CONVERTER = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PWA Icon Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #2563EB;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
    }
    .instructions {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .icon-item {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .icon-item canvas {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .icon-item button {
      background: #2563EB;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .icon-item button:hover {
      background: #1d4ed8;
    }
    .icon-item .size {
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    .status {
      margin-top: 10px;
      padding: 10px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 4px;
      color: #166534;
      font-size: 14px;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <h1>🎨 ACIL PWA Icon Generator</h1>
  <p class="subtitle">Generate all required PWA icons from SVG source</p>

  <div class="instructions">
    <h3>📋 Instructions:</h3>
    <ol>
      <li>Click "Download" button below each icon to save it</li>
      <li>Save each file with the exact name shown (e.g., <code>icon-192.png</code>)</li>
      <li>Place all files in <code>public/icons/</code> directory</li>
      <li>Also create <code>favicon.ico</code> from the 32x32 icon</li>
    </ol>
    <p><strong>Tip:</strong> You can click "Download All" to get a zip file (requires manual extraction)</p>
  </div>

  <div id="status" class="status" style="display:none;"></div>

  <div class="icon-grid" id="iconGrid"></div>

  <script>
    const SVG_SOURCE = \`${SVG_LOGO.replace(/`/g, '\\`')}\`;

    const ICON_CONFIGS = ${JSON.stringify([
      ...ALL_SIZES.map(size => ({ size, name: `icon-${size}.png`, type: 'standard' })),
      { size: 180, name: 'apple-touch-icon.png', type: 'apple' },
      { size: 152, name: 'apple-touch-icon-152x152.png', type: 'apple' },
      { size: 120, name: 'apple-touch-icon-120x120.png', type: 'apple' },
      { size: 76, name: 'apple-touch-icon-76x76.png', type: 'apple' },
    ], null, 2)};

    function svgToCanvas(size) {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          resolve(canvas);
        };
        img.onerror = reject;

        const blob = new Blob([SVG_SOURCE], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.src = url;
      });
    }

    function downloadCanvas(canvas, filename) {
      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showStatus(\`Downloaded: \${filename}\`);
      }, 'image/png', 1.0);
    }

    function showStatus(message) {
      const status = document.getElementById('status');
      status.textContent = message;
      status.style.display = 'block';
      setTimeout(() => {
        status.style.display = 'none';
      }, 3000);
    }

    async function generateIcons() {
      const grid = document.getElementById('iconGrid');

      for (const config of ICON_CONFIGS) {
        const canvas = await svgToCanvas(config.size);

        const item = document.createElement('div');
        item.className = 'icon-item';

        const sizeLabel = document.createElement('div');
        sizeLabel.className = 'size';
        sizeLabel.textContent = \`\${config.size}×\${config.size}px\`;

        const nameLabel = document.createElement('div');
        nameLabel.style.fontSize = '12px';
        nameLabel.style.color = '#666';
        nameLabel.style.marginBottom = '10px';
        nameLabel.textContent = config.name;

        const displayCanvas = canvas.cloneNode(true);
        displayCanvas.style.maxWidth = '100%';
        displayCanvas.style.height = 'auto';

        const button = document.createElement('button');
        button.textContent = 'Download';
        button.onclick = () => downloadCanvas(canvas, config.name);

        item.appendChild(sizeLabel);
        item.appendChild(nameLabel);
        item.appendChild(displayCanvas);
        item.appendChild(button);
        grid.appendChild(item);
      }

      showStatus('✅ All icons generated! Click Download on each to save.');
    }

    // Generate icons when page loads
    generateIcons().catch(error => {
      console.error('Error generating icons:', error);
      alert('Error generating icons. Check console for details.');
    });
  </script>
</body>
</html>`

// Save HTML converter
const htmlPath = path.join(OUTPUT_DIR, 'generate-icons.html')
fs.writeFileSync(htmlPath, HTML_CONVERTER)
console.log(`✅ Created HTML converter: ${htmlPath}`)

console.log('\n📋 Next steps:')
console.log(`1. Open: file://${htmlPath}`)
console.log('2. Click "Download" for each icon')
console.log('3. Save all icons in public/icons/')
console.log('4. Create favicon.ico from icon-32.png (use online converter)')
console.log('\n✨ Or use an online tool:')
console.log('   - https://realfavicongenerator.net/')
console.log('   - https://www.pwabuilder.com/imageGenerator')
console.log('\n💡 Tip: Upload logo-source.svg to these tools for best results!')
