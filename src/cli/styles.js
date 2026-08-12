import { resolveDeckDir } from '../core/paths.js';
import { readConfig, writeConfig } from '../core/deck.js';
import { listStyles, resolveStyle } from '../core/styles.js';
import { color, fail, ok } from '../core/log.js';

export async function stylesCommand(options) {
  const deckDir = resolveDeckDir(options.deck);
  const styles = await listStyles(deckDir);

  let active = null;
  try {
    active = (await readConfig(deckDir)).style;
  } catch {
    /* Listing styles outside a deck is fine, there is just nothing active. */
  }

  console.log('');
  for (const style of styles) {
    const marker = style.name === active ? color.green('●') : color.dim('○');
    const tags = style.tags.length ? color.dim(` [${style.tags.join(' ')}]`) : '';
    const local = style.source === 'local' ? color.dim(' (local)') : '';
    console.log(`  ${marker} ${color.bold(style.name)}${local}${tags}`);
    if (style.description) console.log(`      ${color.dim(style.description)}`);
  }
  console.log('');
  if (active) console.log(color.dim(`  Active: ${active}. Switch with \`slide-maker use <name>\`.`));
  console.log('');
}

export async function useStyleCommand(name, options) {
  const deckDir = resolveDeckDir(options.deck);
  const style = await resolveStyle(deckDir, name);
  if (!style) {
    const available = (await listStyles(deckDir)).map((s) => s.name).join(', ');
    fail(`No style named "${name}".`, `Available: ${available}`);
  }

  const config = await readConfig(deckDir);
  await writeConfig(deckDir, { ...config, style: name });
  ok(`Style set to ${color.bold(name)}.`);
  if (style.guidance) console.log(`  ${color.dim(style.guidance)}`);
}
