import { resolveDeckDir } from '../core/paths.js';
import { listTemplates } from '../core/templates.js';
import { color } from '../core/log.js';

export async function templatesCommand(options) {
  const deckDir = resolveDeckDir(options.deck);
  const templates = await listTemplates(deckDir);

  console.log('');
  for (const template of templates) {
    const tags = template.tags.length ? color.dim(` [${template.tags.join(' ')}]`) : '';
    const local = template.source === 'local' ? color.dim(' (local)') : '';
    console.log(`  ${color.bold(template.name)}${local}${tags}`);
    if (template.description) console.log(`    ${color.dim(template.description)}`);
  }
  console.log('');
  console.log(color.dim('  See them rendered in every style with `slide-maker browse`.'));
  console.log(color.dim('  Claude reaches for these itself, through `list_templates`.'));
  console.log('');
}
