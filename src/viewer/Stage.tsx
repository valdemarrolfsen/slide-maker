import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

interface StageProps {
  width: number;
  height: number;
  /** Space to leave around the slide, in viewport pixels. */
  padding?: number;
  /** Never scale above this. Presenting wants 1, the studio wants a little headroom. */
  maxScale?: number;
  /** The slide itself. */
  children: ReactNode;
  /**
   * Layers drawn over the slide. Rendered as a sibling of the scaled frame,
   * not inside it, so overlay type stays at its natural size at any zoom.
   * Position children with percentages taken from a comment's 0..1 anchor.
   */
  overlay?: ReactNode;
  /** Gives the parent access to the unscaled slide box for coordinate maths. */
  frameRef?: RefObject<HTMLDivElement | null>;
  onScaleChange?: (scale: number) => void;
  className?: string;
}

/**
 * Scales a fixed-size slide to fit the available space.
 *
 * The slide is always laid out at its true pixel size and scaled with a
 * transform, never reflowed. That is what makes what you see here identical to
 * the exported PDF, and it keeps comment anchors valid at any window size,
 * since a point on the slide has one set of coordinates regardless of zoom.
 */
export function Stage({
  width,
  height,
  padding = 48,
  maxScale = 1,
  children,
  overlay,
  frameRef,
  onScaleChange,
  className,
}: StageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const fit = () => {
      const box = host.getBoundingClientRect();
      const available = {
        w: Math.max(0, box.width - padding * 2),
        h: Math.max(0, box.height - padding * 2),
      };
      const next = Math.min(available.w / width, available.h / height, maxScale);
      setScale(next > 0 ? next : 0.01);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host);
    return () => observer.disconnect();
  }, [width, height, padding, maxScale]);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  return (
    <div ref={hostRef} className={`sm-stage${className ? ` ${className}` : ''}`}>
      <div
        className="sm-stage-box"
        style={{ width: width * scale, height: height * scale }}
        data-scale={scale}
      >
        <div
          ref={frameRef}
          className="sm-stage-frame"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
        {overlay && <div className="sm-stage-overlay">{overlay}</div>}
      </div>
    </div>
  );
}
