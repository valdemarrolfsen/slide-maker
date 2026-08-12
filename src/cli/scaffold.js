import path from 'node:path';
import { packageRoot } from '../core/paths.js';

/**
 * The files `slide-maker init` writes.
 *
 * Kept together and away from the command itself so the starter deck is easy
 * to read and change without wading through filesystem plumbing.
 */

export function deckConfig({ title, template, author }) {
  return {
    title,
    author,
    template,
    width: 1280,
    height: 720,
    slides: 'slides',
    assets: 'assets',
  };
}

/**
 * The MCP registration.
 *
 * Points at an absolute path rather than at `npx slide-maker` so the server
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

export const SLIDES = {
  '01-cover.tsx': `import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      eyebrow="Draft · replace this line"
      title={
        <>
          A deck you build
          <br />
          by talking to Claude
        </>
      }
      lede="Write slides in the terminal. Review them in the browser. Comment on anything."
      footerLabel="slide-maker"
      footer="Your name here"
    />
  );
}
`,

  '02-how-it-works.tsx': `import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function HowItWorks() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>How this works</Eyebrow>
        <Title>Three surfaces, one deck</Title>
      </Head>

      <Grid cols={3} grow>
        <Cell pad="lg">
          <Kicker accent>01</Kicker>
          <CardTitle>You brief Claude</CardTitle>
          <Line>Describe the deck in your terminal. Claude writes the slide files.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>02</Kicker>
          <CardTitle>You review here</CardTitle>
          <Line>Slides reload the moment a file is saved. No build step to wait on.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>03</Kicker>
          <CardTitle>You comment back</CardTitle>
          <Line>Select any text on a slide and leave a note. Claude reads it directly.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
`,

  '03-try-it.tsx': `import { Slide, Head, Eyebrow, Title, Fill, Ticks, Tick, Note } from 'slide-maker/runtime';

export default function TryIt() {
  return (
    <Slide notes="Reminder: select the sentence below and leave a comment, to see the loop close.">
      <Head>
        <Eyebrow>Try it now</Eyebrow>
        <Title>Select this sentence and tell Claude to rewrite it.</Title>
      </Head>

      <Fill>
        <Ticks>
          <Tick>
            <b>Select text</b> anywhere on a slide to comment on those exact words.
          </Tick>
          <Tick>
            <b>Pin a note</b> to drop a marker on a specific spot in the layout.
          </Tick>
          <Tick>
            <b>Press C</b> to leave a note about the whole slide.
          </Tick>
        </Ticks>
      </Fill>

      <Note>
        Delete these starter slides once you are ready. Ask Claude to swap the template and
        the whole deck restyles, with no edits to any slide.
      </Note>
    </Slide>
  );
}
`,
};

/** The brief Claude reads when it opens the deck. */
export function deckClaudeMd({ title, template }) {
  return `# ${title}

A slide-maker deck. The user is watching these slides in a browser studio while
you edit them, and leaves comments on the text directly.

## Working loop

1. Run \`deck_overview\` to see the template, the running order and any waiting comments.
2. Write or edit slide files under \`slides/\`.
3. Run \`render_slide\` to look at what you produced. Do this before saying a slide is done:
   overflowing text and broken layouts are invisible in the source.
4. Run \`list_comments\` to read the user's feedback, act on it, then \`resolve_comment\`
   with a note on what you changed.

If the MCP server is not connected, the same information is on disk:
comments live in \`.slide-maker/comments.json\`.

## Writing slides

Every slide is a \`.tsx\` file in \`slides/\` with a default export. Order comes from
the number at the start of the filename, so reordering the deck is a rename.
Prefix a file with \`_\` to park it without deleting it.

Compose from the components exported by \`slide-maker/runtime\`. Do not write raw
HTML for layout: the template styles the runtime classes, so bespoke markup is
what breaks a template switch.

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
- Set \`dark\` on \`Slide\` to flip the palette for a break slide. Same template,
  no extra CSS.
- Put speaker notes in the \`notes\` prop. They never render on the slide.
- Reach for inline \`style\` only for one-off spacing. Anything you would write
  twice belongs in the template.

## This deck

Template: \`${template}\`. Run \`list_templates\` to see the alternatives and what
each is for, and \`set_template\` to switch. Switching restyles every slide with
no edits to slide files.
`;
}
