import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinDefaultSlidesDir } from './paths.js';

/**
 * The reusable slide-layout library.
 *
 * A default slide is one `slide.tsx` written against the runtime, plus a
 * manifest describing when to reach for it. It carries no colour or type
 * scale, so it renders in every style. A template chooses which default
 * slides are useful for its kind of presentation.
 */

export const DEFAULT_SLIDE_MANIFEST = 'default_slide.json';
export const DEFAULT_SLIDE_SOURCE = 'slide.tsx';
export const LOCAL_DEFAULT_SLIDES_DIR = 'default_slides';
const LEGACY_LOCAL_DEFAULT_SLIDES_DIR = 'templates';

async function readManifest(dir, name, source) {
  let meta = {};
  try {
    meta = JSON.parse(await fsp.readFile(path.join(dir, DEFAULT_SLIDE_MANIFEST), 'utf8'));
  } catch {
    try {
      // Before template decks existed, reusable slides used template.json.
      meta = JSON.parse(await fsp.readFile(path.join(dir, 'template.json'), 'utf8'));
    } catch {
      /* A default slide is usable with nothing but a slide.tsx. */
    }
  }
  return {
    name,
    label: meta.label || name,
    description: meta.description || '',
    tags: meta.tags || [],
    guidance: meta.guidance || '',
    order: typeof meta.order === 'number' ? meta.order : 500,
    stem: meta.file || name,
    source,
    dir,
    slide: path.join(dir, DEFAULT_SLIDE_SOURCE),
  };
}

async function scanDir(dir, source) {
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const slideDir = path.join(dir, entry.name);
    if (!fs.existsSync(path.join(slideDir, DEFAULT_SLIDE_SOURCE))) continue;
    found.push(await readManifest(slideDir, entry.name, source));
  }
  return found;
}

export async function listDefaultSlides(deckDir, names) {
  const builtin = await scanDir(builtinDefaultSlidesDir, 'builtin');
  const localDir = deckDir ? path.join(deckDir, LOCAL_DEFAULT_SLIDES_DIR) : null;
  const legacyDir = deckDir ? path.join(deckDir, LEGACY_LOCAL_DEFAULT_SLIDES_DIR) : null;
  const legacy = legacyDir ? await scanDir(legacyDir, 'local') : [];
  const local =
    localDir && path.resolve(localDir) !== path.resolve(builtinDefaultSlidesDir)
      ? await scanDir(localDir, 'local')
      : [];
  const byName = new Map();
  // The new directory wins if a deck happens to keep both during migration.
  for (const slide of [...builtin, ...legacy, ...local]) byName.set(slide.name, slide);
  const allowed = Array.isArray(names) && names.length && !names.includes('*') ? new Set(names) : null;
  return [...byName.values()]
    .filter((slide) => !allowed || allowed.has(slide.name))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function resolveDefaultSlide(deckDir, name) {
  const slides = await listDefaultSlides(deckDir);
  return slides.find((slide) => slide.name === name) || null;
}

export async function readDefaultSlideSource(defaultSlide) {
  return fsp.readFile(defaultSlide.slide, 'utf8');
}
