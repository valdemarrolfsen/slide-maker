import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

/** Absolute path to the installed slide-maker package root. */
export const packageRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/** Directory holding the built-in styles, one design system per subdirectory. */
export const builtinStylesDir = path.join(packageRoot, 'styles');

/** Directory holding the built-in reusable slide layouts. */
export const builtinDefaultSlidesDir = path.join(packageRoot, 'default_slides');

/** Directory holding the built-in full-deck templates. */
export const builtinTemplatesDir = path.join(packageRoot, 'templates');

/** The runtime module, aliased into every deck so slides resolve it wherever
 *  slide-maker happens to be installed (globally, via pnpm dlx, or locally). */
export const runtimeEntry = path.join(packageRoot, 'src', 'runtime', 'index.tsx');
export const runtimeCss = path.join(packageRoot, 'src', 'runtime', 'runtime.css');

/** The Vite root for the viewer application. */
export const viewerDir = path.join(packageRoot, 'src', 'viewer');

/**
 * The user's own slide-maker home, shared by every deck on the machine.
 *
 * Holds `config.json` plus templates, styles and default slides the user (or
 * Claude) authored, so a template crafted for one project is available to the
 * next one. Resolved on each call rather than at import so `SLIDE_MAKER_HOME`
 * can point it somewhere disposable.
 */
export function userDir() {
  const override = process.env.SLIDE_MAKER_HOME;
  return override ? path.resolve(override) : path.join(os.homedir(), '.slide-maker');
}

/** Machine-wide settings, such as the template `init` starts from. */
export function userConfigFile() {
  return path.join(userDir(), 'config.json');
}

export function userTemplatesDir() {
  return path.join(userDir(), 'templates');
}

export function userStylesDir() {
  return path.join(userDir(), 'styles');
}

export function userDefaultSlidesDir() {
  return path.join(userDir(), 'default_slides');
}

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
