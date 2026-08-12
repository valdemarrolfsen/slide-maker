/**
 * Turning a browser selection into something Claude can act on.
 *
 * JSX compiles away, so there is no reliable mapping from a DOM range back to
 * a character offset in the slide's source file. Instead a comment carries the
 * selected text plus the text either side of it, which is enough for a plain
 * search of the source to land on the right spot even when the same words
 * appear more than once.
 */

const CONTEXT_CHARS = 90;

export interface Captured {
  /** Whitespace-collapsed text that was selected. */
  quote: string;
  context: { before: string; after: string };
  /** The live DOM range, kept only long enough to highlight the draft. */
  range: Range;
  /**
   * Position on the slide in 0..1 coordinates. Normalised rather than absolute
   * so a pin lands in the same place at any window size, and so the overlay can
   * position it with plain percentages.
   */
  anchor: { x: number; y: number };
}

/**
 * Collapses runs of whitespace to single spaces.
 *
 * Source JSX is indented, so the DOM carries newlines and tabs that are not
 * part of the sentence. Storing the collapsed form is what makes the quote
 * searchable against the original file.
 */
function squish(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Converts a viewport rectangle into unscaled stage coordinates. */
function toStageBox(frame: HTMLElement, rect: DOMRect, width: number) {
  const frameRect = frame.getBoundingClientRect();
  const scale = frameRect.width / width || 1;
  return {
    x: (rect.left - frameRect.left) / scale,
    y: (rect.top - frameRect.top) / scale,
    w: rect.width / scale,
    h: rect.height / scale,
  };
}

/** Reads the current selection, or null if there is nothing usable inside the slide. */
export function captureSelection(
  frame: HTMLElement | null,
  width: number,
  height: number,
): Captured | null {
  if (!frame) return null;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!frame.contains(range.commonAncestorContainer)) return null;

  const quote = squish(range.toString());
  if (!quote) return null;

  // Measure the selection's start against the slide's full text to find the
  // surrounding context.
  const probe = document.createRange();
  probe.selectNodeContents(frame);
  probe.setEnd(range.startContainer, range.startOffset);
  const start = probe.toString().length;

  const full = frame.textContent ?? '';
  const rawQuoteLength = range.toString().length;

  const box = toStageBox(frame, range.getBoundingClientRect(), width);

  return {
    quote,
    range: range.cloneRange(),
    context: {
      before: squish(full.slice(Math.max(0, start - CONTEXT_CHARS), start)),
      after: squish(full.slice(start + rawQuoteLength, start + rawQuoteLength + CONTEXT_CHARS)),
    },
    anchor: {
      x: clamp01((box.x + box.w / 2) / width),
      y: clamp01((box.y + box.h) / height),
    },
  };
}

const DRAFT_HIGHLIGHT = 'sm-comment-selection';

/** Keeps the captured words highlighted while focus is in the comment box. */
export function highlightSelection(range: Range) {
  CSS.highlights?.set(DRAFT_HIGHLIGHT, new Highlight(range));
}

/** Removes the persistent draft highlight. */
export function clearSelectionHighlight() {
  CSS.highlights?.delete(DRAFT_HIGHLIGHT);
}

/** Reads a click position on the slide, for a comment pinned to a spot. */
export function capturePoint(
  frame: HTMLElement | null,
  event: { clientX: number; clientY: number },
  width: number,
  height: number,
): Pick<Captured, 'anchor'> | null {
  if (!frame) return null;
  const frameRect = frame.getBoundingClientRect();
  const scale = frameRect.width / width || 1;
  const x = (event.clientX - frameRect.left) / scale;
  const y = (event.clientY - frameRect.top) / scale;
  if (x < 0 || y < 0 || x > width || y > height) return null;
  return { anchor: { x: clamp01(x / width), y: clamp01(y / height) } };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Removes the current selection, once a comment has been captured from it. */
export function clearSelection() {
  window.getSelection()?.removeAllRanges();
}
