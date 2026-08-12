import { createServer } from 'vite';
import { resolveDeckDir } from '../core/paths.js';
import { isDeck } from '../core/deck.js';
import { listStyles } from '../core/styles.js';
import { listTemplates } from '../core/templates.js';
import { color, fail } from '../core/log.js';
import { createBrowseViteConfig } from '../vite/config.js';

/**
 * Opens the template library in a browser.
 *
 * Runs from anywhere. Inside a deck it also picks up that deck's local
 * templates and styles, and offers to drop a template straight into it.
 */
export async function browseCommand(target, options) {
  const candidate = resolveDeckDir(target);
  const deckDir = isDeck(candidate) ? candidate : null;

  const [templates, styles] = await Promise.all([listTemplates(deckDir), listStyles(deckDir)]);
  if (!templates.length) fail('No templates are installed.', 'The package looks incomplete.');
  if (!styles.length) fail('No styles are installed.', 'The package looks incomplete.');

  const base = createBrowseViteConfig({ deckDir });
  const server = await createServer({
    ...base,
    server: {
      ...base.server,
      port: options.port ? Number(options.port) : 5171,
      strictPort: false,
      host: options.host || false,
      open: options.open === false ? false : '/browse.html',
    },
  });

  await server.listen();

  const url = `${(server.resolvedUrls?.local?.[0] ?? '').replace(/\/$/, '')}/browse.html`;
  console.log('');
  console.log(`  ${color.bold('Template library')}`);
  console.log(
    `  ${color.dim('templates')} ${templates.length}   ` +
      `${color.dim('styles')} ${styles.length}   ` +
      `${color.dim('deck')} ${deckDir ?? 'none'}`,
  );
  console.log('');
  console.log(`  ${color.green('▸')} ${color.cyan(url)}`);
  console.log('');
  console.log(color.dim('  Every template, rendered in every style. Ctrl+C to stop.'));
  console.log('');

  return server;
}
