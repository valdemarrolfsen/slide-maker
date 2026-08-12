import { createServer } from 'vite';
import { resolveDeckDir } from '../core/paths.js';
import { DeckError, readConfig, listSlides } from '../core/deck.js';
import { resolveStyle, listStyles } from '../core/styles.js';
import { listComments } from '../core/comments.js';
import { color, fail, warn } from '../core/log.js';
import { createViteConfig } from '../vite/config.js';

export async function startCommand(target, options) {
  const deckDir = resolveDeckDir(target);

  let config;
  try {
    config = await readConfig(deckDir);
  } catch (err) {
    if (err instanceof DeckError) {
      fail(err.message, 'Run `slide-maker init` here first.');
    }
    throw err;
  }

  const [slides, style, comments] = await Promise.all([
    listSlides(deckDir, config),
    resolveStyle(deckDir, config.style),
    listComments(deckDir, { status: 'open' }),
  ]);

  if (!style) {
    const available = (await listStyles(deckDir)).map((s) => s.name).join(', ');
    warn(`Style "${config.style}" not found. Slides will render unstyled.`);
    warn(`Available styles: ${available || 'none'}`);
  }

  const base = createViteConfig({ deckDir, config, mode: 'studio' });
  const server = await createServer({
    ...base,
    server: {
      ...base.server,
      port: options.port ? Number(options.port) : 5170,
      strictPort: false,
      host: options.host || false,
      open: options.open ?? false,
    },
  });

  await server.listen();

  const url = server.resolvedUrls?.local?.[0] ?? '';
  console.log('');
  console.log(`  ${color.bold(config.title)}`);
  console.log(
    `  ${color.dim('style')} ${style?.name ?? `${config.style} (missing)`}   ` +
      `${color.dim('slides')} ${slides.length}   ` +
      `${color.dim('open comments')} ${comments.length}`,
  );
  console.log('');
  console.log(`  ${color.green('▸')} ${color.cyan(url)}`);
  console.log('');
  console.log(color.dim('  Select text on a slide to comment. Press C for a note on the slide.'));
  console.log(color.dim('  Ctrl+C to stop.'));
  console.log('');

  if (!slides.length) {
    warn(`No slides found in ${config.slides}/. Ask Claude to make you one.`);
  }

  return server;
}
