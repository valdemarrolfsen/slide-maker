/**
 * Folds the built deck into one HTML file.
 *
 * A deck is something you send to someone. An ordinary Vite build is an
 * index.html plus a directory of module scripts, which browsers refuse to load
 * over file://, so double-clicking it produces a blank page. Inlining the
 * script and the stylesheet, and building to a classic IIFE rather than a
 * module, makes the output work from disk, from a share drive, or as an email
 * attachment with nothing else alongside it.
 */
export function singleFilePlugin() {
  return {
    name: 'slide-maker:single-file',
    enforce: 'post',
    apply: 'build',

    config() {
      return {
        build: {
          // One stylesheet and one script, so there is exactly one of each to
          // fold in below.
          cssCodeSplit: false,
          // A module script cannot run from file://. Classic scripts can.
          rollupOptions: {
            output: { format: 'iife' },
          },
          // Images become data URIs rather than sibling files. A deck that is
          // one file is worth more than a deck that is a few hundred KB smaller.
          assetsInlineLimit: 100 * 1024 * 1024,
        },
      };
    },

    generateBundle(_options, bundle) {
      const entries = Object.entries(bundle);
      const html = entries.find(([name]) => name.endsWith('.html'));
      if (!html) return;

      const [, htmlAsset] = html;
      let source = String(htmlAsset.source);

      const scripts = [];

      for (const [name, output] of entries) {
        if (name.endsWith('.js') && output.type === 'chunk') {
          // Vite hoists the entry into <head>, which is harmless for a module
          // script because those are deferred. A classic script is not, so it
          // has to move to the end of the body or it runs before #root exists.
          source = source.replace(
            new RegExp(`<script[^>]*src="[^"]*${escapeRegExp(name)}"[^>]*></script>`),
            '',
          );
          scripts.push(output.code);
          delete bundle[name];
        } else if (name.endsWith('.css') && output.type === 'asset') {
          const css = closeTagSafe(String(output.source), 'style');
          source = source.replace(
            new RegExp(`<link[^>]*href="[^"]*${escapeRegExp(name)}"[^>]*>`),
            () => `<style>\n${css}\n</style>`,
          );
          delete bundle[name];
        }
      }

      // Preload hints point at files that no longer exist.
      source = source.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');

      const inlined = scripts
        .map((code) => `<script>\n${closeTagSafe(code, 'script')}\n</script>`)
        .join('\n');
      // Function replacement, not a string: bundled React is full of `$`
      // sequences, which a string replacement would read as $& and $' patterns
      // and mangle into a syntax error.
      source = source.includes('</body>')
        ? source.replace('</body>', () => `${inlined}\n</body>`)
        : source + inlined;

      htmlAsset.source = source;
    },
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Stops a closing tag inside inlined content from ending the element early.
 *
 * The HTML parser looks for the literal characters and does not care that they
 * sit inside a JavaScript string. A backslash is inert in both JS and CSS at
 * that position, so this changes nothing about how the content runs.
 */
function closeTagSafe(content, tag) {
  return content.replace(new RegExp(`</(${tag})`, 'gi'), '<\\/$1');
}
