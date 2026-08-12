/**
 * The studio icon set.
 *
 * Hand-drawn on a 16px grid with a 1.5px stroke and no fills, so every glyph
 * sits on the same optical weight as 12px UI text and inherits colour from its
 * button. Kept in one file, and deliberately small, because an icon library
 * would be a dependency for nine paths.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...rest }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3.5 5.5 8 10 12.5" />
    </Icon>
  );
}

export function ChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </Icon>
  );
}

export function Message(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5H4A1.5 1.5 0 0 0 2.5 4v5.5A1.5 1.5 0 0 0 4 11h1v2.8L8.8 11H12a1.5 1.5 0 0 0 1.5-1.5V4A1.5 1.5 0 0 0 12 2.5Z" />
    </Icon>
  );
}

export function Pin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 14s4.5-4.4 4.5-7.6a4.5 4.5 0 0 0-9 0C3.5 9.6 8 14 8 14Z" />
      <circle cx="8" cy="6.4" r="1.6" />
    </Icon>
  );
}

export function Play(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5.5 3.3 12.8 8l-7.3 4.7Z" fill="currentColor" />
    </Icon>
  );
}

export function Download(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2.5v7" />
      <path d="m5.3 7.2 2.7 2.7 2.7-2.7" />
      <path d="M3 12.5h10" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M5.6 8.2 7.3 9.9l3.1-3.8" />
    </Icon>
  );
}

/** The empty counterpart to Check: reopening returns a note to unfinished. */
export function Circle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="5.5" />
    </Icon>
  );
}

export function Trash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.8 4.3h10.4" />
      <path d="M6.4 4.3V3.1a.6.6 0 0 1 .6-.6h2a.6.6 0 0 1 .6.6v1.2" />
      <path d="m4.2 4.3.6 8.1a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9l.6-8.1" />
    </Icon>
  );
}

export function Copy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5.5" y="5.5" width="8" height="8" rx="2" />
      <path d="M10.5 5.5v-1a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1" />
    </Icon>
  );
}

export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.2 4.2 7.6 7.6M11.8 4.2l-7.6 7.6" />
    </Icon>
  );
}

export function Plus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Icon>
  );
}

/** The mark in the top bar: a deck, drawn as one slide stacked on another. */
export function Deck(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.3" y="3.3" width="11.4" height="7.4" rx="1.6" />
      <path d="M5 13.2h6" />
    </Icon>
  );
}
