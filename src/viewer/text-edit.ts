export interface TextEditInput {
  oldText: string;
  newText: string;
  occurrence: number;
}

function squish(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function caretAtPoint(x: number, y: number): { node: Text; offset: number } | null {
  const documentWithCaret = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const position = documentWithCaret.caretPositionFromPoint?.(x, y);
  if (position?.offsetNode.nodeType === Node.TEXT_NODE) {
    return { node: position.offsetNode as Text, offset: position.offset };
  }
  const range = documentWithCaret.caretRangeFromPoint?.(x, y);
  if (range?.startContainer.nodeType === Node.TEXT_NODE) {
    return { node: range.startContainer as Text, offset: range.startOffset };
  }
  return null;
}

function matchingOccurrence(frame: HTMLElement, target: Text, value: string): number {
  const wanted = squish(value);
  const walker = document.createTreeWalker(frame, NodeFilter.SHOW_TEXT);
  let occurrence = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node === target) return occurrence;
    if (squish(node.textContent || '') === wanted) occurrence += 1;
  }
  return occurrence;
}

function placeCaret(element: HTMLElement, offset: number) {
  const node = element.firstChild;
  if (!node) return;
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(node, Math.max(0, Math.min(offset, node.textContent?.length || 0)));
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/**
 * Manages the one inline text editor allowed on the active stage.
 *
 * The wrapper is temporary and never enters React state. This keeps typing
 * immediate and lets the normal source-file HMR update be the final render.
 */
export function createTextEditor(
  frame: HTMLElement,
  event: { clientX: number; clientY: number },
  save: (input: TextEditInput) => Promise<unknown>,
  onError: (message: string | null) => void,
): (() => void) | null {
  const point = caretAtPoint(event.clientX, event.clientY);
  if (!point || !frame.contains(point.node)) return null;
  if (point.node.parentElement?.closest('.sm-chrome')) return null;

  const raw = point.node.data;
  const leading = raw.match(/^\s*/)?.[0].length || 0;
  const trailing = raw.match(/\s*$/)?.[0].length || 0;
  const end = raw.length - trailing;
  if (end <= leading) return null;

  const original = raw.slice(leading, end);
  const occurrence = matchingOccurrence(frame, point.node, original);
  const svgText = point.node.parentElement instanceof SVGElement;

  if (svgText) {
    const range = document.createRange();
    range.selectNode(point.node);
    const box = range.getBoundingClientRect();
    const computed = getComputedStyle(point.node.parentElement!);
    const input = document.createElement('input');
    input.className = 'sm-text-editor sm-text-editor-overlay';
    input.value = original;
    input.setAttribute('aria-label', 'Edit slide text');
    Object.assign(input.style, {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${Math.max(48, box.width + 18)}px`,
      height: `${Math.max(22, box.height + 8)}px`,
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      color: computed.color,
    });
    document.body.appendChild(input);

    let done = false;
    const finish = (shouldSave: boolean) => {
      if (done) return;
      done = true;
      const next = input.value;
      input.remove();
      onError(null);
      if (shouldSave && next !== original) {
        save({ oldText: original, newText: next, occurrence }).catch((error) => {
          onError(error instanceof Error ? error.message : 'Could not save this text');
        });
      }
    };
    input.addEventListener('blur', () => finish(true), { once: true });
    input.addEventListener('keydown', (keyEvent) => {
      if (keyEvent.key === 'Escape') {
        keyEvent.preventDefault();
        finish(false);
      } else if (keyEvent.key === 'Enter') {
        keyEvent.preventDefault();
        finish(true);
      }
    });
    input.focus({ preventScroll: true });
    input.setSelectionRange(
      Math.max(0, point.offset - leading),
      Math.max(0, point.offset - leading),
    );
    onError(null);
    return () => finish(false);
  }

  // Split from the end so the clicked text remains the middle node.
  if (end < point.node.length) point.node.splitText(end);
  const editableNode = leading > 0 ? point.node.splitText(leading) : point.node;
  const editor = document.createElement('span');
  editor.className = 'sm-text-editor';
  editor.contentEditable = 'plaintext-only';
  editor.spellcheck = true;
  editor.textContent = original;
  editor.setAttribute('role', 'textbox');
  editor.setAttribute('aria-label', 'Edit slide text');
  editableNode.replaceWith(editor);

  let done = false;
  const finish = (shouldSave: boolean) => {
    if (done) return;
    done = true;
    const next = (editor.innerText || editor.textContent || '').replace(/\r\n/g, '\n');
    const finalNode = document.createTextNode(shouldSave ? next : original);
    editor.replaceWith(finalNode);
    onError(null);
    if (shouldSave && next !== original) {
      save({ oldText: original, newText: next, occurrence }).catch((error) => {
        finalNode.data = original;
        onError(error instanceof Error ? error.message : 'Could not save this text');
      });
    }
  };

  editor.addEventListener('blur', () => finish(true), { once: true });
  editor.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key === 'Escape') {
      keyEvent.preventDefault();
      finish(false);
      return;
    }
    if (keyEvent.key === 'Enter' && (!keyEvent.shiftKey || keyEvent.metaKey || keyEvent.ctrlKey)) {
      keyEvent.preventDefault();
      finish(true);
    }
  });

  editor.focus({ preventScroll: true });
  placeCaret(editor, point.offset - leading);
  onError(null);
  return () => finish(false);
}
