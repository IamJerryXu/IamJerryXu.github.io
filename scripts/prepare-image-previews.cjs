#!/usr/bin/env node
'use strict';

// Run with Node.js and sharp installed (or exposed through NODE_PATH).
// Optional first argument selects the JSON report path outside the published site.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const reportPath = path.resolve(process.argv[2] || path.join(root, '..', '..', 'output', 'image-preview-report.json'));
const options = { quality: 90, effort: 6, smartSubsample: true };

async function createVariants(source, name, widths) {
  const input = path.join(assets, source);
  const originalBytes = (await fs.stat(input)).size;
  const metadata = await sharp(input).metadata();
  const variants = [];
  for (const width of widths) {
    const src = `previews/${name}-${width}.webp`;
    const result = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true, kernel: 'lanczos3' })
      .webp(options)
      .toFile(path.join(assets, src));
    variants.push({ src, width: result.width, height: result.height, bytes: result.size });
  }
  return { source, originalBytes, originalWidth: metadata.width, originalHeight: metadata.height, variants };
}

async function main() {
  const content = JSON.parse(await fs.readFile(path.join(root, 'content.json'), 'utf8'));
  await fs.mkdir(path.join(assets, 'previews'), { recursive: true });
  const manifest = { papers: {}, portraits: {} };
  for (const paper of content.papers) {
    manifest.papers[paper.id] = await createVariants(paper.image_full || paper.image, paper.id, [420, 630]);
  }
  for (const source of ['portrait-cv.png', 'portrait-memoji-transparent-v1.png', 'portrait-shirt-extension-v1.png']) {
    manifest.portraits[source] = await createVariants(source, path.parse(source).name, [480, 960]);
  }
  await fs.writeFile(path.join(assets, 'image-previews.json'), JSON.stringify(manifest, null, 2) + '\n');
  const all = [...Object.values(manifest.papers), ...Object.values(manifest.portraits)];
  const originalBytes = all.reduce((total, item) => total + item.originalBytes, 0);
  const totals = [0, 1].map(index => {
    const previewBytes = all.reduce((total, item) => total + item.variants[index].bytes, 0);
    return { variantIndex: index, originalBytes, previewBytes, reductionPercent: Number((100 * (1 - previewBytes / originalBytes)).toFixed(2)) };
  });
  const report = { webpOptions: options, totals, ...manifest };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ manifest: 'assets/image-previews.json', report: reportPath, totals }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
