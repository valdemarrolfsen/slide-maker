import readline from 'node:readline';
import { color } from '../core/log.js';

/**
 * A single-select list prompt.
 *
 * Written by hand rather than pulled from a package because `init` is the only
 * place in the CLI that asks a question, and a prompt library is a large
 * dependency for one list of five things.
 */

/** True when there is a person on the other end of the terminal. */
export function canPrompt() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

/** Trims a line to the terminal width so it never wraps and breaks the redraw. */
function fit(line, width) {
  // Colour codes are zero-width on screen but count towards `length`, so
  // measure the plain text and cut the styled string at the same point.
  const plain = line.replace(/\x1b\[[0-9;]*m/g, '');
  if (plain.length <= width) return line;
  let visible = 0;
  let out = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '\x1b') {
      const end = line.indexOf('m', i);
      if (end !== -1) {
        out += line.slice(i, end + 1);
        i = end;
        continue;
      }
    }
    if (visible >= width - 1) break;
    out += line[i];
    visible += 1;
  }
  return `${out}…`;
}

/**
 * Asks the user to pick one of `choices`.
 *
 * Choices are `{ value, label, note }`. Resolves to the chosen value, or to
 * `null` if the user backs out with Escape.
 */
export async function select({ message, choices, initial = 0, hint }) {
  const out = process.stdout;
  const input = process.stdin;
  const width = Math.max(40, (out.columns || 80) - 1);

  // Reserve rows for the question, the hint and a little breathing room, so a
  // long list scrolls inside a window instead of overflowing the screen.
  const windowSize = Math.max(4, Math.min(choices.length, (out.rows || 24) - 6));
  const pad = Math.max(...choices.map((c) => c.label.length));

  let index = Math.max(0, Math.min(choices.length - 1, initial));
  let top = Math.max(0, Math.min(index - Math.floor(windowSize / 2), choices.length - windowSize));
  let drawn = 0;

  const lines = () => {
    top = Math.max(Math.min(top, index), index - windowSize + 1);
    top = Math.max(0, Math.min(top, Math.max(0, choices.length - windowSize)));

    const head = `${color.cyan('?')} ${color.bold(message)}${
      hint ? `  ${color.dim(hint)}` : ''
    }`;
    const body = choices.slice(top, top + windowSize).map((choice, i) => {
      const active = top + i === index;
      const marker = active ? color.cyan('❯') : ' ';
      const label = active ? color.cyan(choice.label.padEnd(pad)) : choice.label.padEnd(pad);
      const note = choice.note ? `  ${color.dim(choice.note)}` : '';
      return `${marker} ${label}${note}`;
    });
    const more =
      choices.length > windowSize
        ? [color.dim(`  ${index + 1}/${choices.length}   ↑↓ to move, enter to pick`)]
        : [color.dim('  ↑↓ to move, enter to pick')];
    return [head, ...body, ...more].map((line) => fit(line, width));
  };

  const draw = () => {
    if (drawn) readline.moveCursor(out, 0, -drawn);
    readline.cursorTo(out, 0);
    readline.clearScreenDown(out);
    const next = lines();
    out.write(`${next.join('\n')}\n`);
    drawn = next.length;
  };

  const erase = () => {
    if (drawn) readline.moveCursor(out, 0, -drawn);
    readline.cursorTo(out, 0);
    readline.clearScreenDown(out);
    drawn = 0;
  };

  readline.emitKeypressEvents(input);
  const wasRaw = Boolean(input.isRaw);
  input.setRawMode(true);
  input.resume();
  out.write(HIDE_CURSOR);

  return new Promise((resolve) => {
    const done = (value) => {
      input.off('keypress', onKey);
      input.setRawMode(wasRaw);
      input.pause();
      erase();
      out.write(SHOW_CURSOR);
      if (value !== null) {
        const choice = choices[index];
        out.write(`${color.green('✓')} ${color.bold(message)}  ${choice.label}\n`);
      }
      resolve(value);
    };

    const onKey = (str, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        done(null);
        // Signalling the interrupt rather than returning keeps `init` from
        // carrying on and scaffolding a deck the user just abandoned.
        process.exit(130);
      }
      switch (key.name) {
        case 'up':
        case 'k':
          index = (index - 1 + choices.length) % choices.length;
          break;
        case 'down':
        case 'j':
        case 'tab':
          index = (index + 1) % choices.length;
          break;
        case 'home':
          index = 0;
          break;
        case 'end':
          index = choices.length - 1;
          break;
        case 'return':
        case 'enter':
          done(choices[index].value);
          return;
        case 'escape':
          done(null);
          return;
        default: {
          const digit = Number(str);
          if (Number.isInteger(digit) && digit >= 1 && digit <= choices.length) {
            index = digit - 1;
            break;
          }
          return;
        }
      }
      draw();
    };

    input.on('keypress', onKey);
    draw();
  });
}
