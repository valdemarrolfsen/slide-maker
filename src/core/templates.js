import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { builtinTemplatesDir } from './paths.js';

/** A template is a complete starter presentation with its own default style. */
export const TEMPLATE_MANIFEST = 'template.json';
export const TEMPLATE_SLIDES_DIR = 'slides';
export const TEMPLATE_STYLESHEET = 'template.css';

async function readTemplate(dir, name) {
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
    source: 'builtin',
    dir,
    slidesDir: path.join(dir, TEMPLATE_SLIDES_DIR),
    assetsDir: path.join(dir, 'assets'),
    stylesheet: fs.existsSync(path.join(dir, TEMPLATE_STYLESHEET))
      ? path.join(dir, TEMPLATE_STYLESHEET)
      : null,
  };
}

export async function listTemplates() {
  let entries;
  try {
    entries = await fsp.readdir(builtinTemplatesDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const template = await readTemplate(path.join(builtinTemplatesDir, entry.name), entry.name);
    if (template) found.push(template);
  }
  return found.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function resolveTemplate(name) {
  const templates = await listTemplates();
  return templates.find((template) => template.name === name) || null;
}
