import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinTemplatesDir } from './paths.js';

/**
 * The template library.
 *
 * A template is one slide: a `slide.tsx` written against the runtime, plus a
 * manifest describing when to reach for it. Templates carry no colour and no
 * type scale, so the same template renders in every style. Claude reaches for
 * them over MCP; the studio's Add slide picker is the same library by hand.
 */

export const TEMPLATE_MANIFEST = 'template.json';
export const TEMPLATE_SLIDE = 'slide.tsx';

/** Deck-local templates live here and shadow built-ins of the same name. */
export const LOCAL_TEMPLATES_DIR = 'templates';

async function readManifest(dir, name, source) {
  let meta = {};
  try {
    meta = JSON.parse(await fsp.readFile(path.join(dir, TEMPLATE_MANIFEST), 'utf8'));
  } catch {
    /* A template is usable with nothing but a slide.tsx. */
  }
  return {
    name,
    label: meta.label || name,
    description: meta.description || '',
    tags: meta.tags || [],
    /** Free-form notes for Claude on when this layout is the right one. */
    guidance: meta.guidance || '',
    /** Sort key for the library, so related layouts sit together. */
    order: typeof meta.order === 'number' ? meta.order : 500,
    /** Filename stem to use when the template lands in a deck. */
    stem: meta.file || name,
    source,
    dir,
    slide: path.join(dir, TEMPLATE_SLIDE),
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
    const templateDir = path.join(dir, entry.name);
    if (!fs.existsSync(path.join(templateDir, TEMPLATE_SLIDE))) continue;
    found.push(await readManifest(templateDir, entry.name, source));
  }
  return found;
}

/**
 * Every template available to a deck.
 *
 * Deck-local templates come last and win, so a project can fork a built-in by
 * copying it into ./templates and keeping the name.
 */
export async function listTemplates(deckDir) {
  const builtin = await scanDir(builtinTemplatesDir, 'builtin');
  const localDir = deckDir ? path.join(deckDir, LOCAL_TEMPLATES_DIR) : null;
  // Working inside the slide-maker repo itself, the two directories are the
  // same one. Scanning it twice would label every built-in as local.
  const local =
    localDir && path.resolve(localDir) !== path.resolve(builtinTemplatesDir)
      ? await scanDir(localDir, 'local')
      : [];
  const byName = new Map();
  for (const t of [...builtin, ...local]) byName.set(t.name, t);
  return [...byName.values()].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name),
  );
}

/** Resolves one template by name, or null if it does not exist. */
export async function resolveTemplate(deckDir, name) {
  const templates = await listTemplates(deckDir);
  return templates.find((t) => t.name === name) || null;
}

/** The JSX a template contributes to a deck. */
export async function readTemplateSource(template) {
  return fsp.readFile(template.slide, 'utf8');
}
