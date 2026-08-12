import path from 'node:path';
import { packageRoot } from '../core/paths.js';

/**
 * The files `slide-maker init` writes.
 *
 * Kept together and away from the command itself so the starter deck is easy
 * to read and change without wading through filesystem plumbing. The deck's
 * first slide is not here: it comes from the template library, so a deck that
 * forks `templates/cover` starts from its own.
 */

export function deckConfig({ title, style, author }) {
  return {
    title,
    author,
    style,
    width: 1280,
    height: 720,
    slides: 'slides',
    assets: 'assets',
  };
}

/**
 * The MCP registration.
 *
 * Points at an absolute path rather than at `pnpm dlx slide-maker` so the server
 * starts without a network round trip and keeps working if the package is
 * never published to a registry.
 */
export function mcpEntry(deckDir) {
  return {
    command: process.execPath,
    args: [path.join(packageRoot, 'bin', 'slide-maker.js'), 'mcp', deckDir],
  };
}

/** Editor support, so `slide-maker/runtime` resolves in the deck. */
export function deckTsconfig() {
  return {
    compilerOptions: {
      target: 'ES2022',
      lib: ['ES2022', 'DOM'],
      module: 'ESNext',
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
      paths: {
        'slide-maker/runtime': [path.join(packageRoot, 'src', 'runtime', 'index.tsx')],
      },
    },
    include: ['slides/**/*'],
  };
}

export const GITIGNORE = `# slide-maker working directory: comments and view state
.slide-maker/

# Exported decks
dist/
out/

node_modules/
.DS_Store
`;

/** The brief Claude reads when it opens the deck. */
export function deckClaudeMd({ title, style }) {
  return `# ${title}

A slide-maker deck. Your job in this folder is to write the slides. That is the
whole job: edit files under \`slides/\`, look at the result, act on the comments.

The user runs the studio and watches these slides in a browser while you work.
It reloads on save. You never start it, stop it, check whether it is running, or
open anything on localhost, and \`render_slide\` starts its own renderer, so it
works whether the studio is open or not.

Also not yours: the slide-maker package, its build, and anything outside this
folder. If a slide will not render for a reason you cannot fix in a slide file,
say so and let the user look.

## Two words that mean different things

A **style** is the design system the whole deck wears: colours, type, spacing.
The deck has exactly one, set in \`deck.json\`.

A **template** is a ready-made slide layout, written against the same runtime
components you write with. Templates carry no colour of their own, so any
template renders in any style. They are a starting point for a slide, not a
constraint on it, and the deck can use as many or as few as suits it.

## Working loop

1. Run \`deck_overview\` to see the style, the running order and any waiting comments.
2. Run \`list_templates\` before you write anything. It is the fastest way to
   decide what each slide should be.
3. Write or edit slide files under \`slides/\`.
4. Run \`render_slide\` to look at what you produced. Do this before saying a slide is done:
   overflowing text and broken layouts are invisible in the source.
5. Run \`list_comments\` to read the user's feedback, act on it, then \`resolve_comment\`
   with a note on what you changed.

If the MCP server is not connected, work from disk instead: slide sources are in
\`slides/\`, settings in \`deck.json\`, comments in \`.slide-maker/comments.json\`.

## Start from a template

There is a library of ready-made slides. **Look at it before building a layout
by hand.** \`list_templates\` gives you the whole catalogue with a note on when
each shape is the right one, and \`read_template\` gives you the JSX to copy into
a new file under \`slides/\` and fill with real content.

Reach for it constantly, not once. Planning a deck is largely choosing which
template each slide should be: a \`cover\`, then \`agenda\`, then a \`section\`
divider, \`three-up\` for the pillars, \`metrics\` for the numbers, \`closing\` for
the ask. Copying a template and replacing its content is faster than composing
from scratch, and it lands closer to how the style expects to be used, because
every template has been checked in all of them.

Deviating is fine. A template is a starting point, and \`blank\` exists for the
slides that do not resemble any of them. But check the library first, and say
which template a slide came from when you report back, so the user knows what
they are looking at.

### Slides the user added

The studio has an **Add slide** gallery next to the style name, which drops a
template into \`slides/\` with its example copy still in it. A slide you did not
write, still carrying that copy, is a slide the user has asked for by pointing
at a shape: they picked the layout, and the words are yours to write. Replace
the content, keep the structure, and ask what the slide is meant to say if the
surrounding deck does not already tell you.

## Writing slides

Every slide is a \`.tsx\` file in \`slides/\` with a default export. Order comes from
the number at the start of the filename, so reordering the deck is a rename.
Prefix a file with \`_\` to park it without deleting it.

Compose from the components exported by \`slide-maker/runtime\`. Do not write raw
HTML for layout: the style targets the runtime classes, so bespoke markup is
what breaks a style switch.

\`\`\`tsx
import { Slide, Head, Eyebrow, Title, Grid, Cell, CardTitle, Line } from 'slide-maker/runtime';

export default function Approach() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>Section label</Eyebrow>
        <Title>One clear claim per slide</Title>
      </Head>
      <Grid cols={3} grow>
        <Cell pad="lg">
          <CardTitle>Heading</CardTitle>
          <Line>Supporting sentence.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
\`\`\`

### The component vocabulary

| Purpose | Components |
| --- | --- |
| Frame | \`Slide\`, \`Cover\`, \`Section\` |
| Heading block | \`Head\`, \`Eyebrow\`, \`Title\`, \`Lede\`, \`Statement\`, \`Rule\` |
| Filling the frame | \`Fill\` to centre, \`Grow\` to stretch |
| Structure | \`Grid\` and \`Cell\`, \`Columns\` and \`Column\`, \`Card\` |
| Inside a cell | \`Kicker\`, \`CardTitle\`, \`Line\` |
| Lists | \`Ticks\` and \`Tick\`, \`Steps\` and \`Step\` |
| Data | \`Stat\`, \`Rows\` and \`Row\`, \`Checklist\` and \`ChecklistRow\` |
| Media | \`Figure\`, \`Code\` with \`Hl\`, \`Quote\` |
| Trim | \`Note\`, \`Badge\`, \`Track\` |

### Rules that keep a deck looking right

- The canvas is fixed at 1280x720 and nothing scrolls. Content that does not fit
  is content to cut, not to shrink.
- One idea per slide. If a slide needs a second \`Title\`, it is two slides.
- \`Eyebrow\` above \`Title\` on nearly every content slide. It is what gives a deck
  its spine.
- Use \`Fill\` when a block should sit in the middle of the leftover space, and
  \`grow\` on a \`Grid\` when cells should stretch to the bottom.
- Set \`dark\` on \`Slide\` to flip the palette for a break slide. Same style,
  no extra CSS.
- Put speaker notes in the \`notes\` prop. They never render on the slide.
- Reach for inline \`style\` only for one-off spacing. Anything you would write
  twice belongs in the style.

## This deck

Style: \`${style}\`. Run \`list_styles\` to see the alternatives and what each is
for, and \`set_style\` to switch. Switching restyles every slide with no edits to
slide files.
`;
}
