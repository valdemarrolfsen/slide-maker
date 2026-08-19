import { resolveDeckDir } from '../core/paths.js';
import { DeckError, listSlides, readConfig, setSlideHidden } from '../core/deck.js';
import { color, fail, ok } from '../core/log.js';

async function changeVisibility(reference, options, hidden) {
  const deckDir = resolveDeckDir(options.deck);
  let config;
  try {
    config = await readConfig(deckDir);
  } catch (err) {
    if (err instanceof DeckError) fail(err.message, 'Run `slide-maker init` here first.');
    throw err;
  }

  const slide = await setSlideHidden(deckDir, reference, hidden);
  if (!slide) {
    const slides = await listSlides(deckDir, config, { includeHidden: true });
    const available = slides.map((item) => `${item.number} (${item.id})`).join(', ');
    fail(`No slide matches "${reference}".`, available ? `Available: ${available}` : undefined);
  }

  ok(`${color.bold(slide.file)} is now ${hidden ? 'hidden' : 'shown'}.`);
  return slide;
}

export function hideSlideCommand(reference, options) {
  return changeVisibility(reference, options, true);
}

export function showSlideCommand(reference, options) {
  return changeVisibility(reference, options, false);
}
