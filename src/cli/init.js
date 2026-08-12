import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { resolveDeckDir } from '../core/paths.js';
import { CONFIG_FILE } from '../core/deck.js';
import { listStyles } from '../core/styles.js';
import { readTemplateSource, resolveTemplate } from '../core/templates.js';
import { color, fail, ok, info } from '../core/log.js';
import { canPrompt, select } from './prompt.js';
import { GITIGNORE, deckClaudeMd, deckConfig, deckTsconfig, mcpEntry } from './scaffold.js';

const DEFAULT_STYLE = 'granite';

/**
 * The template a new deck's first slide comes from.
 *
 * Not a choice at scaffold time: which layout a slide wants is a question you
 * answer while writing it, not before there is anything to write. A deck that
 * keeps its own `templates/cover` gets that one instead.
 */
const STARTER_TEMPLATE = 'cover';

async function writeIfAbsent(file, contents, written, skipped) {
  if (fs.existsSync(file)) {
    skipped.push(file);
    return;
  }
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, contents, 'utf8');
  written.push(file);
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

/** Resolves the deck's style, asking only when the command line did not say. */
async function chooseStyle(styles, given, interactive) {
  if (given) {
    const match = styles.find((style) => style.name === given);
    if (!match) {
      fail(`No style named "${given}".`, `Available: ${styles.map((s) => s.name).join(', ')}`);
    }
    return match;
  }

  if (!interactive) {
    return styles.find((style) => style.name === DEFAULT_STYLE) || styles[0];
  }

  console.log('');
  const name = await select({
    message: 'Style',
    hint: 'the design the whole deck wears',
    initial: Math.max(
      0,
      styles.findIndex((style) => style.name === DEFAULT_STYLE),
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

  const styles = await listStyles(deckDir);
  if (!styles.length) fail('No styles are installed.', 'The package looks incomplete.');

  const starter = await resolveTemplate(deckDir, STARTER_TEMPLATE);
  if (!starter) fail('The template library is missing.', 'The package looks incomplete.');

  const style = await chooseStyle(styles, options.style, canPrompt() && !options.yes);

  const title = options.title || toTitle(name);
  const written = [];
  const skipped = [];

  await fsp.mkdir(deckDir, { recursive: true });

  const config = deckConfig({ title, style: style.name, author: options.author || '' });
  await writeIfAbsent(
    path.join(deckDir, CONFIG_FILE),
    `${JSON.stringify(config, null, 2)}\n`,
    written,
    skipped,
  );

  await writeIfAbsent(
    path.join(deckDir, 'slides', `01-${starter.stem}.tsx`),
    await readTemplateSource(starter),
    written,
    skipped,
  );

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
    deckClaudeMd({ title, style: style.name }),
    written,
    skipped,
  );

  if (options.mcp !== false) {
    await writeMcpConfig(deckDir, written, skipped);
  }

  console.log('');
  ok(`Created "${title}" in ${color.cyan(path.relative(process.cwd(), deckDir) || '.')}`);
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
  console.log(`    slide-maker start        ${color.dim('open the studio')}`);
  console.log(`    slide-maker browse       ${color.dim('the slide templates, in this style')}`);
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
