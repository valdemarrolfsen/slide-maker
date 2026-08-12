import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** Absolute path to the installed slide-maker package root. */
export const packageRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Directory holding the built-in templates. */
export const builtinTemplatesDir = path.join(packageRoot, 'templates');

/** The runtime module, aliased into every deck so slides resolve it wherever
 *  slide-maker happens to be installed (globally, via pnpm dlx, or locally). */
export const runtimeEntry = path.join(packageRoot, 'src', 'runtime', 'index.tsx');
export const runtimeCss = path.join(packageRoot, 'src', 'runtime', 'runtime.css');

/** The Vite root for the viewer application. */
export const viewerDir = path.join(packageRoot, 'src', 'viewer');

/** Per-deck working directory. Holds comments and view state, and is meant to
 *  be gitignored. */
export const workDirName = '.slide-maker';

/** Resolves a user-supplied deck path to an absolute directory. */
export function resolveDeckDir(input) {
  return path.resolve(process.cwd(), input || '.');
}

/** Absolute path to a deck's working directory. */
export function workDir(deckDir) {
  return path.join(deckDir, workDirName);
}
