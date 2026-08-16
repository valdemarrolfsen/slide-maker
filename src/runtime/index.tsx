/**
 * slide-maker runtime.
 *
 * The component contract that every style dresses. Slides are plain JSX, but
 * they compose these primitives instead of bespoke markup, which is what makes
 * a deck swappable between styles: the runtime owns structure and semantics,
 * the style owns tokens and looks.
 *
 * Every element carries an `sm-` prefixed class. A style restyles a deck by
 * redefining CSS custom properties and, where it wants to go further, by
 * overriding those classes.
 */
import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from 'react';

/* ── Slide context ─────────────────────────────────────────────── */

export interface SlideMeta {
  /** Zero-based position in the deck. */
  index: number;
  /** Total slides in the deck. */
  total: number;
  /** Deck title, shown in slide chrome by default. */
  deckTitle: string;
  /** Stable id, derived from the slide's filename. */
  id: string;
}

const defaultMeta: SlideMeta = { index: 0, total: 1, deckTitle: '', id: 'slide' };

export const SlideContext = createContext<SlideMeta>(defaultMeta);

/** Read the current slide's position and deck metadata. */
export function useSlide(): SlideMeta {
  return useContext(SlideContext);
}

/* ── Utilities ─────────────────────────────────────────────────── */

type ClassInput = string | false | null | undefined;

function cx(...parts: ClassInput[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Zero-pads a slide number so 3 renders as "03". */
export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface Base {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/* ── Frame ─────────────────────────────────────────────────────── */

export interface SlideProps extends Base {
  /** Flip this slide to the style's dark palette. */
  dark?: boolean;
  /** Draw the style's ruled grid backdrop behind the content. */
  grid?: boolean;
  /** Hide the footer bar. Cover and section slides usually want this. */
  bare?: boolean;
  /** Overrides the left-hand footer label. Defaults to the deck title. */
  label?: string;
  /** Speaker notes. Never rendered on the slide, shown in presenter mode. */
  notes?: string;
  /** Vertically centre the slide's content within the frame. */
  center?: boolean;
}

/**
 * The 1280x720 slide frame. Fixed pixel dimensions on purpose: the stage
 * scales the whole frame with a CSS transform, so a slide looks identical at
 * any window size and in export, and comment anchors stay stable.
 */
export function Slide({
  dark,
  grid,
  bare,
  label,
  notes,
  center,
  className,
  style,
  children,
}: SlideProps) {
  const meta = useSlide();
  return (
    <section
      className={cx('sm-slide', dark && 'sm-dark', center && 'sm-slide-center', className)}
      style={style}
      data-slide-id={meta.id}
      data-notes={notes || undefined}
    >
      {grid && <div className="sm-gridbg" aria-hidden="true" />}
      {children}
      {!bare && (
        <div className="sm-chrome">
          <span className="sm-chrome-mark">{label ?? meta.deckTitle}</span>
          <span className="sm-chrome-no">{pad(meta.index + 1)}</span>
        </div>
      )}
    </section>
  );
}

/**
 * Reserves a consistent block of height for the eyebrow plus heading, so
 * headings sit on the same baseline across slides even when one wraps.
 */
export function Head({ tall, className, style, children }: Base & { tall?: boolean }) {
  return (
    <div className={cx('sm-head', tall && 'sm-head-tall', className)} style={style}>
      {children}
    </div>
  );
}

/** Absorbs leftover height and centres its content in the remaining space. */
export function Fill({ className, style, children }: Base) {
  return (
    <div className={cx('sm-fill', className)} style={style}>
      {children}
    </div>
  );
}

/** Absorbs leftover height without centring, so children stretch to fill it. */
export function Grow({ className, style, children }: Base) {
  return (
    <div className={cx('sm-grow', className)} style={style}>
      {children}
    </div>
  );
}

/* ── Type ──────────────────────────────────────────────────────── */

/** Small uppercase mono label above a heading. */
export function Eyebrow({ className, style, children }: Base) {
  return (
    <div className={cx('sm-eyebrow', className)} style={style}>
      {children}
    </div>
  );
}

/** Like Eyebrow but tighter, for labelling a card rather than a slide. */
export function Kicker({ accent, className, style, children }: Base & { accent?: boolean }) {
  return (
    <div className={cx('sm-kicker', accent && 'sm-accent', className)} style={style}>
      {children}
    </div>
  );
}

export interface TitleProps extends Base {
  /** Type scale. `big` for section openers, `huge` for the cover. */
  size?: 'default' | 'big' | 'huge';
  /** Drop the measure limit and let the heading run the full slide width. */
  wide?: boolean;
  /** Custom measure, for example `"38ch"`. */
  measure?: string;
  /** Render as h1 instead of h2. Use once, on the cover. */
  as?: 'h1' | 'h2';
}

/** The slide's heading. */
export function Title({
  size = 'default',
  wide,
  measure,
  as: Tag = 'h2',
  className,
  style,
  children,
}: TitleProps) {
  return (
    <Tag
      className={cx('sm-title', size !== 'default' && `sm-title-${size}`, wide && 'sm-wide', className)}
      style={measure ? { maxWidth: measure, ...style } : style}
    >
      {children}
    </Tag>
  );
}

/** Supporting paragraph under a heading. */
export function Lede({ className, style, children }: Base) {
  return (
    <p className={cx('sm-lede', className)} style={style}>
      {children}
    </p>
  );
}

/** One-line supporting text inside a card. Smaller and tighter than Lede. */
export function Line({ className, style, children }: Base) {
  return (
    <p className={cx('sm-line', className)} style={style}>
      {children}
    </p>
  );
}

/** A single large claim, for slides that carry one idea. */
export function Statement({ className, style, children }: Base) {
  return (
    <p className={cx('sm-statement', className)} style={style}>
      {children}
    </p>
  );
}

/** Short accent rule, typically under a cover title. */
export function Rule({ className, style }: Omit<Base, 'children'>) {
  return <div className={cx('sm-rule', className)} style={style} />;
}

/** Outlined pill with a leading accent dot. */
export function Track({ className, style, children }: Base) {
  return (
    <div className={cx('sm-track', className)} style={style}>
      <i />
      {children}
    </div>
  );
}

/** Uppercase mono status chip. */
export function Badge({
  tone = 'muted',
  className,
  style,
  children,
}: Base & { tone?: 'accent' | 'strong' | 'muted' | 'outline' }) {
  return (
    <span className={cx('sm-badge', `sm-badge-${tone}`, className)} style={style}>
      {children}
    </span>
  );
}

/* ── Grids and cards ───────────────────────────────────────────── */

export interface GridProps extends Base {
  /** Number of equal columns. */
  cols?: 1 | 2 | 3 | 4 | 5;
  /** Stretch to fill the slide's leftover height. */
  grow?: boolean;
  /** Vertically centre each cell's content. Best for single-line rows. */
  mid?: boolean;
}

/**
 * The hairline grid: one border around the whole block and 1px gaps between
 * cells, so the dividers read as rules rather than as separate boxes.
 */
export function Grid({ cols = 3, grow, mid, className, style, children }: GridProps) {
  return (
    <div
      className={cx('sm-grid', `sm-c${cols}`, grow && 'sm-grow', mid && 'sm-mid', className)}
      style={style}
    >
      {children}
    </div>
  );
}

/** A cell inside Grid. */
export function Cell({ pad, className, style, children }: Base & { pad?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={cx('sm-cell', pad && `sm-pad-${pad}`, className)} style={style}>
      {children}
    </div>
  );
}

/** Heading inside a cell or card. */
export function CardTitle({ small, className, style, children }: Base & { small?: boolean }) {
  return (
    <h3 className={cx('sm-card-title', small && 'sm-sm', className)} style={style}>
      {children}
    </h3>
  );
}

/** A standalone outlined card, outside the hairline grid. */
export function Card({ fill, className, style, children }: Base & { fill?: boolean }) {
  return (
    <div className={cx('sm-card', fill && 'sm-fillbg', className)} style={style}>
      {children}
    </div>
  );
}

export interface ColumnsProps extends Base {
  /** CSS grid-template-columns value. Defaults to two equal columns. */
  ratio?: string;
  /** Gap between columns in pixels. */
  gap?: number;
}

/** Free-standing columns with no dividers. */
export function Columns({ ratio = '1fr 1fr', gap = 40, className, style, children }: ColumnsProps) {
  return (
    <div
      className={cx('sm-columns', className)}
      style={{ gridTemplateColumns: ratio, gap, ...style }}
    >
      {children}
    </div>
  );
}

/** A column inside Columns. */
export function Column({ className, style, children }: Base) {
  return (
    <div className={cx('sm-column', className)} style={style}>
      {children}
    </div>
  );
}

/* ── Lists ─────────────────────────────────────────────────────── */

/** Dash-marked list. Pass Tick children. */
export function Ticks({ className, style, children }: Base) {
  return (
    <ul className={cx('sm-ticks', className)} style={style}>
      {children}
    </ul>
  );
}

/** One item in a Ticks list. */
export function Tick({ className, style, children }: Base) {
  return (
    <li className={cx('sm-tick', className)} style={style}>
      {children}
    </li>
  );
}

export interface StepProps extends Base {
  /** Step number. Rendered zero-padded in the mono rail. */
  n: number | string;
  /** The step's label. */
  title: ReactNode;
  /** Optional right-hand marker, for example "We are here". */
  badge?: ReactNode;
  /** Highlight this step as the current one. */
  current?: boolean;
}

/** Numbered rail of steps. Pass Step children. */
export function Steps({ className, style, children }: Base) {
  return (
    <Grid cols={1} grow mid className={cx('sm-steps', className)} style={style}>
      {children}
    </Grid>
  );
}

/** One row in a Steps rail. */
export function Step({ n, title, badge, current, className, style, children }: StepProps) {
  return (
    <Cell className={cx('sm-step', current && 'sm-step-current', className)} style={style}>
      <div className="sm-step-row">
        <span className="sm-stepnum">{typeof n === 'number' ? pad(n) : n}</span>
        <CardTitle small className="sm-step-title">
          {title}
        </CardTitle>
        {badge ? (
          <Badge tone={current ? 'outline' : 'muted'}>{badge}</Badge>
        ) : (
          <span />
        )}
      </div>
      {children}
    </Cell>
  );
}

/* ── Data ──────────────────────────────────────────────────────── */

export interface StatProps extends Base {
  /** The number or short string to lead with. */
  value: ReactNode;
  /** What the number means. */
  label?: ReactNode;
  /** Tint the value with the style's accent. */
  accent?: boolean;
  /** Type scale for the value. */
  size?: 'default' | 'big';
}

/** A single figure with a caption. */
export function Stat({ value, label, accent, size = 'default', className, style }: StatProps) {
  return (
    <div className={cx('sm-stat', className)} style={style}>
      <div className={cx('sm-stat-v', size === 'big' && 'sm-stat-big', accent && 'sm-accent')}>
        {value}
      </div>
      {label && <div className="sm-stat-l">{label}</div>}
    </div>
  );
}

export interface BarDatum {
  label: ReactNode;
  value: number;
  display?: ReactNode;
  tone?: 'accent' | 'strong' | 'muted';
}

/** Compact horizontal bars for comparisons, rankings, and survey results. */
export function BarChart({
  data,
  max,
  title,
  className,
  style,
}: Omit<Base, 'children'> & { data: BarDatum[]; max?: number; title?: ReactNode }) {
  const ceiling = max || Math.max(1, ...data.map((item) => Math.abs(item.value)));
  return (
    <div className={cx('sm-bar-chart', className)} style={style}>
      {title && <div className="sm-chart-title">{title}</div>}
      <div className="sm-bar-chart-body">
        {data.map((item, index) => (
          <div className="sm-bar-row" key={index}>
            <div className="sm-bar-label">{item.label}</div>
            <div className="sm-bar-track">
              <div
                className={cx('sm-bar-fill', `sm-tone-${item.tone || 'accent'}`)}
                style={{ width: `${Math.min(100, (Math.abs(item.value) / ceiling) * 100)}%` }}
              />
            </div>
            <div className="sm-bar-value">{item.display ?? item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface LineSeries {
  name: string;
  values: number[];
  tone?: 'accent' | 'strong' | 'muted';
}

/** Small multi-series line chart with shared, automatically scaled axes. */
export function LineChart({
  series,
  labels = [],
  title,
  className,
  style,
}: Omit<Base, 'children'> & {
  series: LineSeries[];
  labels?: string[];
  title?: ReactNode;
}) {
  const values = series.flatMap((item) => item.values);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low || 1;
  const points = (items: number[]) =>
    items
      .map((value, index) => {
        const x = items.length === 1 ? 20 : 20 + (index / (items.length - 1)) * 360;
        const y = 154 - ((value - low) / span) * 124;
        return `${x},${y}`;
      })
      .join(' ');
  return (
    <div className={cx('sm-line-chart', className)} style={style}>
      {title && <div className="sm-chart-title">{title}</div>}
      <svg viewBox="0 0 400 180" role="img" aria-label={typeof title === 'string' ? title : 'Line chart'}>
        {[30, 61, 92, 123, 154].map((y) => <line key={y} x1="20" y1={y} x2="380" y2={y} className="sm-chart-gridline" />)}
        {series.map((item, index) => (
          <polyline key={item.name} points={points(item.values)} className={cx('sm-line-series', `sm-tone-${item.tone || (index ? 'strong' : 'accent')}`)} />
        ))}
        {labels.map((label, index) => {
          const x = labels.length === 1 ? 20 : 20 + (index / (labels.length - 1)) * 360;
          return <text key={label} x={x} y="176" textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}>{label}</text>;
        })}
      </svg>
      <div className="sm-chart-legend">
        {series.map((item, index) => <span key={item.name} className={cx(`sm-tone-${item.tone || (index ? 'strong' : 'accent')}`)}><i />{item.name}</span>)}
      </div>
    </div>
  );
}

/** Dense multi-column evidence table for analytical and reference slides. */
export function DataTable({
  columns,
  rows,
  className,
  style,
}: Omit<Base, 'children'> & { columns: ReactNode[]; rows: ReactNode[][] }) {
  const grid = { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` };
  return (
    <div className={cx('sm-data-table', className)} style={style}>
      <div className="sm-data-table-head" style={grid}>
        {columns.map((column, index) => <div key={index}>{column}</div>)}
      </div>
      {rows.map((row, rowIndex) => (
        <div className="sm-data-table-row" style={grid} key={rowIndex}>
          {row.map((cell, cellIndex) => <div key={cellIndex}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
}

/** Key/value panel, for metadata and specification blocks. */
export function Rows({ title, className, style, children }: Base & { title?: ReactNode }) {
  return (
    <div className={cx('sm-rows', className)} style={style}>
      {title && <div className="sm-rows-h">{title}</div>}
      {children}
    </div>
  );
}

/** One key/value pair inside Rows. */
export function Row({ k, className, style, children }: Base & { k: ReactNode }) {
  return (
    <div className={cx('sm-row', className)} style={style}>
      <div className="sm-row-k">{k}</div>
      <div className="sm-row-v">{children}</div>
    </div>
  );
}

export interface ChecklistProps extends Base {
  /** Column headings, rendered in the panel's header strip. */
  head?: [ReactNode, ReactNode];
  /** Summary strip pinned to the bottom of the panel. */
  foot?: [ReactNode, ReactNode];
}

/** Dense status table. Pass ChecklistRow children. */
export function Checklist({ head, foot, className, style, children }: ChecklistProps) {
  return (
    <div className={cx('sm-checklist', className)} style={style}>
      {head && (
        <div className="sm-checklist-h">
          <span>{head[0]}</span>
          <span>{head[1]}</span>
        </div>
      )}
      {children}
      {foot && (
        <div className="sm-checklist-f">
          <span>{foot[0]}</span>
          <span>{foot[1]}</span>
        </div>
      )}
    </div>
  );
}

export interface ChecklistRowProps extends Base {
  /** Left-hand identifier, for example a requirement number. */
  n?: ReactNode;
  /** Right-hand status. */
  status?: ReactNode;
  /** Status tone, which drives the chip colour. */
  tone?: 'accent' | 'strong' | 'muted';
  /** Dim the row, for items that are out of scope. */
  dim?: boolean;
}

/** One row in a Checklist. */
export function ChecklistRow({
  n,
  status,
  tone = 'muted',
  dim,
  className,
  style,
  children,
}: ChecklistRowProps) {
  return (
    <div className={cx('sm-checklist-row', dim && 'sm-dim', className)} style={style}>
      <span className="sm-checklist-n">{n}</span>
      <span className="sm-checklist-name">{children}</span>
      {status && <span className={cx('sm-checklist-st', `sm-tone-${tone}`)}>{status}</span>}
    </div>
  );
}

/* ── Media and misc ────────────────────────────────────────────── */

/** Monospace code block. */
export function Code({ className, style, children }: Base) {
  return (
    <pre className={cx('sm-code', className)} style={style}>
      <code>{children}</code>
    </pre>
  );
}

/** Highlights a span inside a Code block with the accent colour. */
export function Hl({ className, style, children }: Base) {
  return (
    <span className={cx('sm-hl', className)} style={style}>
      {children}
    </span>
  );
}

/** Rule-topped footnote strip, usually the last thing on a slide. */
export function Note({ className, style, children }: Base) {
  return (
    <div className={cx('sm-note', className)} style={style}>
      {children}
    </div>
  );
}

export interface FigureProps extends Base {
  src: string;
  alt?: string;
  caption?: ReactNode;
  /** How the image fills its box. */
  fit?: 'contain' | 'cover';
}

/** An image with an optional caption. */
export function Figure({ src, alt = '', caption, fit = 'contain', className, style }: FigureProps) {
  return (
    <figure className={cx('sm-figure', className)} style={style}>
      <img src={src} alt={alt} style={{ objectFit: fit }} />
      {caption && <figcaption className="sm-figcaption">{caption}</figcaption>}
    </figure>
  );
}

/** Pull quote with an optional attribution. */
export function Quote({ cite, className, style, children }: Base & { cite?: ReactNode }) {
  return (
    <blockquote className={cx('sm-quote', className)} style={style}>
      <p className="sm-quote-body">{children}</p>
      {cite && <cite className="sm-quote-cite">{cite}</cite>}
    </blockquote>
  );
}

/* ── Composite layouts ─────────────────────────────────────────── */

export interface CoverProps extends Base {
  /** Small label above the title, for example the date and occasion. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** One-line positioning statement under the accent rule. */
  lede?: ReactNode;
  /** Bottom-left block, typically presenter names. */
  footer?: ReactNode;
  /** Label above the footer block. */
  footerLabel?: ReactNode;
  dark?: boolean;
  grid?: boolean;
}

/** Opening slide. Composes Slide, so do not nest it inside one. */
export function Cover({
  eyebrow,
  title,
  lede,
  footer,
  footerLabel,
  dark,
  grid = true,
  className,
  style,
}: CoverProps) {
  return (
    <Slide bare dark={dark} grid={grid} className={cx('sm-cover', className)} style={style}>
      <div className="sm-cover-body">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Title as="h1" size="huge" wide className="sm-cover-title">
          {title}
        </Title>
        <Rule className="sm-cover-rule" />
        {lede && <p className="sm-cover-lede">{lede}</p>}
      </div>
      {footer && (
        <div className="sm-cover-footer">
          {footerLabel && <Kicker>{footerLabel}</Kicker>}
          <div className="sm-cover-footer-body">{footer}</div>
        </div>
      )}
    </Slide>
  );
}

export interface SectionProps extends Base {
  /** Part number, rendered large next to the title. */
  n?: number | string;
  title: ReactNode;
  lede?: ReactNode;
  dark?: boolean;
  grid?: boolean;
}

/** Divider slide between parts of a deck. Composes Slide. */
export function Section({ n, title, lede, dark = true, grid, className, style }: SectionProps) {
  return (
    <Slide bare dark={dark} grid={grid} center className={cx('sm-section', className)} style={style}>
      <div className="sm-section-body">
        {n !== undefined && (
          <div className="sm-section-n">{typeof n === 'number' ? pad(n) : n}</div>
        )}
        <Title size="big" wide>
          {title}
        </Title>
        {lede && <Lede>{lede}</Lede>}
      </div>
    </Slide>
  );
}
