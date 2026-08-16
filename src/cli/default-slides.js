import { resolveDeckDir } from '../core/paths.js';
import { listDefaultSlides } from '../core/default-slides.js';
import { color } from '../core/log.js';

export async function defaultSlidesCommand(options) {
  const slides = await listDefaultSlides(resolveDeckDir(options.deck));
  console.log('');
  for (const slide of slides) {
    const tags = slide.tags.length ? color.dim(` [${slide.tags.join(' ')}]`) : '';
    const local = slide.source === 'local' ? color.dim(' (local)') : '';
    console.log(`  ${color.bold(slide.name)}${local}${tags}`);
    if (slide.description) console.log(`    ${color.dim(slide.description)}`);
  }
  console.log('');
  console.log(color.dim('  These are the layouts shown by Add slide in the studio.'));
  console.log('');
}
