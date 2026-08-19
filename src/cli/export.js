import path from 'node:path';
import fsp from 'node:fs/promises';
import { resolveDeckDir } from '../core/paths.js';
import { DeckError, listSlides, readConfig } from '../core/deck.js';
import { closeRenderer, renderPdf, renderSlides } from '../render/renderer.js';
import { color, fail, ok, step } from '../core/log.js';

/** Slugifies a deck title for use as a filename. */
function slug(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'deck'
  );
}

export async function exportCommand(target, options) {
  const deckDir = resolveDeckDir(target);

  let config;
  try {
    config = await readConfig(deckDir);
  } catch (err) {
    if (err instanceof DeckError) fail(err.message, 'Run `slide-maker init` here first.');
    throw err;
  }

  const slides = await listSlides(deckDir, config);
  if (!slides.length) fail(`No visible slides found in ${config.slides}/.`);

  const format = (options.format || 'pdf').toLowerCase();

  try {
    if (format === 'pdf') {
      const outFile = path.resolve(deckDir, options.out || `${slug(config.title)}.pdf`);
      step(`Rendering ${slides.length} slides to PDF`);
      await fsp.mkdir(path.dirname(outFile), { recursive: true });
      await renderPdf({ deckDir, config, outFile });
      ok(`Wrote ${color.cyan(path.relative(process.cwd(), outFile))}`);
      return outFile;
    }

    if (format === 'png') {
      const outDir = path.resolve(deckDir, options.out || 'out');
      step(`Rendering ${slides.length} slides to PNG`);
      await fsp.mkdir(outDir, { recursive: true });
      const shots = await renderSlides({ deckDir, config, slides, scale: 2 });
      for (const shot of shots) {
        const file = path.join(outDir, `${String(shot.number).padStart(2, '0')}-${shot.id}.png`);
        await fsp.writeFile(file, Buffer.from(shot.base64, 'base64'));
      }
      ok(`Wrote ${shots.length} images to ${color.cyan(path.relative(process.cwd(), outDir))}`);
      return outDir;
    }

    fail(`Unknown export format "${format}".`, 'Supported formats: pdf, png');
    return null;
  } catch (err) {
    fail(err.message);
    return null;
  } finally {
    await closeRenderer();
  }
}
