/**
 * Programmatic entry point.
 *
 * Exposed so a deck can be driven from a script or another tool rather than
 * only from the CLI, for example to build decks in CI.
 */
export { createViteConfig } from './vite/config.js';
export { deckPlugin } from './vite/plugin-deck.js';
export { readConfig, writeConfig, listSlides, readSlide, defaults } from './core/deck.js';
export { listStyles, resolveStyle } from './core/styles.js';
export { listTemplates, resolveTemplate } from './core/templates.js';
export {
  listDefaultSlides,
  resolveDefaultSlide,
  readDefaultSlideSource,
} from './core/default-slides.js';
export {
  listComments,
  addComment,
  resolveComment,
  reopenComment,
  deleteComment,
  clearResolved,
  formatComments,
} from './core/comments.js';
export { renderSlides, renderPdf, closeRenderer } from './render/renderer.js';
export { startMcpServer } from './mcp/server.js';
