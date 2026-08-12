import { createRequire } from 'node:module';
import { Command } from 'commander';
import { initCommand } from './init.js';
import { devCommand } from './dev.js';
import { buildCommand } from './build.js';
import { exportCommand } from './export.js';
import { templatesCommand, useTemplateCommand } from './templates.js';
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
    .option('-t, --template <name>', 'template to start with', 'granite')
    .option('--title <title>', 'deck title, defaults to the directory name')
    .option('--author <name>', 'deck author')
    .option('--no-mcp', 'skip writing the .mcp.json entry')
    .option('-f, --force', 'write missing files into an existing deck')
    .action(initCommand);

  program
    .command('dev', { isDefault: true })
    .argument('[dir]', 'deck directory', '.')
    .description('open the studio and watch for changes')
    .option('-p, --port <port>', 'port to listen on', '5170')
    .option('--host [host]', 'expose the server on the network')
    .option('-o, --open', 'open a browser on start')
    .action(devCommand);

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
    .command('templates')
    .description('list the available slide templates')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(templatesCommand);

  program
    .command('use')
    .argument('<template>', 'template name')
    .description('switch the deck to another template')
    .option('-d, --deck <dir>', 'deck directory', '.')
    .action(useTemplateCommand);

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
