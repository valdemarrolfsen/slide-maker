import { resolveDeckDir } from '../core/paths.js';
import { readConfig, writeConfig } from '../core/deck.js';
import { listTemplates, resolveTemplate } from '../core/templates.js';
import { color, fail, ok } from '../core/log.js';

export async function templatesCommand(options) {
  const deckDir = resolveDeckDir(options.deck);
  const templates = await listTemplates(deckDir);

  let active = null;
  try {
    active = (await readConfig(deckDir)).template;
  } catch {
    /* Listing templates outside a deck is fine, there is just nothing active. */
  }

  console.log('');
  for (const template of templates) {
    const marker = template.name === active ? color.green('●') : color.dim('○');
    const tags = template.tags.length ? color.dim(` [${template.tags.join(' ')}]`) : '';
    const local = template.source === 'local' ? color.dim(' (local)') : '';
    console.log(`  ${marker} ${color.bold(template.name)}${local}${tags}`);
    if (template.description) console.log(`      ${color.dim(template.description)}`);
  }
  console.log('');
  if (active) console.log(color.dim(`  Active: ${active}. Switch with \`slide-maker use <name>\`.`));
  console.log('');
}

export async function useTemplateCommand(name, options) {
  const deckDir = resolveDeckDir(options.deck);
  const template = await resolveTemplate(deckDir, name);
  if (!template) {
    const available = (await listTemplates(deckDir)).map((t) => t.name).join(', ');
    fail(`No template named "${name}".`, `Available: ${available}`);
  }

  const config = await readConfig(deckDir);
  await writeConfig(deckDir, { ...config, template: name });
  ok(`Template set to ${color.bold(name)}.`);
  if (template.guidance) console.log(`  ${color.dim(template.guidance)}`);
}
