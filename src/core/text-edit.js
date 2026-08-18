/**
 * Small, dependency-free source editor for text rendered by a slide.
 *
 * Slide copy normally comes from JSX text or a JavaScript string literal. The
 * browser tells the studio which rendered text node was clicked and which
 * occurrence it was; this module maps that back to the corresponding literal
 * without reformatting the rest of the file.
 */

function squish(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

function decodeEscape(source, index) {
  const char = source[index];
  const simple = {
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
    0: '\0',
  };
  if (char in simple) return { value: simple[char], length: 1 };
  if (char === '\n') return { value: '', length: 1 };
  if (char === '\r' && source[index + 1] === '\n') return { value: '', length: 2 };

  if (char === 'x' && /^[0-9a-f]{2}$/i.test(source.slice(index + 1, index + 3))) {
    return { value: String.fromCharCode(Number.parseInt(source.slice(index + 1, index + 3), 16)), length: 3 };
  }
  if (char === 'u' && source[index + 1] === '{') {
    const close = source.indexOf('}', index + 2);
    const digits = close < 0 ? '' : source.slice(index + 2, close);
    if (/^[0-9a-f]+$/i.test(digits)) {
      return { value: String.fromCodePoint(Number.parseInt(digits, 16)), length: close - index + 1 };
    }
  }
  if (char === 'u' && /^[0-9a-f]{4}$/i.test(source.slice(index + 1, index + 5))) {
    return { value: String.fromCharCode(Number.parseInt(source.slice(index + 1, index + 5), 16)), length: 5 };
  }
  return { value: char, length: 1 };
}

function stringCandidates(source) {
  const candidates = [];
  let index = 0;

  while (index < source.length) {
    const quote = source[index];
    if (quote !== "'" && quote !== '"' && quote !== '`') {
      index += 1;
      continue;
    }

    const start = index;
    let value = '';
    let dynamic = false;
    index += 1;
    while (index < source.length) {
      const char = source[index];
      if (char === '\\') {
        const escaped = decodeEscape(source, index + 1);
        value += escaped.value;
        index += escaped.length + 1;
        continue;
      }
      if (char === quote) {
        candidates.push({
          kind: 'string',
          quote,
          start,
          end: index + 1,
          value,
          dynamic,
        });
        index += 1;
        break;
      }
      if (quote === '`' && char === '$' && source[index + 1] === '{') dynamic = true;
      value += char;
      index += 1;
    }
  }
  return candidates;
}

function exactStringCandidates(source, value) {
  const candidates = [];
  let index = source.indexOf(value);
  while (index >= 0) {
    const quote = source[index - 1];
    if ((quote === "'" || quote === '"' || quote === '`') && source[index + value.length] === quote) {
      candidates.push({
        kind: 'string',
        quote,
        start: index - 1,
        end: index + value.length + 1,
        value,
        dynamic: false,
      });
    }
    index = source.indexOf(value, index + Math.max(1, value.length));
  }
  return candidates;
}

function jsxTextCandidates(source) {
  const candidates = [];
  // JSX prose is bounded by tags. Braces are deliberately excluded: their
  // contents are covered by the JavaScript-string scanner above.
  const pattern = />([^<>{}]+)(?=<)/g;
  let match;
  while ((match = pattern.exec(source))) {
    const value = match[1];
    if (!squish(value)) continue;
    candidates.push({
      kind: 'jsx',
      start: match.index + 1,
      end: match.index + 1 + value.length,
      value,
      dynamic: false,
    });
  }
  return candidates;
}

function escapeString(value, quote) {
  let escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  if (quote === '`') {
    escaped = escaped.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  } else {
    escaped = escaped.replace(new RegExp(`\\${quote}`, 'g'), `\\${quote}`);
  }
  return `${quote}${escaped}${quote}`;
}

function replaceJsxText(candidate, oldText, newText) {
  const words = squish(oldText).split(' ').filter(Boolean);
  if (!words.length) return null;
  const flexible = words.map(escapeRegExp).join('\\s+');
  const match = new RegExp(flexible).exec(candidate.value);
  if (!match) return null;

  // An expression is safe for every character a user can type, including JSX
  // delimiters and ampersands. Keep source whitespace around the prose intact.
  const replacement = `{${JSON.stringify(newText)}}`;
  const value = candidate.value.slice(0, match.index) + replacement + candidate.value.slice(match.index + match[0].length);
  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NON_VISUAL_KEYS = new Set([
  'alt',
  'className',
  'fit',
  'kind',
  'notes',
  'ratio',
  'src',
  'style',
  'tone',
]);

function isVisualCandidate(source, candidate) {
  if (candidate.kind !== 'string') return true;
  const before = source.slice(Math.max(0, candidate.start - 100), candidate.start);
  if (/(?:\bfrom|\bimport)\s*$/.test(before)) return false;
  const key = /([A-Za-z_$][\w$-]*)\s*(?:=|:)\s*$/.exec(before)?.[1];
  return !key || !NON_VISUAL_KEYS.has(key);
}

/**
 * Replaces one rendered text value and returns the updated source.
 * Throws a user-facing error when the rendered text is computed rather than a
 * literal, or when the requested occurrence cannot be identified safely.
 */
export function replaceSlideText(source, { oldText, newText, occurrence = 0 }) {
  const oldValue = squish(oldText);
  if (!oldValue) throw new Error('This text is empty and cannot be edited');
  if (typeof newText !== 'string') throw new Error('The replacement text must be a string');
  if (newText.length > 100_000) throw new Error('The replacement text is too long');

  const unique = new Map();
  for (const candidate of [
    ...exactStringCandidates(source, oldText),
    ...stringCandidates(source),
    ...jsxTextCandidates(source),
  ]) {
    unique.set(`${candidate.start}:${candidate.end}`, candidate);
  }
  const candidates = [...unique.values()]
    .filter(
      (candidate) =>
        !candidate.dynamic &&
        isVisualCandidate(source, candidate) &&
        squish(candidate.value) === oldValue,
    )
    .sort((a, b) => a.start - b.start);

  const target = candidates[occurrence];
  if (!target) {
    if (candidates.length === 1) {
      // The DOM can contain the same value more than once even when it comes
      // from one reused source value. Editing that one instance is ambiguous.
      throw new Error('This text is reused by the slide and cannot be edited independently');
    }
    throw new Error('This text is computed by the slide and cannot be edited directly');
  }

  let replacement;
  if (target.kind === 'string') {
    replacement = escapeString(newText, target.quote);
  } else {
    replacement = replaceJsxText(target, oldText, newText);
    if (replacement === null) throw new Error('Could not map this text back to the slide source');
  }

  return source.slice(0, target.start) + replacement + source.slice(target.end);
}
