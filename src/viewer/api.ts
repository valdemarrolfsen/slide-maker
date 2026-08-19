import type { Comment, DeckState } from './types';

const BASE = '/__slide-maker/api';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed: ${res.status}`);
  return data as T;
}

export function fetchState() {
  return request<DeckState>(`${BASE}/state`);
}

export function fetchComments() {
  return request<{ comments: Comment[] }>(`${BASE}/comments`);
}

export function setStyle(name: string) {
  return request<{ style: string }>(`${BASE}/style`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/** Appends a slide to the deck from its template's default-slide set. */
export function addSlide(defaultSlide: string) {
  return request<{ file: string }>(`${BASE}/slides`, {
    method: 'POST',
    body: JSON.stringify({ defaultSlide }),
  });
}

/** Includes or omits a slide from presentation and export. */
export function setSlideHidden(file: string, hidden: boolean) {
  return request<{ file: string; hidden: boolean }>(`${BASE}/slides/visibility`, {
    method: 'POST',
    body: JSON.stringify({ file, hidden }),
  });
}

/** Saves one piece of rendered copy back to its literal in the slide source. */
export function updateText(
  file: string,
  input: { oldText: string; newText: string; occurrence: number },
) {
  return request<{ ok: boolean }>(`${BASE}/text`, {
    method: 'POST',
    body: JSON.stringify({ file, ...input }),
  });
}

/** Renders the current deck and lets the browser save it as a PDF. */
export async function exportPdf(): Promise<void> {
  const res = await fetch(`${BASE}/export/pdf`, { method: 'POST' });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Export failed: ${res.status}`);
  }

  const disposition = res.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'deck.pdf';
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari can cancel a download when its object URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function createComment(input: Record<string, unknown>) {
  return request<{ comment: Comment }>(`${BASE}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function resolveComment(id: string, resolution?: string) {
  return request<{ comment: Comment }>(`${BASE}/comments/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution }),
  });
}

export function reopenComment(id: string) {
  return request<{ comment: Comment }>(`${BASE}/comments/${id}/reopen`, { method: 'POST' });
}

export function deleteComment(id: string) {
  return request<{ ok: boolean }>(`${BASE}/comments/${id}`, { method: 'DELETE' });
}

export function clearResolved() {
  return request<{ removed: number }>(`${BASE}/comments/clear-resolved`, { method: 'POST' });
}

/** Records which slide is on screen, so Claude can ask what you are looking at. */
export function reportView(slideIndex: number, slideId: string) {
  return request<{ ok: boolean }>(`${BASE}/view`, {
    method: 'POST',
    body: JSON.stringify({ slideIndex, slideId }),
  }).catch(() => ({ ok: false }));
}

/**
 * Subscribes to comment changes over Vite's HMR socket.
 *
 * Reusing the dev server's existing connection means comments resolved by
 * Claude in another process show up here without a second websocket.
 */
export function onCommentsChanged(cb: (comments: Comment[]) => void): () => void {
  if (!import.meta.hot) return () => {};
  const handler = (data: { comments: Comment[] }) => cb(data.comments);
  import.meta.hot.on('slide-maker:comments', handler);
  return () => import.meta.hot?.off('slide-maker:comments', handler);
}
