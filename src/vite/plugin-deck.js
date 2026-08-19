import path from 'node:path';
import fsp from 'node:fs/promises';
import { createRequire } from 'node:module';
import { normalizePath } from 'vite';
import {
  listSlides,
  readConfig,
  setSlideHidden,
  writeConfig,
  CONFIG_FILE,
} from '../core/deck.js';
import { resolveStyle, listStyles } from '../core/styles.js';
import { resolveTemplate } from '../core/templates.js';
import { listDefaultSlides, resolveDefaultSlide } from '../core/default-slides.js';
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
import { replaceSlideText } from '../core/text-edit.js';

/* Virtual modules. The viewer imports these; the plugin generates them from
   whatever is on disk, so adding a slide file is all it takes to add a slide. */
export const DECK_MODULE = 'virtual:slide-maker/deck';
export const STYLE_MODULE = 'virtual:slide-maker/style';
/* Only the studio imports this one. The exported deck has no use for fifteen
   layouts it did not ask for, and index.html is never part of a build. */
export const DEFAULT_SLIDES_MODULE = 'virtual:slide-maker/default-slides';

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
      // A request here is a comment or a default-slide name, not a payload. Cap it
      // so a stray request cannot buffer the process out of memory.
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

/** The next free `NN-name.tsx` in a deck's slides directory. */
async function nextSlideFile(deckDir, config, stem) {
  const slides = await listSlides(deckDir, config, { includeHidden: true });
  const taken = new Set(slides.map((s) => s.name));
  const number = String(slides.length + 1).padStart(2, '0');
  let name = `${number}-${stem}.tsx`;
  let suffix = 2;
  while (taken.has(name)) {
    name = `${number}-${stem}-${suffix}.tsx`;
    suffix += 1;
  }
  return path.posix.join(config.slides, name);
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
    invalidate(DEFAULT_SLIDES_MODULE);
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
      if (id === DECK_MODULE || id === STYLE_MODULE || id === DEFAULT_SLIDES_MODULE) {
        return RESOLVED(id);
      }
      return null;
    },

    async load(id) {
      if (id === RESOLVED(DECK_MODULE)) {
        current = await readConfig(deckDir);
        const allSlides = await listSlides(deckDir, current, { includeHidden: true });
        const imports = allSlides
          .map((s, i) => `import * as slide${i} from ${JSON.stringify(toImportPath(s.absolute))};`)
          .join('\n');
        const allEntries = allSlides
          .map(
            (s, i) =>
              `  { id: ${JSON.stringify(s.id)}, index: ${s.index}, number: ${s.number}, ` +
              `file: ${JSON.stringify(s.file)}, name: ${JSON.stringify(s.name)}, ` +
              `hidden: ${s.hidden}, module: slide${i} }`,
          )
          .join(',\n');
        const visibleEntries = allSlides
          .map((slide, importIndex) => ({ slide, importIndex }))
          .filter(({ slide }) => !slide.hidden)
          .map(
            ({ slide, importIndex }, index) =>
              `  { id: ${JSON.stringify(slide.id)}, index: ${index}, number: ${index + 1}, ` +
              `file: ${JSON.stringify(slide.file)}, name: ${JSON.stringify(slide.name)}, ` +
              `hidden: false, module: slide${importIndex} }`,
          )
          .join(',\n');
        return `${imports}

export const config = ${JSON.stringify(current, null, 2)};
export const allSlides = [
${allEntries}
];
export const slides = [
${visibleEntries}
];
`;
      }

      if (id === RESOLVED(DEFAULT_SLIDES_MODULE)) {
        current = await readConfig(deckDir);
        const template = await resolveTemplate(current.template);
        const defaultSlides = await listDefaultSlides(deckDir, template?.defaultSlides);
        const imports = defaultSlides
          .map((t, i) => `import * as tpl${i} from ${JSON.stringify(toImportPath(t.slide))};`)
          .join('\n');
        // Shaped like a slide entry so the studio can hand a default slide straight
        // to SlideFrame and get the same error boundary a real slide gets.
        const entries = defaultSlides
          .map(
            (t, i) =>
              `  { id: ${JSON.stringify(t.name)}, index: 0, number: 1, ` +
              `name: ${JSON.stringify(t.name)}, ` +
              `file: ${JSON.stringify(path.posix.join('default_slides', t.name, 'slide.tsx'))}, ` +
              `label: ${JSON.stringify(t.label)}, description: ${JSON.stringify(t.description)}, ` +
              `stem: ${JSON.stringify(t.stem)}, source: ${JSON.stringify(t.source)}, ` +
              `module: tpl${i} }`,
          )
          .join(',\n');
        return `${imports}

export const defaultSlides = [
${entries}
];
`;
      }

      if (id === RESOLVED(STYLE_MODULE)) {
        current = await readConfig(deckDir);
        const [style, template] = await Promise.all([
          resolveStyle(deckDir, current.style),
          resolveTemplate(current.template),
        ]);
        const lines = [`import ${JSON.stringify(toImportPath(runtimeCss))};`];
        if (style) {
          lines.push(`import ${JSON.stringify(toImportPath(style.stylesheet))};`);
        } else {
          const available = (await listStyles(deckDir)).map((s) => s.name).join(', ');
          warn(`Style "${current.style}" not found. Available: ${available || 'none'}`);
        }
        // Layout belongs to the template/deck, not the active visual theme. New
        // decks receive a local copy so they can evolve it; the bundled copy is
        // a compatibility fallback for decks created before this separation.
        const localLayout = path.resolve(deckDir, current.layout);
        let layout = null;
        try {
          if ((await fsp.stat(localLayout)).isFile()) layout = localLayout;
        } catch {
          layout = template?.stylesheet || null;
        }
        if (layout) lines.push(`import ${JSON.stringify(toImportPath(layout))};`);
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
      server.watcher.add(path.resolve(deckDir, current.layout));
      // The directory, not just the slide files inside it. Vite only watches
      // what the module graph already imports, and a slide that does not exist
      // yet is exactly the case that has to work: adding a file is how a deck
      // grows, whether the writer is Claude, the studio or a text editor.
      server.watcher.add(path.join(deckDir, current.slides));

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
        if (normalizePath(file) === normalizePath(path.resolve(deckDir, current.layout))) {
          reload();
          return;
        }
        if (normalizePath(file).startsWith(normalizePath(path.join(deckDir, current.slides)))) {
          reload();
        }
      });
      server.watcher.on('unlink', (file) => {
        if (normalizePath(file) === normalizePath(path.resolve(deckDir, current.layout))) {
          reload();
          return;
        }
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
              listSlides(deckDir, cfg, { includeHidden: true }),
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

          if (route === '/slides' && req.method === 'POST') {
            const body = await readBody(req);
            const defaultSlide = await resolveDefaultSlide(deckDir, body.defaultSlide);
            if (!defaultSlide) {
              const available = (await listDefaultSlides(deckDir)).map((item) => item.name);
              return sendJson(res, 400, {
                error: `No default slide named "${body.defaultSlide}". Available: ${available.join(', ')}`,
              });
            }
            const cfg = await readConfig(deckDir);
            const selectedTemplate = await resolveTemplate(cfg.template);
            if (
              selectedTemplate?.defaultSlides.length &&
              !selectedTemplate.defaultSlides.includes('*') &&
              !selectedTemplate.defaultSlides.includes(defaultSlide.name)
            ) {
              return sendJson(res, 400, {
                error: `${defaultSlide.name} is not part of the ${selectedTemplate.label} template.`,
              });
            }
            const file = await nextSlideFile(deckDir, cfg, defaultSlide.stem);
            const target = path.join(deckDir, file);
            await fsp.mkdir(path.dirname(target), { recursive: true });
            await fsp.writeFile(target, await fsp.readFile(defaultSlide.slide, 'utf8'), 'utf8');
            // The watcher picks the new file up and reloads the viewer, so
            // there is nothing to push here beyond the name of what landed.
            return sendJson(res, 201, { file });
          }

          if (route === '/slides/visibility' && req.method === 'POST') {
            const body = await readBody(req);
            if (typeof body.file !== 'string' || typeof body.hidden !== 'boolean') {
              return sendJson(res, 400, { error: 'Both file and hidden are required' });
            }
            const slide = await setSlideHidden(deckDir, body.file, body.hidden);
            if (!slide) return sendJson(res, 404, { error: 'Slide file not found' });
            return sendJson(res, 200, { file: slide.file, hidden: slide.hidden });
          }

          if (route === '/text' && req.method === 'POST') {
            const body = await readBody(req);
            const cfg = await readConfig(deckDir);
            const slides = await listSlides(deckDir, cfg, { includeHidden: true });
            // Resolve only through the configured slide list. Besides producing
            // a useful not-found error, this makes path traversal impossible.
            const slide = slides.find((item) => item.file === body.file);
            if (!slide) return sendJson(res, 404, { error: 'Slide file not found' });
            if (typeof body.oldText !== 'string' || typeof body.newText !== 'string') {
              return sendJson(res, 400, { error: 'Both oldText and newText are required' });
            }
            const occurrence = Number.isSafeInteger(body.occurrence) && body.occurrence >= 0
              ? body.occurrence
              : 0;
            const source = await fsp.readFile(slide.absolute, 'utf8');
            const updated = replaceSlideText(source, {
              oldText: body.oldText,
              newText: body.newText,
              occurrence,
            });
            await fsp.writeFile(slide.absolute, updated, 'utf8');
            return sendJson(res, 200, { ok: true });
          }

          if (route === '/export/pdf' && req.method === 'POST') {
            const cfg = await readConfig(deckDir);
            const slides = await listSlides(deckDir, cfg);
            if (!slides.length) {
              return sendJson(res, 400, { error: 'Show at least one slide before exporting' });
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
