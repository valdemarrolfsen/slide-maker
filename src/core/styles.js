import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinStylesDir, userStylesDir } from './paths.js';

export const STYLE_MANIFEST = 'style.json';
export const STYLE_STYLESHEET = 'style.css';

/** Deck-local styles live here and shadow built-ins of the same name. */
export const LOCAL_STYLES_DIR = 'styles';

async function readManifest(dir, name, source) {
  const manifestPath = path.join(dir, STYLE_MANIFEST);
  let meta = {};
  try {
    meta = JSON.parse(await fsp.readFile(manifestPath, 'utf8'));
  } catch {
    /* A style is usable with nothing but a style.css. */
  }
  return {
    name,
    label: meta.label || name,
    description: meta.description || '',
    tags: meta.tags || [],
    /** Whether the style's default palette is dark. Drives the viewer chrome. */
    dark: Boolean(meta.dark),
    /** Free-form notes for Claude on what the style is good at. */
    guidance: meta.guidance || '',
    source,
    dir,
    stylesheet: path.join(dir, STYLE_STYLESHEET),
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
    const styleDir = path.join(dir, entry.name);
    if (!fs.existsSync(path.join(styleDir, STYLE_STYLESHEET))) continue;
    found.push(await readManifest(styleDir, entry.name, source));
  }
  return found;
}

/**
 * Every style available to a deck.
 *
 * Three tiers, each shadowing the one before: built-ins, the styles in the
 * user's slide-maker home, then the deck's own. That is what lets a project
 * fork a built-in by copying it into ./styles and keeping the name.
 */
export async function listStyles(deckDir) {
  const builtin = await scanDir(builtinStylesDir, 'builtin');
  const user = await scanDir(userStylesDir(), 'user');
  const localDir = deckDir ? path.join(deckDir, LOCAL_STYLES_DIR) : null;
  // Working inside the slide-maker repo itself, the two directories are the
  // same one. Scanning it twice would label every built-in as local.
  const local =
    localDir && path.resolve(localDir) !== path.resolve(builtinStylesDir)
      ? await scanDir(localDir, 'local')
      : [];
  const byName = new Map();
  for (const s of [...builtin, ...user, ...local]) byName.set(s.name, s);
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Resolves one style by name, or null if it does not exist. */
export async function resolveStyle(deckDir, name) {
  const styles = await listStyles(deckDir);
  return styles.find((s) => s.name === name) || null;
}
