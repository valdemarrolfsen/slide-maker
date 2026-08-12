import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { workDir } from './paths.js';

export const COMMENTS_FILE = 'comments.json';
export const STATE_FILE = 'state.json';

const EMPTY = { version: 1, comments: [] };

export function commentsPath(deckDir) {
  return path.join(workDir(deckDir), COMMENTS_FILE);
}

export function statePath(deckDir) {
  return path.join(workDir(deckDir), STATE_FILE);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fsp.readFile(file, 'utf8'));
  } catch {
    return structuredClone(fallback);
  }
}

/**
 * Writes through a temporary file and renames it into place.
 *
 * The dev server and the MCP server are separate processes writing the same
 * file, so a half-written comments.json is a real possibility. Rename is
 * atomic on the same filesystem, which makes a torn read impossible.
 */
async function writeJson(file, data) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await fsp.rename(tmp, file);
}

/** Reads every comment on a deck, newest last. */
export async function readComments(deckDir) {
  const data = await readJson(commentsPath(deckDir), EMPTY);
  return Array.isArray(data.comments) ? data.comments : [];
}

/** Reads comments, optionally filtered by status and slide. */
export async function listComments(deckDir, { status, slideId } = {}) {
  let comments = await readComments(deckDir);
  if (status && status !== 'all') comments = comments.filter((c) => c.status === status);
  if (slideId) comments = comments.filter((c) => c.slideId === slideId);
  return comments;
}

/**
 * Applies a change to the comment list and persists it.
 *
 * Re-reads immediately before writing so an update from the other process is
 * not clobbered by a stale in-memory copy.
 */
async function mutate(deckDir, fn) {
  const comments = await readComments(deckDir);
  const result = fn(comments);
  await writeJson(commentsPath(deckDir), { version: 1, comments });
  return result;
}

/**
 * Records a new comment.
 *
 * `quote` and `context` are what let Claude find the text again. The runtime
 * cannot map a DOM selection back to a source range on its own, since JSX
 * compiles away, so the comment carries enough surrounding text for a search
 * to be unambiguous.
 */
export async function addComment(deckDir, input) {
  const comment = {
    id: `c${randomUUID().slice(0, 8)}`,
    kind: input.kind || 'slide',
    slideId: input.slideId,
    slideFile: input.slideFile,
    slideNumber: input.slideNumber ?? null,
    body: (input.body || '').trim(),
    quote: input.quote || null,
    context: input.context || null,
    anchor: input.anchor || null,
    status: 'open',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    resolution: null,
  };
  await mutate(deckDir, (comments) => comments.push(comment));
  return comment;
}

/** Marks a comment resolved, optionally recording what was done about it. */
export async function resolveComment(deckDir, id, resolution) {
  return mutate(deckDir, (comments) => {
    const comment = comments.find((c) => c.id === id);
    if (!comment) return null;
    comment.status = 'resolved';
    comment.resolvedAt = new Date().toISOString();
    comment.resolution = resolution || null;
    return comment;
  });
}

/** Moves a resolved comment back to open. */
export async function reopenComment(deckDir, id) {
  return mutate(deckDir, (comments) => {
    const comment = comments.find((c) => c.id === id);
    if (!comment) return null;
    comment.status = 'open';
    comment.resolvedAt = null;
    comment.resolution = null;
    return comment;
  });
}

/** Removes a comment outright. */
export async function deleteComment(deckDir, id) {
  return mutate(deckDir, (comments) => {
    const i = comments.findIndex((c) => c.id === id);
    if (i === -1) return false;
    comments.splice(i, 1);
    return true;
  });
}

/** Drops every resolved comment. */
export async function clearResolved(deckDir) {
  return mutate(deckDir, (comments) => {
    let removed = 0;
    for (let i = comments.length - 1; i >= 0; i -= 1) {
      if (comments[i].status === 'resolved') {
        comments.splice(i, 1);
        removed += 1;
      }
    }
    return removed;
  });
}

/** Viewer state, so Claude can ask which slide is on screen. */
export async function readState(deckDir) {
  return readJson(statePath(deckDir), { slideIndex: 0, slideId: null, updatedAt: null });
}

export async function writeState(deckDir, patch) {
  const current = await readState(deckDir);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeJson(statePath(deckDir), next);
  return next;
}

/** Renders comments as markdown, for a terminal digest or a file log. */
export function formatComments(comments) {
  if (!comments.length) return 'No comments.';
  return comments
    .map((c) => {
      const where = c.slideFile ? `${c.slideFile}` : `slide ${c.slideNumber}`;
      const lines = [`- [${c.id}] ${where}${c.status === 'resolved' ? ' (resolved)' : ''}`];
      if (c.quote) lines.push(`    on: "${c.quote}"`);
      lines.push(`    ${c.body}`);
      return lines.join('\n');
    })
    .join('\n');
}
