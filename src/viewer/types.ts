import type { ComponentType } from 'react';

export interface DeckConfig {
  title: string;
  author: string;
  template: string;
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

export interface TemplateInfo {
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
  templates: TemplateInfo[];
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
