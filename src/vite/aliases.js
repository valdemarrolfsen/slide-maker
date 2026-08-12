import { createRequire } from 'node:module';
import { runtimeEntry } from '../core/paths.js';

const require = createRequire(import.meta.url);

/**
 * Aliases that make slide sources resolvable from anywhere on disk.
 *
 * A deck is content, not a project: it has no package.json and no node_modules,
 * and the same is true of the template library inside this package once it is
 * installed somewhere else. Slide files still compile to JSX runtime imports,
 * and resolution for those starts from the slide's own directory, so without
 * these a slide outside the Vite root fails to build. Pinning React here also
 * guarantees one React instance even if a deck happens to sit inside another
 * project that has its own copy.
 *
 * The array form matters: object-form aliases match as prefixes, so a `react`
 * key would also swallow `react-dom`.
 */
export function resolveAliases(deckDir) {
  const pinned = [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ];
  return [
    { find: /^slide-maker\/runtime$/, replacement: runtimeEntry },
    ...(deckDir
      ? [
          { find: /^@deck$/, replacement: deckDir },
          { find: /^@deck\//, replacement: `${deckDir}/` },
        ]
      : []),
    ...pinned.map((id) => ({
      find: new RegExp(`^${id.replace(/[/\\]/g, '\\$&')}$`),
      replacement: require.resolve(id),
    })),
  ];
}
