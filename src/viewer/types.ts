import type { ComponentType } from 'react';

export interface DeckConfig {
  title: string;
  author: string;
  /** Name of the design system the deck wears. */
  style: string;
  width: number;
  height: number;
  slides: string;
  assets: string;
}

export interface SlideEntry {
  id: string;
  index: number;
  number: number;
  /** Deck-relative source path, which is what a comment points Claude at. */
  file: string;
  name: string;
  module: { default?: ComponentType };
}

export type CommentKind = 'selection' | 'pin' | 'slide';
export type CommentStatus = 'open' | 'resolved';

export interface Comment {
  id: string;
  kind: CommentKind;
  slideId: string;
  slideFile: string;
  slideNumber: number | null;
  body: string;
  /** The exact text that was selected, when the comment came from a selection. */
  quote: string | null;
  /** Text on either side of the quote, so a search for it stays unambiguous. */
  context: { before: string; after: string } | null;
  /** Position on the slide in 0..1 coordinates, independent of stage scale. */
  anchor: { x: number; y: number } | null;
  status: CommentStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface StyleInfo {
  name: string;
  label: string;
  description: string;
  tags: string[];
  dark: boolean;
  guidance: string;
  source: 'builtin' | 'local';
}

export interface DeckState {
  deckDir: string;
  config: DeckConfig;
  slides: Array<Omit<SlideEntry, 'module'>>;
  comments: Comment[];
  styles: StyleInfo[];
}

/* ── The template library, as `slide-maker browse` sees it ─────── */

export interface LibraryTemplate {
  name: string;
  label: string;
  description: string;
  tags: string[];
  guidance: string;
  /** Filename stem to use when the template lands in a deck. */
  stem: string;
  origin: 'builtin' | 'local';
  module: { default?: ComponentType };
  /** The template's own source, for the copy button. */
  jsx: string;
}

export interface LibraryStyle {
  name: string;
  label: string;
  description: string;
  tags: string[];
  dark: boolean;
  guidance: string;
  origin: 'builtin' | 'local';
  /** The stylesheet as text, so it can be injected into a preview document. */
  css: string;
}

export interface LibraryDeck {
  dir: string;
  title: string;
  style: string;
}

export interface DraftComment {
  kind: CommentKind;
  slideId: string;
  slideFile: string;
  slideNumber: number;
  quote?: string | null;
  context?: { before: string; after: string } | null;
  anchor: { x: number; y: number };
}
