import { resolveDeckDir } from '../core/paths.js';
import { formatComments, listComments, resolveComment, clearResolved } from '../core/comments.js';
import { color, ok } from '../core/log.js';

/**
 * Reading and clearing feedback from the terminal.
 *
 * The MCP tools are the intended path, but a deck's comments are just a file,
 * and being able to read them without a running server is worth the few lines.
 */
export async function commentsCommand(options) {
  const deckDir = resolveDeckDir(options.deck);
  const status = options.all ? 'all' : 'open';
  const comments = await listComments(deckDir, { status });

  if (!comments.length) {
    console.log(color.dim(status === 'open' ? '  No open comments.' : '  No comments.'));
    return;
  }

  console.log('');
  console.log(formatComments(comments));
  console.log('');
}

export async function resolveCommentCommand(id, options) {
  const deckDir = resolveDeckDir(options.deck);
  const comment = await resolveComment(deckDir, id, options.note);
  if (!comment) {
    console.log(color.yellow(`  No comment with id ${id}.`));
    return;
  }
  ok(`Resolved ${id}.`);
}

export async function clearCommentsCommand(options) {
  const deckDir = resolveDeckDir(options.deck);
  const removed = await clearResolved(deckDir);
  ok(`Removed ${removed} resolved comment${removed === 1 ? '' : 's'}.`);
}
