import path from 'node:path';
import { packageRoot } from '../core/paths.js';

/** The project files written by `slide-maker init`. */
export function deckConfig({ title, template, style, author }) {
  return {
    title,
    author,
    template,
    style,
    layout: 'template.css',
    width: 1280,
    height: 720,
    slides: 'slides',
    assets: 'assets',
  };
}

export function mcpEntry(deckDir) {
  return {
    command: process.execPath,
    args: [path.join(packageRoot, 'bin', 'slide-maker.js'), 'mcp', deckDir],
  };
}

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

/** The brief Claude reads when it opens an initialized presentation. */
export function deckClaudeMd({ title, template, style }) {
  return `# ${title}

A slide-maker presentation. Work on the slide sources under \`slides/\` and,
when bespoke composition rules are needed, the deck-owned \`template.css\`.
Review the rendered result and act on feedback from the studio.

The user runs the studio. Never start or stop it, inspect localhost, or edit the
slide-maker package. \`render_slide\` starts its own renderer and works whether
the studio is open or not.

## The three concepts

- A **template** is the complete starter deck and its suggested storyline. This
  presentation started from \`${template}\`; its composition rules were copied
  into \`template.css\`.
- A **style** is the design system worn by every slide. This presentation uses
  \`${style}\`; call \`list_styles\` and \`set_style\` to change it. Styles own
  colour and typography, while \`template.css\` keeps the deck's structure stable.
- A **default slide** is a reusable layout offered by this template. Default
  slides are starting points, carry no colour, and render in any style.

## Working loop

1. Call \`deck_overview\` to see the template, style, running order, and comments.
2. Call \`list_default_slides\` before building a layout. Use
   \`read_default_slide\` to get the JSX for a suitable starting point.
3. Write or edit files under \`slides/\`.
4. Call \`render_slide\` before saying a slide is done. Fix overflow, density,
   weak hierarchy, and broken layouts that source inspection cannot reveal.
5. Call \`list_comments\`, make each requested change, then call
   \`resolve_comment\` with a short note.

The template deck is a starting argument, not a form to fill blindly. Delete,
reorder, or add slides to fit the audience and decision. A user-added slide with
example copy means they chose its shape; replace the copy while preserving the
structure unless the surrounding story requires otherwise.

## Writing slides

Every slide is a \`.tsx\` file with a default export. The numeric filename prefix
sets presentation order. Prefix a filename with \`_\` to park it.

Compose with components from \`slide-maker/runtime\`. For bespoke markup, use a
deck-specific class and place its geometry in \`template.css\`. Consume the
active style's \`--sm-*\` variables and inherited fonts there; never hard-code a
palette or typeface. That separation is what makes style switches safe.

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

| Purpose | Components |
| --- | --- |
| Frame | \`Slide\`, \`Cover\`, \`Section\` |
| Heading | \`Head\`, \`Eyebrow\`, \`Title\`, \`Lede\`, \`Statement\`, \`Rule\` |
| Structure | \`Fill\`, \`Grow\`, \`Grid\`, \`Cell\`, \`Columns\`, \`Column\`, \`Card\` |
| Lists | \`Ticks\`, \`Tick\`, \`Steps\`, \`Step\` |
| Data | \`Stat\`, \`Rows\`, \`Row\`, \`Checklist\`, \`ChecklistRow\` |
| Media | \`Figure\`, \`Code\`, \`Hl\`, \`Quote\` |
| Trim | \`Note\`, \`Badge\`, \`Track\` |

The canvas is fixed at 1280×720 and never scrolls. Cut content instead of
shrinking it. Use one idea and one action title per slide. Use \`dark\` on a
\`Slide\` for an inverted break, and put non-rendered speaker notes in \`notes\`.
`;
}
