import path from 'node:path';
import { createRequire } from 'node:module';
import { normalizePath } from 'vite';
import { listSlides, readConfig, CONFIG_FILE } from '../core/deck.js';
import { resolveTemplate, listTemplates } from '../core/templates.js';
import { runtimeCss, runtimeEntry } from '../core/paths.js';
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
export const THEME_MODULE = 'virtual:slide-maker/theme';

const RESOLVED = (id) => `\0${id}`;
const API_PREFIX = '/__slide-maker/api';

const require = createRequire(import.meta.url);

/**
 * Aliases that make a deck resolvable from anywhere on disk.
 *
 * A deck is content, not a project: it has no package.json and no node_modules.
 * Slide files still compile to JSX runtime imports, and resolution for those
 * starts from the slide's own directory, so without these a deck outside the
 * package fails to build. Pinning React here also guarantees one React
 * instance even if a deck happens to sit inside another project that has its
 * own copy.
 *
 * The array form matters: object-form aliases match as prefixes, so a `react`
 * key would also swallow `react-dom`.
 */
function resolveAliases(deckDir) {
  const pinned = [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ];
  return [
    { find: /^slide-maker\/runtime$/, replacement: runtimeEntry },
    { find: /^@deck$/, replacement: deckDir },
    { find: /^@deck\//, replacement: `${deckDir}/` },
    ...pinned.map((id) => ({
      find: new RegExp(`^${id.replace(/[/\\]/g, '\\$&')}$`),
      replacement: require.resolve(id),
    })),
  ];
}

function toImportPath(absolute) {
  return normalizePath(absolute);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      // A comment is a sentence, not a payload. Cap it so a stray request
      // cannot buffer the process out of memory.
      if (size > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(body);
}

/**
 * Wires a deck directory into Vite.
 *
 * Responsible for four things: making `slide-maker/runtime` resolvable from
 * anywhere, generating the deck and theme modules, serving the comment API,
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
    invalidate(THEME_MODULE);
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
      if (id === DECK_MODULE || id === THEME_MODULE) return RESOLVED(id);
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

      if (id === RESOLVED(THEME_MODULE)) {
        current = await readConfig(deckDir);
        const template = await resolveTemplate(deckDir, current.template);
        const lines = [`import ${JSON.stringify(toImportPath(runtimeCss))};`];
        if (template) {
          lines.push(`import ${JSON.stringify(toImportPath(template.stylesheet))};`);
        } else {
          const available = (await listTemplates(deckDir)).map((t) => t.name).join(', ');
          warn(`Template "${current.template}" not found. Available: ${available || 'none'}`);
        }
        lines.push(`export const template = ${JSON.stringify(template?.name ?? null)};`);
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
            const [slides, comments, templates] = await Promise.all([
              listSlides(deckDir, cfg),
              listComments(deckDir),
              listTemplates(deckDir),
            ]);
            return sendJson(res, 200, {
              deckDir,
              config: cfg,
              slides: slides.map(({ absolute, ...rest }) => rest),
              comments,
              templates: templates.map(({ dir, stylesheet, ...rest }) => rest),
            });
          }

          if (route === '/comments' && req.method === 'GET') {
            return sendJson(res, 200, { comments: await listComments(deckDir) });
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
