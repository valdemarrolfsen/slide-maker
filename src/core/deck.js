import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export const CONFIG_FILE = 'deck.json';

/**
 * Deck defaults. A deck.json only needs to state what differs from these.
 *
 * The config is JSON rather than JavaScript on purpose: slide-maker writes it
 * back when Claude switches style through MCP, and a round trip through a
 * JS module would lose comments and formatting.
 */
export const defaults = {
  title: 'Untitled deck',
  author: '',
  /** Full-deck template this presentation started from. */
  template: 'blank',
  /** Name of the design system the deck wears. See src/core/styles.js. */
  style: 'granite',
  /** Template-owned composition rules, relative to the deck root. Styles can
   *  change without replacing this layout contract. */
  layout: 'template.css',
  /** Slide canvas in CSS pixels. 1280x720 is 16:9 and maps cleanly to a
   *  13.333in x 7.5in PDF page. */
  width: 1280,
  height: 720,
  /** Directory of slide modules, relative to the deck root. */
  slides: 'slides',
  /** Static assets directory, served at /assets. */
  assets: 'assets',
  /** Slide ids omitted from presentation and export, but still shown in Studio. */
  hiddenSlides: [],
};

export class DeckError extends Error {}

/** True if the directory looks like a slide-maker deck. */
export function isDeck(deckDir) {
  return fs.existsSync(path.join(deckDir, CONFIG_FILE));
}

/** Reads and normalises a deck's configuration. */
export async function readConfig(deckDir) {
  const file = path.join(deckDir, CONFIG_FILE);
  let raw;
  try {
    raw = await fsp.readFile(file, 'utf8');
  } catch {
    throw new DeckError(`No ${CONFIG_FILE} found in ${deckDir}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new DeckError(`${CONFIG_FILE} is not valid JSON: ${err.message}`);
  }
  return { ...defaults, ...migrate(parsed) };
}

/**
 * Brings an older deck.json forward.
 *
 * Before v0.2, `template` meant what `style` means now. New configs always have
 * both keys, so a lone template matching the old shape can still be migrated.
 */
function migrate(parsed) {
  if (parsed.style === undefined && typeof parsed.template === 'string') {
    const { template, ...rest } = parsed;
    return { ...rest, style: template };
  }
  return parsed;
}

/** Writes a deck configuration back to disk, preserving key order. */
export async function writeConfig(deckDir, config) {
  const file = path.join(deckDir, CONFIG_FILE);
  await fsp.writeFile(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

const SLIDE_EXTENSIONS = new Set(['.tsx', '.jsx']);

/**
 * Sorts slide filenames the way a person reads them, so `2-x` comes before
 * `10-x` rather than after it. Files without a numeric prefix sort last,
 * alphabetically, which keeps drafts out of the running order.
 */
function compareSlideNames(a, b) {
  const na = /^(\d+)/.exec(a);
  const nb = /^(\d+)/.exec(b);
  if (na && nb) {
    const diff = Number(na[1]) - Number(nb[1]);
    return diff !== 0 ? diff : a.localeCompare(b);
  }
  if (na) return -1;
  if (nb) return 1;
  return a.localeCompare(b);
}

/**
 * Lists a deck's slides in presentation order.
 *
 * Order comes from the filename's numeric prefix, which means reordering a
 * deck is a rename rather than an edit to a manifest. Underscore-prefixed
 * files are skipped, which is how you park a slide without deleting it.
 */
export async function listSlides(deckDir, config, options = {}) {
  const dir = path.join(deckDir, config.slides);
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const names = entries
    .filter((e) => e.isFile() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .filter((n) => SLIDE_EXTENSIONS.has(path.extname(n)))
    .sort(compareSlideNames);

  const hidden = new Set(Array.isArray(config.hiddenSlides) ? config.hiddenSlides : []);
  const slides = names.map((name) => {
    const id = name.replace(/\.[jt]sx$/, '');
    return {
      id,
      name,
      hidden: hidden.has(id),
      /** Deck-relative path, which is what Claude needs to open the file. */
      file: path.posix.join(config.slides, name),
      absolute: path.join(dir, name),
    };
  });

  return slides
    .filter((slide) => options.includeHidden || !slide.hidden)
    .map((slide, index) => ({ ...slide, index, number: index + 1 }));
}

/** Finds a slide by id, filename, deck-relative file, or its Studio number. */
export async function findSlide(deckDir, config, reference) {
  const slides = await listSlides(deckDir, config, { includeHidden: true });
  const wanted = String(reference);
  return (
    slides.find(
      (slide) =>
        slide.id === wanted ||
        slide.name === wanted ||
        slide.file === wanted ||
        String(slide.number) === wanted,
    ) || null
  );
}

/** Changes whether a slide participates in presentation and export. */
export async function setSlideHidden(deckDir, reference, hidden) {
  const config = await readConfig(deckDir);
  const slide = await findSlide(deckDir, config, reference);
  if (!slide) return null;

  const hiddenSlides = new Set(Array.isArray(config.hiddenSlides) ? config.hiddenSlides : []);
  if (hidden) hiddenSlides.add(slide.id);
  else hiddenSlides.delete(slide.id);

  await writeConfig(deckDir, { ...config, hiddenSlides: [...hiddenSlides] });
  return { ...slide, hidden: Boolean(hidden) };
}

/** Reads a single slide's source. */
export async function readSlide(deckDir, config, id) {
  const slides = await listSlides(deckDir, config, { includeHidden: true });
  const slide = slides.find((s) => s.id === id || String(s.number) === String(id));
  if (!slide) return null;
  const source = await fsp.readFile(slide.absolute, 'utf8');
  return { ...slide, source };
}
