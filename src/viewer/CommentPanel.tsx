import { useMemo, useState } from 'react';
import type { Comment, SlideEntry } from './types';

type Filter = 'open' | 'resolved' | 'all';

interface CommentPanelProps {
  comments: Comment[];
  slides: SlideEntry[];
  selectedId: string | null;
  onSelect: (comment: Comment) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
  onClearResolved: () => void;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Renders open comments as a markdown brief.
 *
 * The escape hatch for anyone who has not wired up MCP: paste this into the
 * Claude Code terminal and it has everything it needs, including the file each
 * note belongs to and the exact text to search for.
 */
function toMarkdown(comments: Comment[]): string {
  if (!comments.length) return 'No open comments.';
  const lines = ['Feedback on the deck:', ''];
  for (const c of comments) {
    lines.push(`- **${c.slideFile}** (slide ${c.slideNumber})`);
    if (c.quote) lines.push(`  - on the text: "${c.quote}"`);
    lines.push(`  - ${c.body}`);
  }
  lines.push('', 'Please apply these, then mark them resolved.');
  return lines.join('\n');
}

export function CommentPanel({
  comments,
  slides,
  selectedId,
  onSelect,
  onResolve,
  onReopen,
  onDelete,
  onClearResolved,
}: CommentPanelProps) {
  const [filter, setFilter] = useState<Filter>('open');
  const [copied, setCopied] = useState(false);

  const counts = useMemo(
    () => ({
      open: comments.filter((c) => c.status === 'open').length,
      resolved: comments.filter((c) => c.status === 'resolved').length,
      all: comments.length,
    }),
    [comments],
  );

  const slideOrder = useMemo(() => new Map(slides.map((s) => [s.id, s.index])), [slides]);

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? comments : comments.filter((c) => c.status === filter);
    // Deck order first, then oldest note first within a slide, which is the
    // order you would work through them.
    return [...filtered].sort((a, b) => {
      const byDeck = (slideOrder.get(a.slideId) ?? 0) - (slideOrder.get(b.slideId) ?? 0);
      if (byDeck !== 0) return byDeck;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [comments, filter, slideOrder]);

  const copyForClaude = async () => {
    const open = comments.filter((c) => c.status === 'open');
    try {
      await navigator.clipboard.writeText(toMarkdown(open));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* Clipboard is unavailable over plain http on some browsers. */
    }
  };

  return (
    <aside className="sm-panel">
      <header className="sm-panel-head">
        <div className="sm-tabs" role="tablist">
          {(['open', 'resolved', 'all'] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={`sm-tab${filter === key ? ' sm-tab-on' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key[0].toUpperCase() + key.slice(1)}
              <span className="sm-tab-count">{counts[key]}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="sm-panel-actions">
        <button type="button" className="sm-btn sm-btn-ghost" onClick={copyForClaude}>
          {copied ? 'Copied' : 'Copy for Claude'}
        </button>
        {counts.resolved > 0 && (
          <button type="button" className="sm-btn sm-btn-ghost" onClick={onClearResolved}>
            Clear resolved
          </button>
        )}
      </div>

      <div className="sm-panel-list">
        {visible.length === 0 && (
          <div className="sm-empty">
            <p className="sm-empty-title">
              {filter === 'open' ? 'Nothing outstanding' : 'Nothing here'}
            </p>
            <p className="sm-empty-body">
              Select text on a slide to comment on it, or press <kbd>C</kbd> to leave a note about
              the whole slide.
            </p>
          </div>
        )}

        {visible.map((comment) => (
          <article
            key={comment.id}
            className={[
              'sm-comment',
              comment.status === 'resolved' && 'sm-comment-resolved',
              comment.id === selectedId && 'sm-comment-active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(comment)}
          >
            <div className="sm-comment-meta">
              <span className="sm-comment-slide">
                {String(comment.slideNumber ?? 0).padStart(2, '0')} · {comment.slideFile}
              </span>
              <span className="sm-comment-time">{timeAgo(comment.createdAt)}</span>
            </div>

            {comment.quote && <div className="sm-comment-quote">{comment.quote}</div>}
            <p className="sm-comment-body">{comment.body}</p>
            {comment.resolution && (
              <p className="sm-comment-resolution">
                <span>Claude:</span> {comment.resolution}
              </p>
            )}

            <div className="sm-comment-actions">
              {comment.status === 'open' ? (
                <button
                  type="button"
                  className="sm-btn sm-btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolve(comment.id);
                  }}
                >
                  Resolve
                </button>
              ) : (
                <button
                  type="button"
                  className="sm-btn sm-btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReopen(comment.id);
                  }}
                >
                  Reopen
                </button>
              )}
              <button
                type="button"
                className="sm-btn sm-btn-ghost sm-btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(comment.id);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
