import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinTemplatesDir } from './paths.js';

export const TEMPLATE_MANIFEST = 'template.json';
export const TEMPLATE_STYLESHEET = 'theme.css';

/** Deck-local templates live here and shadow built-ins of the same name. */
export const LOCAL_TEMPLATES_DIR = 'templates';

async function readManifest(dir, name, source) {
  const manifestPath = path.join(dir, TEMPLATE_MANIFEST);
  let meta = {};
  try {
    meta = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  } catch {
    /* A template is usable with nothing but a theme.css. */
  }
  return {
    name,
    label: meta.label || name,
    description: meta.description || '',
    tags: meta.tags || [],
    /** Whether the template's default palette is dark. Drives the viewer chrome. */
    dark: Boolean(meta.dark),
    /** Free-form notes for Claude on what the template is good at. */
    guidance: meta.guidance || '',
    source,
    dir,
    stylesheet: path.join(dir, TEMPLATE_STYLESHEET),
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
    if (!fs.existsSync(path.join(templateDir, TEMPLATE_STYLESHEET))) continue;
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
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolves one template by name, or null if it does not exist. */
export async function resolveTemplate(deckDir, name) {
  const templates = await listTemplates(deckDir);
  return templates.find((t) => t.name === name) || null;
}
