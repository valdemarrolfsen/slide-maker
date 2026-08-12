import { createServer } from 'vite';
import { createViteConfig } from '../vite/config.js';

/**
 * Headless rendering of a deck, shared by the PDF export and by the MCP
 * render_slide tool.
 *
 * Rendering runs against a real Vite dev server rather than a production
 * build, so what comes out is exactly what the studio shows, and a render
 * costs no build step. The server and browser are created on first use and
 * kept alive, which matters for the MCP case where Claude may render a slide,
 * fix it, and render it again within seconds.
 */

let harness = null;

const PLAYWRIGHT_HINT =
  'Rendering needs Playwright and a Chromium build.\n' +
  '  pnpm add playwright\n' +
  '  pnpm exec playwright install chromium';

async function loadChromium() {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch {
    throw new Error(PLAYWRIGHT_HINT);
  }
}

async function getHarness({ deckDir, config }) {
  if (harness && harness.deckDir === deckDir) return harness;
  if (harness) await closeRenderer();

  const chromium = await loadChromium();

  const base = createViteConfig({ deckDir, config, mode: 'present', base: '/' });
  const server = await createServer({
    ...base,
    server: {
      ...base.server,
      port: 0,
      strictPort: false,
      // Nothing is watching this server, so skip the file watcher and HMR.
      watch: null,
      hmr: false,
    },
  });
  await server.listen();

  const url = server.resolvedUrls?.local?.[0];
  if (!url) {
    await server.close();
    throw new Error('Could not start a local server for rendering');
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    await server.close();
    throw new Error(`${PLAYWRIGHT_HINT}\n\nUnderlying error: ${err.message}`);
  }

  harness = { deckDir, server, browser, url: url.replace(/\/$/, '') };
  return harness;
}

/** Shuts down the shared browser and server. Safe to call when nothing is open. */
export async function closeRenderer() {
  if (!harness) return;
  const { server, browser } = harness;
  harness = null;
  await browser.close().catch(() => {});
  await server.close().catch(() => {});
}

async function openPage({ browser, url }, config, scale) {
  const page = await browser.newPage({
    viewport: {
      width: Math.round(config.width * scale),
      height: Math.round(config.height * scale),
    },
    deviceScaleFactor: 1,
  });
  await page.goto(`${url}/present.html`, { waitUntil: 'load' });
  // Slides mount client-side, so wait for one to exist rather than for the
  // document, and give webfonts a chance to settle before measuring anything.
  await page.waitForSelector('.sm-present-on .sm-slide', { timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready);
  // The counter and keyboard hint are fixed to the viewport, so they would be
  // painted over the slide and captured in an element screenshot.
  await page.addStyleTag({
    content: '.sm-present-hint, .sm-present-counter { display: none !important; }',
  });
  return page;
}

/**
 * Renders slides to PNG.
 *
 * `scale` trades image size against fidelity. The MCP tool renders below 1 on
 * purpose: a full-size PNG per slide is a large payload, and layout problems
 * such as overflowing text are just as visible at three quarters.
 */
export async function renderSlides({ deckDir, config, slides, scale = 0.75 }) {
  const active = await getHarness({ deckDir, config });
  const page = await openPage(active, config, scale);

  try {
    const shots = [];
    for (const slide of slides) {
      await page.evaluate((n) => {
        window.location.hash = `#${n}`;
      }, slide.number);
      // The hash drives React state, so wait for the DOM to catch up rather
      // than assuming the change is synchronous.
      await page.waitForFunction(
        (n) => document.querySelectorAll('.sm-present-slide')[n - 1]?.classList.contains('sm-present-on'),
        slide.number,
        { timeout: 5_000 },
      );
      const element = await page.$('.sm-present-on');
      const buffer = await (element ?? page).screenshot({ type: 'png' });
      shots.push({
        number: slide.number,
        id: slide.id,
        file: slide.file,
        base64: buffer.toString('base64'),
      });
    }
    return shots;
  } finally {
    await page.close();
  }
}

/**
 * Renders the whole deck to a single PDF.
 *
 * Uses the print stylesheet rather than stitching screenshots together, so the
 * text in the output is real text: selectable, searchable and sharp at any
 * zoom.
 */
export async function renderPdf({ deckDir, config, outFile }) {
  const active = await getHarness({ deckDir, config });
  const page = await openPage(active, config, 1);

  try {
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: outFile,
      width: `${config.width / 96}in`,
      height: `${config.height / 96}in`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    return outFile;
  } finally {
    await page.close();
  }
}
