import type { Comment } from './types';

interface PinsProps {
  comments: Comment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Numbered markers for every comment anchored to a position on this slide.
 *
 * Numbering is per slide and follows creation order, so the marker on the
 * slide and the entry in the side panel always carry the same number.
 */
export function Pins({ comments, selectedId, onSelect }: PinsProps) {
  return (
    <>
      {comments.map((comment, i) => {
        if (!comment.anchor) return null;
        return (
          <button
            key={comment.id}
            type="button"
            className={[
              'sm-pin',
              comment.status === 'resolved' && 'sm-pin-resolved',
              comment.id === selectedId && 'sm-pin-active',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ left: `${comment.anchor.x * 100}%`, top: `${comment.anchor.y * 100}%` }}
            title={comment.body}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(comment.id);
            }}
          >
            {i + 1}
          </button>
        );
      })}
    </>
  );
}
