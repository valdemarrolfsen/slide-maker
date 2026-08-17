import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { userStylesDir, userTemplatesDir } from './paths.js';
import { listTemplates, resolveTemplate, TEMPLATE_MANIFEST } from './templates.js';
import { listStyles, resolveStyle, STYLE_MANIFEST, STYLE_STYLESHEET } from './styles.js';
import { listSlides, readConfig } from './deck.js';

/**
 * Custom templates.
 *
 * A template crafted from a real product, brand site or dist directory belongs
 * to the machine rather than to the deck that prompted it: the whole point is
 * that the next deck can wear it too. So it is scaffolded into the slide-maker
 * home, where `listTemplates` and `listStyles` already look.
 *
 * Scaffolding, not generating. This module writes an empty but complete
 * skeleton and hands back the contract for filling it in; the design work is
 * reading the source project and writing CSS, which Claude does with its own
 * file tools. Anything else would be a second, worse way to edit a file.
 */

export class CustomTemplateError extends Error {}

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Templates are directory names and CSS-visible identifiers, so keep them plain. */
export function assertName(name, what = 'template') {
  if (!NAME_PATTERN.test(String(name || ''))) {
    throw new CustomTemplateError(
      `"${name}" is not a usable ${what} name. Use lowercase letters, digits and dashes, such as "acme-brand".`,
    );
  }
  return name;
}

async function copyTree(source, target) {
  if (!fs.existsSync(source)) return;
  await fsp.cp(source, target, { recursive: true });
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function toLabel(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => word.replace(/^\w/, (c) => c.toUpperCase()))
    .join(' ');
}

async function ensureFree(dir, what, force) {
  if (!fs.existsSync(dir)) return;
  if (!force) {
    throw new CustomTemplateError(
      `${dir} already exists. Pass --force to overwrite the ${what}, or pick another name.`,
    );
  }
  await fsp.rm(dir, { recursive: true, force: true });
}

/**
 * Creates the skeleton of a custom template, and usually a style to go with it.
 *
 * A brand is colour and typography, which is a style, plus how a page is put
 * together, which is a template. Crafting one from a product almost always
 * means both, so a paired style is forked from a built-in unless the caller
 * names an existing style to reuse.
 */
export async function createCustomTemplate({
  name,
  label,
  description = '',
  guidance = '',
  basedOn = 'blank',
  style,
  baseStyle,
  craftedFrom = '',
  force = false,
} = {}) {
  assertName(name);

  const base = await resolveTemplate(basedOn);
  if (!base) {
    const available = (await listTemplates()).map((t) => t.name).join(', ');
    throw new CustomTemplateError(`No template named "${basedOn}". Available: ${available}`);
  }

  // Naming an existing style means "this brand already has one"; otherwise the
  // template gets a style of its own, forked so every token is present to edit.
  const styleName = style || name;
  if (!style) assertName(styleName, 'style');
  if (style && !(await resolveStyle(null, style))) {
    const available = (await listStyles(null)).map((s) => s.name).join(', ');
    throw new CustomTemplateError(`No style named "${style}". Available: ${available}`);
  }

  // Both targets are cleared before anything is written, so a name collision on
  // the second one cannot leave the first half of a template behind.
  const templateDir = path.join(userTemplatesDir(), name);
  const styleDir = style ? null : path.join(userStylesDir(), styleName);
  await ensureFree(templateDir, 'template', force);
  if (styleDir) await ensureFree(styleDir, 'style', force);

  let createdStyle = null;
  if (styleDir) {
    const source = await resolveStyle(null, baseStyle || base.defaultStyle);
    if (!source) {
      const available = (await listStyles(null)).map((s) => s.name).join(', ');
      throw new CustomTemplateError(
        `No style named "${baseStyle || base.defaultStyle}". Available: ${available}`,
      );
    }
    await fsp.mkdir(styleDir, { recursive: true });
    const header =
      `/* ${label || toLabel(name)}.\n` +
      (craftedFrom ? `   Design taken from ${craftedFrom}.\n` : '') +
      `   Forked from the ${source.name} style: replace the token values below with the\n` +
      `   real palette and typefaces. Keep every token defined, keep the .sm-dark block\n` +
      `   in step, and keep template-specific selectors out of this file. */\n\n`;
    await fsp.writeFile(
      path.join(styleDir, STYLE_STYLESHEET),
      header + (await fsp.readFile(source.stylesheet, 'utf8')),
      'utf8',
    );
    await writeJson(path.join(styleDir, STYLE_MANIFEST), {
      label: label || toLabel(name),
      description: description || `${toLabel(name)} design system.`,
      tags: ['custom'],
      dark: Boolean(source.dark),
      guidance: guidance || '',
    });
    createdStyle = { name: styleName, dir: styleDir };
  }

  await fsp.mkdir(templateDir, { recursive: true });
  await copyTree(base.slidesDir, path.join(templateDir, 'slides'));
  await copyTree(base.assetsDir, path.join(templateDir, 'assets'));
  await fsp.mkdir(path.join(templateDir, 'assets'), { recursive: true });

  const layoutHeader =
    `/* ${label || toLabel(name)} composition rules.\n` +
    (craftedFrom ? `   Structure taken from ${craftedFrom}.\n` : '') +
    `   Geometry only: spacing, grids, rules, the shape of bespoke blocks. Colour and\n` +
    `   type come from the ${styleName} style through its --sm-* tokens. */\n\n`;
  await fsp.writeFile(
    path.join(templateDir, 'template.css'),
    layoutHeader + (base.stylesheet ? await fsp.readFile(base.stylesheet, 'utf8') : ''),
    'utf8',
  );

  await writeJson(path.join(templateDir, TEMPLATE_MANIFEST), {
    label: label || toLabel(name),
    description: description || `${toLabel(name)} presentation.`,
    tags: ['custom'],
    order: 100,
    defaultStyle: styleName,
    default_slides: base.defaultSlides.length ? base.defaultSlides : ['*'],
    guidance: guidance || '',
    craftedFrom,
  });

  const template = await resolveTemplate(name);
  return {
    template,
    style: createdStyle,
    styleName,
    styleDir: createdStyle?.dir || (await resolveStyle(null, styleName))?.dir || '',
    basedOn: base.name,
  };
}

/**
 * Stores an existing deck in the slide-maker home as a reusable template.
 *
 * The deck you already made is the most honest description of the look you
 * want next time, so this is the other way a custom template gets created: not
 * crafted from a source project but promoted from a deck that works.
 */
export async function saveDeckAsTemplate({
  name,
  deckDir,
  label,
  description = '',
  guidance = '',
  force = false,
} = {}) {
  assertName(name);
  const config = await readConfig(deckDir);
  // A template is recognised by its slides directory, so an empty deck would be
  // stored and then never appear in the list.
  if (!(await listSlides(deckDir, config)).length) {
    throw new CustomTemplateError(
      `${deckDir} has no slides yet. A template is the starter deck, so there has to be something to start from.`,
    );
  }

  const templateDir = path.join(userTemplatesDir(), name);
  await ensureFree(templateDir, 'template', force);
  await fsp.mkdir(templateDir, { recursive: true });
  await copyTree(path.join(deckDir, config.slides), path.join(templateDir, 'slides'));
  await copyTree(path.join(deckDir, config.assets), path.join(templateDir, 'assets'));
  await fsp.mkdir(path.join(templateDir, 'assets'), { recursive: true });
  const layout = path.resolve(deckDir, config.layout);
  if (fs.existsSync(layout)) {
    await fsp.copyFile(layout, path.join(templateDir, 'template.css'));
  }

  // A deck-local style would be left behind by the copy, and the saved template
  // would silently fall back to a built-in of the same name.
  const style = await resolveStyle(deckDir, config.style);
  let copiedStyle = null;
  if (style?.source === 'local') {
    const styleDir = path.join(userStylesDir(), style.name);
    await ensureFree(styleDir, 'style', force);
    await copyTree(style.dir, styleDir);
    copiedStyle = { name: style.name, dir: styleDir };
  }

  await writeJson(path.join(templateDir, TEMPLATE_MANIFEST), {
    label: label || config.title || toLabel(name),
    description: description || `Saved from ${path.basename(deckDir)}.`,
    tags: ['custom'],
    order: 100,
    defaultStyle: config.style,
    default_slides: ['*'],
    guidance,
    craftedFrom: deckDir,
  });

  return { template: await resolveTemplate(name), style: copiedStyle, styleName: config.style };
}

/** Deletes a template from the slide-maker home, and optionally its style. */
export async function removeCustomTemplate(name, { withStyle = false } = {}) {
  const template = await resolveTemplate(name);
  if (!template || template.source !== 'user') {
    throw new CustomTemplateError(
      template
        ? `"${name}" is a built-in template, so there is nothing stored to remove.`
        : `No template named "${name}" in the slide-maker home.`,
    );
  }
  const removed = [template.dir];
  if (withStyle) {
    const styleDir = path.join(userStylesDir(), template.defaultStyle);
    if (fs.existsSync(styleDir)) {
      await fsp.rm(styleDir, { recursive: true, force: true });
      removed.push(styleDir);
    }
  }
  await fsp.rm(template.dir, { recursive: true, force: true });
  return removed;
}

/**
 * The contract for filling in a scaffolded template.
 *
 * Returned to whoever is doing the crafting, rather than written to disk: it is
 * instructions for one session of work, and a file of instructions next to the
 * template would go stale the moment the template was finished.
 */
export function craftingBrief({ template, styleName, styleDir, craftedFrom }) {
  const dir = styleDir || path.join(userStylesDir(), styleName);
  const source = craftedFrom || 'the source project';
  return [
    `# Crafting the "${template.name}" template`,
    '',
    `Everything below is already scaffolded. Fill it in from ${source}.`,
    '',
    '## What lives where',
    '',
    `- \`${path.join(dir, 'style.css')}\` — the design system: colour, typography,`,
    '  and the treatment of shared runtime components. This is where the brand goes.',
    `- \`${path.join(dir, 'style.json')}\` — its label, description, whether it is dark,`,
    '  and guidance telling a future session what the style is good at.',
    `- \`${path.join(template.dir, 'template.css')}\` — composition rules for this template only:`,
    '  geometry, grids, the shape of bespoke blocks. No colour, no font family.',
    `- \`${template.slidesDir}\` — the starter slides a new deck receives.`,
    `- \`${path.join(template.dir, 'template.json')}\` — label, description, guidance, and the`,
    '  `default_slides` list: which reusable layouts this template offers in the studio.',
    `- \`${path.join(template.dir, 'assets')}\` — logos and imagery copied into every new deck.`,
    '',
    '## Reading the source',
    '',
    'Look for the design decisions, not the markup. In a built site that usually means',
    'the compiled CSS in `dist/` or `build/`, a Tailwind or design-token config, the',
    'font files or webfont links, and the logo and imagery in the public directory.',
    'What you want out of it: background and surface colours, foreground and muted text,',
    'border colours, one accent, the heading and body typefaces, heading weight and',
    'letter spacing, and corner radius. Take the palette from what the product actually',
    'ships, including its dark variant if it has one.',
    '',
    '## Filling in the style',
    '',
    'The scaffolded `style.css` is a fork of a built-in, so every token is already there',
    'to overwrite. Replace the values in `.sm-slide`, then keep `.sm-slide.sm-dark` in',
    'step so `dark` on a slide still flips cleanly:',
    '',
    '```',
    '--sm-bg  --sm-bg-0  --sm-panel        surfaces',
    '--sm-fg  --sm-fg-2  --sm-muted  --sm-muted-2   text',
    '--sm-border  --sm-border-2         hairlines and dividers',
    '--sm-accent  --sm-accent-dim       one accent, used sparingly',
    '--sm-sans  --sm-mono               typefaces, with real fallbacks',
    '--sm-title-weight  --sm-title-tracking  --sm-radius',
    '--sm-pad-x  --sm-pad-top  --sm-pad-bottom    slide margins',
    '```',
    '',
    'Below the tokens, restyle the shared components the way the brand would: titles,',
    'eyebrows, cards, stats, charts and tables. Use single-class selectors and let',
    'source order beat the runtime.',
    '',
    '## Rules that keep it reusable',
    '',
    '- No colour or font family in `template.css`. It consumes `--sm-*` and inherits type.',
    '- No template-specific selector in `style.css`. A style must be wearable by any deck.',
    '- Slides are a fixed 1280x720 canvas and never scroll. Cut content, do not shrink it.',
    '- Starter slides compose from `slide-maker/runtime`, not raw HTML, or a style switch',
    '  will not reach them.',
    '- Webfonts must be self-hosted in the style directory or already installed. A deck',
    '  renders offline, and a missing font silently becomes a fallback.',
    '',
    '## Checking it',
    '',
    `- \`slide-maker browse ${template.name}\` opens a disposable studio preview.`,
    `- \`slide-maker init /tmp/${template.name}-check --template ${template.name} --yes\` makes a`,
    '  scratch deck, and `render_slide` shows what a slide really looks like.',
    `- \`slide-maker config set defaultTemplate ${template.name}\` makes it what \`init\` starts`,
    '  from on this machine.',
  ].join('\n');
}
