import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { resolveDeckDir } from '../core/paths.js';
import { CONFIG_FILE } from '../core/deck.js';
import { listTemplates, resolveTemplate } from '../core/templates.js';
import { color, fail, ok, info } from '../core/log.js';
import {
  GITIGNORE,
  SLIDES,
  deckClaudeMd,
  deckConfig,
  deckTsconfig,
  mcpEntry,
} from './scaffold.js';

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

export async function initCommand(target, options) {
  const deckDir = resolveDeckDir(target);
  const name = path.basename(deckDir);

  if (fs.existsSync(path.join(deckDir, CONFIG_FILE)) && !options.force) {
    fail(
      `${deckDir} is already a slide-maker deck.`,
      'Pass --force to write any missing starter files into it.',
    );
  }

  const templates = await listTemplates(deckDir);
  const templateName = options.template || 'granite';
  const template = await resolveTemplate(deckDir, templateName);
  if (!template) {
    fail(
      `No template named "${templateName}".`,
      `Available: ${templates.map((t) => t.name).join(', ')}`,
    );
  }

  const title = options.title || toTitle(name);
  const written = [];
  const skipped = [];

  await fsp.mkdir(deckDir, { recursive: true });

  const config = deckConfig({ title, template: templateName, author: options.author || '' });
  await writeIfAbsent(
    path.join(deckDir, CONFIG_FILE),
    `${JSON.stringify(config, null, 2)}\n`,
    written,
    skipped,
  );

  for (const [file, contents] of Object.entries(SLIDES)) {
    await writeIfAbsent(path.join(deckDir, 'slides', file), contents, written, skipped);
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
    deckClaudeMd({ title, template: templateName }),
    written,
    skipped,
  );

  if (options.mcp !== false) {
    await writeMcpConfig(deckDir, written, skipped);
  }

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
  console.log(`    slide-maker dev          ${color.dim('open the studio')}`);
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
