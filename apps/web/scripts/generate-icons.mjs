// アプリアイコン一式を scripts/icon-src/*.svg から生成する開発ユーティリティ。
// デザインを変更したら icon-src/*.svg を編集し `node scripts/generate-icons.mjs` を再実行する。
// Playwright(playwright-core) で SVG を各サイズにラスタライズする。
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(scriptDir, 'icon-src');
const publicDir = path.resolve(scriptDir, '../public');
const appDir = path.resolve(scriptDir, '../src/app');

const targets = [
  { file: 'icon-square.svg', size: 180, outDir: appDir, outName: 'apple-icon.png' },
  { file: 'icon-square.svg', size: 512, outDir: publicDir, outName: 'icon-maskable-512.png' },
  { file: 'icon-rounded.svg', size: 192, outDir: publicDir, outName: 'icon-192.png' },
  { file: 'icon-rounded.svg', size: 512, outDir: publicDir, outName: 'icon-512.png' },
];

const workDir = mkdtempSync(path.join(tmpdir(), 'coffee-lab-icons-'));

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});

for (const t of targets) {
  const page = await browser.newPage({
    viewport: { width: t.size, height: t.size },
    deviceScaleFactor: 1,
  });
  const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent}img{display:block}</style></head><body><img src="${path.join(srcDir, t.file)}" width="${t.size}" height="${t.size}"></body></html>`;
  const htmlPath = path.join(workDir, `${t.size}-${t.file}.html`);
  writeFileSync(htmlPath, html);
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(80);
  const outPath = path.join(t.outDir, t.outName);
  await page.screenshot({ path: outPath, omitBackground: true });
  console.log('wrote', outPath);
  await page.close();
}

await browser.close();
rmSync(workDir, { recursive: true, force: true });
