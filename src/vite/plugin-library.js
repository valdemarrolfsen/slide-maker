import path from 'node:path';
import fsp from 'node:fs/promises';
import { normalizePath } from 'vite';
import { listSlides, readConfig } from '../core/deck.js';
import { listStyles } from '../core/styles.js';
import { listTemplates } from '../core/templates.js';
import { builtinTemplatesDir, runtimeCss } from '../core/paths.js';
import { resolveAliases } from './aliases.js';
import { readBody, sendJson } from './http.js';

/**
 * The template library, wired into Vite for `slide-maker browse`.
 *
 * Every template is imported as a module and every style as a string of CSS,
 * because the browser renders each combination inside its own iframe. That is
 * the only honest way to show five design systems at once: the styles all
 * define the same custom properties on the same classes, so anything short of
 * a separate document would need them rewritten, and a rewritten stylesheet is
 * no longer the one the deck will actually use.
 */
export const LIBRARY_MODULE = 'virtual:slide-maker/library';

const RESOLVED = (id) => `\0${id}`;
const API_PREFIX = '/__slide-maker/api';

function toImportPath(absolute) {
  return normalizePath(absolute);
}

function q(value) {
  return JSON.stringify(value);
}

/** The next free `NN-name.tsx` in a deck's slides directory. */
async function nextSlideFile(deckDir, config, stem) {
  const slides = await listSlides(deckDir, config);
  const number = String(slides.length + 1).padStart(2, '0');
  const taken = new Set(slides.map((s) => s.name));
  let name = `${number}-${stem}.tsx`;
  let suffix = 2;
  while (taken.has(name)) {
    name = `${number}-${stem}-${suffix}.tsx`;
    suffix += 1;
  }
  return { name, file: path.posix.join(config.slides, name) };
}

export function libraryPlugin({ deckDir }) {
  let server = null;

  return {
    name: 'slide-maker:library',
    enforce: 'pre',

    config() {
      return { resolve: { alias: resolveAliases(deckDir) } };
    },

    resolveId(id) {
      if (id === LIBRARY_MODULE) return RESOLVED(id);
      return null;
    },

    async load(id) {
      if (id !== RESOLVED(LIBRARY_MODULE)) return null;

      const [templates, styles] = await Promise.all([
        listTemplates(deckDir),
        listStyles(deckDir),
      ]);

      let deck = null;
      if (deckDir) {
        try {
          const config = await readConfig(deckDir);
          deck = { dir: deckDir, title: config.title, style: config.style };
        } catch {
          /* Browsing outside a deck is the common case, not an error. */
        }
      }

      const imports = [`import runtimeCss from ${q(`${toImportPath(runtimeCss)}?inline`)};`];
      templates.forEach((template, i) => {
        imports.push(`import * as mod${i} from ${q(toImportPath(template.slide))};`);
        imports.push(`import jsx${i} from ${q(`${toImportPath(template.slide)}?raw`)};`);
      });
      styles.forEach((style, i) => {
        imports.push(`import css${i} from ${q(`${toImportPath(style.stylesheet)}?inline`)};`);
      });

      const templateEntries = templates.map(
        (t, i) =>
          `  { name: ${q(t.name)}, label: ${q(t.label)}, description: ${q(t.description)}, ` +
          `tags: ${q(t.tags)}, guidance: ${q(t.guidance)}, stem: ${q(t.stem)}, ` +
          `origin: ${q(t.source)}, module: mod${i}, jsx: jsx${i} }`,
      );
      const styleEntries = styles.map(
        (s, i) =>
          `  { name: ${q(s.name)}, label: ${q(s.label)}, description: ${q(s.description)}, ` +
          `tags: ${q(s.tags)}, dark: ${q(s.dark)}, guidance: ${q(s.guidance)}, ` +
          `origin: ${q(s.source)}, css: css${i} }`,
      );

      return `${imports.join('\n')}

export { runtimeCss };
export const templates = [
${templateEntries.join(',\n')}
];
export const styles = [
${styleEntries.join(',\n')}
];
export const deck = ${deck ? JSON.stringify(deck, null, 2) : 'null'};
`;
    },

    configureServer(devServer) {
      server = devServer;

      // A template is a directory, and Vite only tracks the files it has
      // already imported, so adding or removing one needs a nudge.
      server.watcher.add(builtinTemplatesDir);
      const rescan = (file) => {
        if (!/[\\/]slide\.tsx$|[\\/]template\.json$/.test(normalizePath(file))) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED(LIBRARY_MODULE));
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', rescan);
      server.watcher.on('unlink', rescan);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith(API_PREFIX)) return next();
        const route = new URL(req.url, 'http://localhost').pathname.slice(API_PREFIX.length);

        if (route !== '/insert' || req.method !== 'POST') {
          return sendJson(res, 404, { error: `Unknown endpoint ${route}` });
        }

        try {
          if (!deckDir) return sendJson(res, 400, { error: 'Not running inside a deck' });
          const body = await readBody(req);
          const templates = await listTemplates(deckDir);
          const template = templates.find((t) => t.name === body.template);
          if (!template) {
            return sendJson(res, 400, { error: `No template named "${body.template}"` });
          }

          const config = await readConfig(deckDir);
          const { file } = await nextSlideFile(deckDir, config, template.stem);
          const target = path.join(deckDir, file);
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await fsp.writeFile(target, await fsp.readFile(template.slide, 'utf8'), 'utf8');
          return sendJson(res, 201, { file });
        } catch (err) {
          return sendJson(res, 500, { error: err.message });
        }
      });
    },
  };
}
