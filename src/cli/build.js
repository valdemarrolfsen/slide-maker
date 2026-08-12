import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { resolveDeckDir } from '../core/paths.js';
import { DeckError, listSlides, readConfig } from '../core/deck.js';
import { color, fail, ok, step } from '../core/log.js';
import { createViteConfig } from '../vite/config.js';

/** Renders the deck to a self-contained folder of static files. */
export async function buildCommand(target, options) {
  const deckDir = resolveDeckDir(target);

  let config;
  try {
    config = await readConfig(deckDir);
  } catch (err) {
    if (err instanceof DeckError) fail(err.message, 'Run `slide-maker init` here first.');
    throw err;
  }

  const slides = await listSlides(deckDir, config);
  if (!slides.length) fail(`No slides found in ${config.slides}/.`);

  const outDir = path.resolve(deckDir, options.out || 'dist');
  step(`Building ${slides.length} slides to ${color.cyan(path.relative(process.cwd(), outDir))}`);

  await build(createViteConfig({ deckDir, config, mode: 'present', outDir }));

  // The Vite entry is present.html because the studio owns index.html. The
  // exported deck should still open by double-clicking, so rename it back.
  const built = path.join(outDir, 'present.html');
  if (fs.existsSync(built)) {
    await fsp.rename(built, path.join(outDir, 'index.html'));
  }

  ok(`Deck built. Open ${color.cyan(path.join(path.relative(process.cwd(), outDir), 'index.html'))}`);
  return outDir;
}
