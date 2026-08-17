import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinTemplatesDir, userTemplatesDir } from './paths.js';

/** A template is a complete starter presentation with its own default style. */
export const TEMPLATE_MANIFEST = 'template.json';
export const TEMPLATE_SLIDES_DIR = 'slides';
export const TEMPLATE_STYLESHEET = 'template.css';

async function readTemplate(dir, name, source) {
  let meta;
  try {
    meta = JSON.parse(await fsp.readFile(path.join(dir, TEMPLATE_MANIFEST), 'utf8'));
  } catch {
    return null;
  }
  if (!fs.existsSync(path.join(dir, TEMPLATE_SLIDES_DIR))) return null;
  return {
    name,
    label: meta.label || name,
    description: meta.description || '',
    tags: meta.tags || [],
    guidance: meta.guidance || '',
    order: typeof meta.order === 'number' ? meta.order : 500,
    defaultStyle: meta.defaultStyle || 'granite',
    defaultSlides: Array.isArray(meta.default_slides)
      ? meta.default_slides
      : Array.isArray(meta.defaultSlides)
        ? meta.defaultSlides
        : [],
    /** Where a crafted template took its design from, for the record. */
    craftedFrom: meta.craftedFrom || '',
    source,
    dir,
    slidesDir: path.join(dir, TEMPLATE_SLIDES_DIR),
    assetsDir: path.join(dir, 'assets'),
    stylesheet: fs.existsSync(path.join(dir, TEMPLATE_STYLESHEET))
      ? path.join(dir, TEMPLATE_STYLESHEET)
      : null,
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
    const template = await readTemplate(path.join(dir, entry.name), entry.name, source);
    if (template) found.push(template);
  }
  return found;
}

/**
 * Every template available on this machine.
 *
 * User templates live in the slide-maker home and come last, so a template
 * crafted from a brand can shadow a built-in by keeping its name.
 */
export async function listTemplates() {
  const builtin = await scanDir(builtinTemplatesDir, 'builtin');
  const user = await scanDir(userTemplatesDir(), 'user');
  const byName = new Map();
  for (const template of [...builtin, ...user]) byName.set(template.name, template);
  return [...byName.values()].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function resolveTemplate(name) {
  const templates = await listTemplates();
  return templates.find((template) => template.name === name) || null;
}
