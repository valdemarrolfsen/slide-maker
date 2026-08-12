import { createRequire } from 'node:module';
import { Command } from 'commander';
import { initCommand } from './init.js';
import { startCommand } from './start.js';
import { buildCommand } from './build.js';
import { exportCommand } from './export.js';
import { stylesCommand, useStyleCommand } from './styles.js';
import { templatesCommand } from './templates.js';
import { clearCommentsCommand, commentsCommand, resolveCommentCommand } from './comments.js';
import { resolveDeckDir } from '../core/paths.js';
import { error } from '../core/log.js';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');

export function createCli() {
  const program = new Command();

  program
    .name('slide-maker')
    .description('A local slide deck studio you drive from Claude Code.')
    .version(version);

  program
    .command('init')
    .argument('[dir]', 'where to create the deck', '.')
    .description('scaffold a deck and wire it up to Claude Code')
    .option('-s, --style <name>', 'design system for the deck, prompts if omitted')
    .option('--title <title>', 'deck title, defaults to the directory name')
    .option('--author <name>', 'deck author')
    .option('--no-mcp', 'skip writing the .mcp.json entry')
    .option('-f, --force', 'write missing files into an existing deck')
    .option('-y, --yes', 'take the defaults instead of asking')
    .action(initCommand);

  program
    .command('start', { isDefault: true })
    .argument('[dir]', 'deck directory', '.')
    .description('open the studio and watch for changes')
    .option('-p, --port <port>', 'port to listen on', '5170')
    .option('--host [host]', 'expose the server on the network')
    .option('-o, --open', 'open a browser on start')
    .action(startCommand);

  program
    .command('build')
    .argument('[dir]', 'deck directory', '.')
    .description('export the deck as a self-contained static site')
    .option('-o, --out <dir>', 'output directory, relative to the deck', 'dist')
    .action(buildCommand);

  program
    .command('export')
    .argument('[dir]', 'deck directory', '.')
    .description('render the deck to PDF or PNG')
    .option('-f, --format <format>', 'pdf or png', 'pdf')
    .option('-o, --out <path>', 'output file or directory')
    .action(exportCommand);

  program
    .command('styles')
    .description('list the available design systems')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(stylesCommand);

  program
    .command('use')
    .argument('<style>', 'style name')
    .description('switch the deck to another style')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(useStyleCommand);

  program
    .command('templates')
    .description('list the slide templates in the library')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(templatesCommand);

  const comments = program.command('comments').description('read and clear deck feedback');

  comments
    .command('list', { isDefault: true })
    .description('show comments left in the studio')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .option('-a, --all', 'include resolved comments')
    .action(commentsCommand);

  comments
    .command('resolve')
    .argument('<id>', 'comment id')
    .description('mark a comment resolved')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .option('-n, --note <note>', 'what was changed')
    .action(resolveCommentCommand);

  comments
    .command('clear')
    .description('delete every resolved comment')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(clearCommentsCommand);

  program
    .command('mcp')
    .argument('[dir]', 'deck directory', '.')
    .description('run the MCP server over stdio, for Claude Code to connect to')
    .action(async (dir) => {
      // Imported lazily so the ordinary commands do not pay for the SDK.
      const { startMcpServer } = await import('../mcp/server.js');
      await startMcpServer(resolveDeckDir(dir));
    });

  return program;
}

export async function run(argv = process.argv) {
  const program = createCli();
  try {
    await program.parseAsync(argv);
  } catch (err) {
    error(err?.message || String(err));
    if (process.env.SLIDE_MAKER_DEBUG) console.error(err);
    process.exitCode = 1;
  }
}
