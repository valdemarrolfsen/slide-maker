import path from 'node:path';
import { normalizePath } from 'vite';
import { listSlides, readConfig, writeConfig, CONFIG_FILE } from '../core/deck.js';
import { resolveStyle, listStyles } from '../core/styles.js';
import { runtimeCss } from '../core/paths.js';
import { resolveAliases } from './aliases.js';
import { readBody, sendJson } from './http.js';
import {
  addComment,
  clearResolved,
  commentsPath,
  deleteComment,
  listComments,
  reopenComment,
  resolveComment,
  writeState,
} from '../core/comments.js';
import { warn } from '../core/log.js';

/* Virtual modules. The viewer imports these; the plugin generates them from
   whatever is on disk, so adding a slide file is all it takes to add a slide. */
export const DECK_MODULE = 'virtual:slide-maker/deck';
export const STYLE_MODULE = 'virtual:slide-maker/style';

const RESOLVED = (id) => `\0${id}`;
const API_PREFIX = '/__slide-maker/api';

function toImportPath(absolute) {
  return normalizePath(absolute);
}

function downloadName(title) {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'deck';
  return `${slug}.pdf`;
}

function sendPdf(res, pdf, filename) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/pdf');
  res.setHeader('content-disposition', `attachment; filename="${filename}"`);
  res.setHeader('content-length', pdf.length);
  res.setHeader('cache-control', 'no-store');
  res.end(pdf);
}

/**
 * Wires a deck directory into Vite.
 *
 * Responsible for four things: making `slide-maker/runtime` resolvable from
 * anywhere, generating the deck and style modules, serving the comment API,
 * and pushing comment changes to the viewer over the existing HMR socket so
 * there is no second websocket to manage.
 */
export function deckPlugin({ deckDir, config }) {
  let server = null;
  let current = config;

  const invalidate = (id) => {
    if (!server) return;
    const mod = server.moduleGraph.getModuleById(RESOLVED(id));
    if (mod) server.moduleGraph.invalidateModule(mod);
  };

  const reload = () => {
    if (!server) return;
    invalidate(DECK_MODULE);
    invalidate(STYLE_MODULE);
    server.ws.send({ type: 'full-reload' });
  };

  const push = (event, data) => {
    if (!server) return;
    server.ws.send({ type: 'custom', event, data });
  };

  return {
    name: 'slide-maker:deck',
    enforce: 'pre',

    config() {
      return { resolve: { alias: resolveAliases(deckDir) } };
    },

    resolveId(id) {
      if (id === DECK_MODULE || id === STYLE_MODULE) return RESOLVED(id);
      return null;
    },

    async load(id) {
      if (id === RESOLVED(DECK_MODULE)) {
        current = await readConfig(deckDir);
        const slides = await listSlides(deckDir, current);
        const imports = slides
          .map((s, i) => `import * as slide${i} from ${JSON.stringify(toImportPath(s.absolute))};`)
          .join('\n');
        const entries = slides
          .map(
            (s, i) =>
              `  { id: ${JSON.stringify(s.id)}, index: ${s.index}, number: ${s.number}, ` +
              `file: ${JSON.stringify(s.file)}, name: ${JSON.stringify(s.name)}, module: slide${i} }`,
          )
          .join(',\n');
        return `${imports}

export const config = ${JSON.stringify(current, null, 2)};
export const slides = [
${entries}
];
`;
      }

      if (id === RESOLVED(STYLE_MODULE)) {
        current = await readConfig(deckDir);
        const style = await resolveStyle(deckDir, current.style);
        const lines = [`import ${JSON.stringify(toImportPath(runtimeCss))};`];
        if (style) {
          lines.push(`import ${JSON.stringify(toImportPath(style.stylesheet))};`);
        } else {
          const available = (await listStyles(deckDir)).map((s) => s.name).join(', ');
          warn(`Style "${current.style}" not found. Available: ${available || 'none'}`);
        }
        lines.push(`export const style = ${JSON.stringify(style?.name ?? null)};`);
        return lines.join('\n');
      }

      return null;
    },

    configureServer(devServer) {
      server = devServer;

      const commentsFile = commentsPath(deckDir);
      server.watcher.add(commentsFile);
      server.watcher.add(path.join(deckDir, CONFIG_FILE));

      // The MCP server resolves comments in a different process. Watching the
      // file rather than routing everything through the API means the viewer
      // stays in sync no matter who made the change.
      const onChange = async (file) => {
        const changed = normalizePath(file);
        if (changed === normalizePath(commentsFile)) {
          push('slide-maker:comments', { comments: await listComments(deckDir) });
          return;
        }
        if (changed === normalizePath(path.join(deckDir, CONFIG_FILE))) {
          reload();
        }
      };
      server.watcher.on('change', onChange);
      server.watcher.on('add', (file) => {
        if (normalizePath(file).startsWith(normalizePath(path.join(deckDir, current.slides)))) {
          reload();
        }
      });
      server.watcher.on('unlink', (file) => {
        if (normalizePath(file).startsWith(normalizePath(path.join(deckDir, current.slides)))) {
          reload();
        }
      });

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith(API_PREFIX)) return next();

        const url = new URL(req.url, 'http://localhost');
        const route = url.pathname.slice(API_PREFIX.length) || '/';

        try {
          if (route === '/state' && req.method === 'GET') {
            const cfg = await readConfig(deckDir);
            const [slides, comments, styles] = await Promise.all([
              listSlides(deckDir, cfg),
              listComments(deckDir),
              listStyles(deckDir),
            ]);
            return sendJson(res, 200, {
              deckDir,
              config: cfg,
              slides: slides.map(({ absolute, ...rest }) => rest),
              comments,
              styles: styles.map(({ dir, stylesheet, ...rest }) => rest),
            });
          }

          if (route === '/comments' && req.method === 'GET') {
            return sendJson(res, 200, { comments: await listComments(deckDir) });
          }

          if (route === '/style' && req.method === 'POST') {
            const body = await readBody(req);
            const name = typeof body.name === 'string' ? body.name : '';
            const style = await resolveStyle(deckDir, name);
            if (!style) {
              const available = (await listStyles(deckDir)).map((item) => item.name);
              return sendJson(res, 400, {
                error: `No style named "${name}". Available: ${available.join(', ')}`,
              });
            }
            const cfg = await readConfig(deckDir);
            await writeConfig(deckDir, { ...cfg, style: name });
            return sendJson(res, 200, { style: name });
          }

          if (route === '/export/pdf' && req.method === 'POST') {
            const cfg = await readConfig(deckDir);
            const slides = await listSlides(deckDir, cfg);
            if (!slides.length) {
              return sendJson(res, 400, { error: 'Add at least one slide before exporting' });
            }
            // Import lazily to keep the normal studio startup light and avoid a
            // cycle through renderer -> Vite config -> this plugin.
            const { renderPdf } = await import('../render/renderer.js');
            const pdf = await renderPdf({ deckDir, config: cfg });
            return sendPdf(res, pdf, downloadName(cfg.title));
          }

          if (route === '/comments' && req.method === 'POST') {
            const body = await readBody(req);
            if (!body.body || !String(body.body).trim()) {
              return sendJson(res, 400, { error: 'A comment needs a body' });
            }
            const comment = await addComment(deckDir, body);
            push('slide-maker:comments', { comments: await listComments(deckDir) });
            return sendJson(res, 201, { comment });
          }

          if (route === '/comments/clear-resolved' && req.method === 'POST') {
            const removed = await clearResolved(deckDir);
            push('slide-maker:comments', { comments: await listComments(deckDir) });
            return sendJson(res, 200, { removed });
          }

          const match = /^\/comments\/([^/]+)(\/resolve|\/reopen)?$/.exec(route);
          if (match) {
            const [, id, action] = match;
            if (req.method === 'DELETE') {
              const removed = await deleteComment(deckDir, id);
              push('slide-maker:comments', { comments: await listComments(deckDir) });
              return sendJson(res, removed ? 200 : 404, { ok: removed });
            }
            if (req.method === 'POST' && action === '/resolve') {
              const body = await readBody(req);
              const comment = await resolveComment(deckDir, id, body.resolution);
              push('slide-maker:comments', { comments: await listComments(deckDir) });
              return sendJson(res, comment ? 200 : 404, { comment });
            }
            if (req.method === 'POST' && action === '/reopen') {
              const comment = await reopenComment(deckDir, id);
              push('slide-maker:comments', { comments: await listComments(deckDir) });
              return sendJson(res, comment ? 200 : 404, { comment });
            }
          }

          if (route === '/view' && req.method === 'POST') {
            const body = await readBody(req);
            await writeState(deckDir, { slideIndex: body.slideIndex, slideId: body.slideId });
            return sendJson(res, 200, { ok: true });
          }

          return sendJson(res, 404, { error: `Unknown endpoint ${route}` });
        } catch (err) {
          return sendJson(res, 500, { error: err.message });
        }
      });
    },
  };
}
