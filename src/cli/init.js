import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { resolveDeckDir } from '../core/paths.js';
import { CONFIG_FILE } from '../core/deck.js';
import { listStyles } from '../core/styles.js';
import { listTemplates } from '../core/templates.js';
import { readUserConfig } from '../core/user-config.js';
import { color, fail, ok, info } from '../core/log.js';
import { canPrompt, select } from './prompt.js';
import { GITIGNORE, deckClaudeMd, deckConfig, deckTsconfig, mcpEntry } from './scaffold.js';

async function writeIfAbsent(file, contents, written, skipped) {
  if (fs.existsSync(file)) {
    skipped.push(file);
    return;
  }
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, contents, 'utf8');
  written.push(file);
}

async function copyTreeIfAbsent(sourceDir, targetDir, written, skipped) {
  let entries = [];
  try {
    entries = await fsp.readdir(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      await copyTreeIfAbsent(source, target, written, skipped);
    } else if (entry.isFile()) {
      await writeIfAbsent(target, await fsp.readFile(source), written, skipped);
    }
  }
}

/**
 * Registers the deck's MCP server in .mcp.json.
 *
 * Merges rather than overwrites, since the project may already have servers
 * configured and clobbering them would be an unpleasant surprise.
 */
async function writeMcpConfig(deckDir, written, skipped) {
  const file = path.join(deckDir, '.mcp.json');
  let existing = { mcpServers: {} };
  if (fs.existsSync(file)) {
    try {
      existing = JSON.parse(await fsp.readFile(file, 'utf8'));
    } catch {
      skipped.push(`${file} (could not be parsed, left alone)`);
      return;
    }
    if (existing.mcpServers?.['slide-maker']) {
      skipped.push(file);
      return;
    }
  }
  const next = {
    ...existing,
    mcpServers: { ...(existing.mcpServers || {}), 'slide-maker': mcpEntry(deckDir) },
  };
  await fsp.writeFile(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  written.push(file);
}

/** Resolves the template, defaulting to the user's `config defaultTemplate`. */
async function chooseTemplate(templates, given, interactive, preferred) {
  if (given) {
    const match = templates.find((template) => template.name === given);
    if (!match) {
      fail(`No template named "${given}".`, `Available: ${templates.map((t) => t.name).join(', ')}`);
    }
    return match;
  }
  if (!interactive) {
    return templates.find((template) => template.name === preferred) || templates[0];
  }

  console.log('');
  const name = await select({
    message: 'Template',
    hint: 'a complete starting deck, or blank',
    initial: Math.max(0, templates.findIndex((template) => template.name === preferred)),
    choices: templates.map((template) => ({
      value: template.name,
      label: template.label,
      note: template.description,
    })),
  });
  if (name === null) fail('Cancelled.', 'Pass --template <name> to skip the prompt.');
  return templates.find((template) => template.name === name);
}

/** Resolves the deck's style, defaulting to the template's recommendation. */
async function chooseStyle(styles, given, interactive, defaultStyle) {
  if (given) {
    const match = styles.find((style) => style.name === given);
    if (!match) {
      fail(`No style named "${given}".`, `Available: ${styles.map((s) => s.name).join(', ')}`);
    }
    return match;
  }

  if (!interactive) {
    return styles.find((style) => style.name === defaultStyle) || styles[0];
  }

  console.log('');
  const name = await select({
    message: 'Style',
    hint: 'the design the whole deck wears',
    initial: Math.max(
      0,
      styles.findIndex((style) => style.name === defaultStyle),
    ),
    choices: styles.map((style) => ({
      value: style.name,
      label: style.name,
      note: style.description,
    })),
  });
  // Escape backs out of the whole command rather than quietly taking a default
  // the user never saw the point of choosing.
  if (name === null) fail('Cancelled.', 'Pass --style <name> to skip the prompt.');
  return styles.find((style) => style.name === name);
}

export async function initCommand(target, options) {
  const deckDir = resolveDeckDir(target);
  const name = path.basename(deckDir);

  if (fs.existsSync(path.join(deckDir, CONFIG_FILE)) && !options.force) {
    fail(
      `${deckDir} is already a slide-maker deck.`,
      'Pass --force to write any missing starter files into it.',
    );
  }

  const [styles, templates, user] = await Promise.all([
    listStyles(deckDir),
    listTemplates(),
    readUserConfig(),
  ]);
  if (!styles.length) fail('No styles are installed.', 'The package looks incomplete.');
  if (!templates.length) fail('No templates are installed.', 'The package looks incomplete.');

  const interactive = canPrompt() && !options.yes;
  const template = await chooseTemplate(
    templates,
    options.template,
    interactive,
    user.defaultTemplate,
  );
  // A style the user configured is a deliberate machine-wide choice, so it
  // outranks the template's own recommendation but never an explicit --style.
  const style = await chooseStyle(
    styles,
    options.style,
    interactive,
    user.defaultStyle || template.defaultStyle,
  );

  const title = options.title || toTitle(name);
  const written = [];
  const skipped = [];

  await fsp.mkdir(deckDir, { recursive: true });

  const config = deckConfig({
    title,
    template: template.name,
    style: style.name,
    author: options.author || user.author || '',
  });
  await writeIfAbsent(
    path.join(deckDir, CONFIG_FILE),
    `${JSON.stringify(config, null, 2)}\n`,
    written,
    skipped,
  );

  await copyTreeIfAbsent(template.slidesDir, path.join(deckDir, 'slides'), written, skipped);
  await copyTreeIfAbsent(template.assetsDir, path.join(deckDir, 'assets'), written, skipped);
  if (template.stylesheet) {
    await writeIfAbsent(
      path.join(deckDir, config.layout),
      await fsp.readFile(template.stylesheet),
      written,
      skipped,
    );
  }

  await writeIfAbsent(path.join(deckDir, 'assets', '.gitkeep'), '', written, skipped);
  await writeIfAbsent(path.join(deckDir, '.gitignore'), GITIGNORE, written, skipped);
  await writeIfAbsent(
    path.join(deckDir, 'tsconfig.json'),
    `${JSON.stringify(deckTsconfig(), null, 2)}\n`,
    written,
    skipped,
  );
  await writeIfAbsent(
    path.join(deckDir, 'CLAUDE.md'),
    deckClaudeMd({ title, template: template.name, style: style.name }),
    written,
    skipped,
  );

  if (options.mcp !== false) {
    await writeMcpConfig(deckDir, written, skipped);
  }

  console.log('');
  ok(`Created "${title}" in ${color.cyan(path.relative(process.cwd(), deckDir) || '.')}`);
  console.log(`  ${color.dim('template')} ${template.label}   ${color.dim('style')} ${style.label}`);
  for (const file of written) {
    console.log(`  ${color.dim('+')} ${path.relative(deckDir, file)}`);
  }
  if (skipped.length) {
    info(color.dim(`Left alone: ${skipped.map((f) => path.relative(deckDir, f)).join(', ')}`));
  }

  console.log('');
  console.log(`  ${color.bold('Next')}`);
  const where = path.relative(process.cwd(), deckDir);
  if (where) console.log(`    cd ${where}`);
  console.log(`    pnpm dlx slide-maker start  ${color.dim('open the studio')}`);
  console.log(`    claude                   ${color.dim('start building, MCP is already wired up')}`);
  console.log('');
  console.log(color.dim('  Claude Code asks you to approve the MCP server the first time it starts.'));
}

/** Turns a directory name into something presentable as a deck title. */
function toTitle(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}
