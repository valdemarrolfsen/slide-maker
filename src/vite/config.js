import fs from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { deckPlugin } from './plugin-deck.js';
import { libraryPlugin } from './plugin-library.js';
import { singleFilePlugin } from './plugin-singlefile.js';
import { packageRoot, viewerDir } from '../core/paths.js';

/**
 * Builds the Vite configuration for a deck.
 *
 * The Vite root is slide-maker's own viewer, not the deck. The deck is pulled
 * in through virtual modules and an alias, which keeps the deck directory free
 * of build scaffolding: a deck is slides, a config file, and nothing else.
 */
export function createViteConfig({ deckDir, config, mode = 'studio', outDir, base }) {
  const assetsDir = path.join(deckDir, config.assets);
  const entry = mode === 'present' ? 'present.html' : 'index.html';

  return {
    root: viewerDir,
    // A built deck uses relative URLs so the output opens straight from disk.
    // A dev server, including the one behind rendering, always serves from root.
    base: base ?? (mode === 'present' ? './' : '/'),
    // Files dropped in the deck's assets directory are served from the root,
    // so `<img src="/logo.svg" />` works without an import.
    publicDir: fs.existsSync(assetsDir) ? assetsDir : false,
    configFile: false,
    // A deck is content, not an app. It has no environment to load.
    envDir: false,
    clearScreen: false,
    logLevel: 'warn',
    plugins: [react(), deckPlugin({ deckDir, config }), singleFilePlugin()],
    define: {
      __SM_MODE__: JSON.stringify(mode),
    },
    css: {
      // Slides are rendered at a fixed pixel size, so a style's px values
      // are deliberate. Nothing here should be rewritten.
      devSourcemap: true,
    },
    server: {
      fs: {
        // The viewer lives in the package, the slides live in the deck, and
        // Vite must be allowed to read both.
        allow: [packageRoot, deckDir],
      },
    },
    optimizeDeps: {
      // The deck's slides are outside the Vite root, so they are not crawled
      // for dependency discovery automatically.
      entries: [path.join(viewerDir, entry)],
      include: ['react', 'react-dom/client'],
    },
    build: {
      outDir: outDir || path.join(deckDir, 'dist'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.join(viewerDir, entry),
      },
    },
  };
}

/**
 * The Vite configuration behind `slide-maker browse`.
 *
 * Shares the viewer root and the alias set with a deck, but pulls in the
 * template library instead of a deck's slides. `deckDir` is optional: browsing
 * from a deck adds the option of dropping a template straight into it, and
 * browsing from anywhere else still works.
 */
export function createBrowseViteConfig({ deckDir }) {
  return {
    root: viewerDir,
    base: '/',
    publicDir: false,
    configFile: false,
    envDir: false,
    clearScreen: false,
    logLevel: 'warn',
    plugins: [react(), libraryPlugin({ deckDir })],
    define: {
      __SM_MODE__: JSON.stringify('browse'),
    },
    server: {
      fs: {
        allow: [packageRoot, ...(deckDir ? [deckDir] : [])],
      },
    },
    optimizeDeps: {
      entries: [path.join(viewerDir, 'browse.html')],
      include: ['react', 'react-dom/client'],
    },
  };
}
