import { listTemplates } from '../core/templates.js';
import { color } from '../core/log.js';

export async function templatesCommand() {
  const templates = await listTemplates();
  console.log('');
  for (const template of templates) {
    const tags = template.tags.length ? color.dim(` [${template.tags.join(' ')}]`) : '';
    console.log(`  ${color.bold(template.name)}${tags}`);
    if (template.description) console.log(`    ${color.dim(template.description)}`);
    const slideCount = template.defaultSlides.includes('*')
      ? 'all default slides'
      : `${template.defaultSlides.length} default slides`;
    console.log(`    ${color.dim(`style: ${template.defaultStyle} · ${slideCount}`)}`);
  }
  console.log('');
  console.log(color.dim('  Preview one with `slide-maker browse <template>`.'));
  console.log(color.dim('  Start from one with `slide-maker init --template <template>`.'));
  console.log('');
}
