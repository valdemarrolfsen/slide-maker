# slide-maker

A local slide deck studio you drive from Claude Code.

You build the deck by talking to Claude in your terminal. The slides render live
in a browser next to you. When something is wrong, you select the text on the
slide and say so, and Claude picks the comment up directly.

No accounts, no cloud, no export dance. A deck is a folder of files on your disk.

```bash
pnpm dlx slide-maker init my-deck
cd my-deck
pnpm dlx slide-maker start
```

Then open Claude Code in the same directory and start briefing it.

---

## Why this exists

Getting an LLM to build a slide deck usually breaks down in the same place: the
model cannot see what it made, and you have no precise way to tell it what is
wrong. You end up describing a layout problem in prose, three times.

slide-maker closes that loop from both ends. Claude can render a slide and look
at it. You can point at the exact words that bother you. Feedback travels as
structured data with a file path attached, not as a paragraph of description.

## How it works

**You brief Claude.** Slides are `.tsx` files in `slides/`. Claude writes them
with its normal file tools, composing from a small component library rather than
raw HTML.

**You watch in the studio.** `slide-maker start` serves a browser UI with a slide
rail, the current slide, and a comment panel. Files reload the moment they are
saved.

**You export from the same view.** Click **Export PDF** in the studio to download
the current deck with selectable vector text. PDF export requires Playwright and
Chromium, just like the export command.

**You comment back.** Select any text on a slide and a note composer appears.
The comment records the slide's file path, the exact text you selected, and the
text on either side of it. Claude searches the file for that quote and finds the
right line even when the same words appear twice.

**Claude sees its own work.** The MCP server exposes a `render_slide` tool that
returns a PNG. Overflowing text and broken layouts are invisible in source, so
this catches a whole class of problem before you have to.

## The comment loop

The mechanism is deliberately boring. Comments live in a plain file at
`.slide-maker/comments.json`. The studio writes to it, the MCP server reads and
updates it, and the dev server watches it. Nothing is in memory, nothing needs
both processes running at once, and everything survives a restart.

Three ways to leave a comment:

| Action | What it captures |
| --- | --- |
| Select text on a slide | The exact words, plus surrounding context and the file |
| **Pin a note**, then click | A marker at a position on the slide |
| Press <kbd>C</kbd> | A note about the slide as a whole |

If you have not wired up MCP, **Copy for Claude** in the panel puts every open
comment on your clipboard as a markdown brief. Paste it into the terminal.

## Templates

A template is a design system, not a wrapper. Slides never state a colour or a
font. They compose semantic components, and the template decides what those look
like, so switching template restyles the whole deck without editing a single
slide.

```bash
slide-maker templates          # list them
slide-maker use noir           # switch
```

While the Studio is running, you can also switch from the template picker next
to the deck title. The deck reloads with the new design immediately.

| Template | For |
| --- | --- |
| `granite` | Working sessions and partner workshops. Warm neutrals, hairline rules, mono labels. |
| `noir` | Stage talks. Dark ground, oversized headlines, one idea per slide. |
| `editorial` | Decks that argue a position. Serif headlines on warm paper, wide measures. |
| `slate` | Clients and boards. Cool greys, soft corners, tolerant of dense slides. |
| `terminal` | Engineering audiences. Monospace throughout, built around code and status tables. |

Fork one by copying it into `templates/` inside your deck. A local template
shadows a built-in of the same name.

## Writing slides

Every slide is a file with a default export. Running order comes from the number
at the start of the filename, so reordering a deck is a rename. Prefix a file
with `_` to park it.

```tsx
// slides/02-approach.tsx
import { Slide, Head, Eyebrow, Title, Grid, Cell, CardTitle, Line } from 'slide-maker/runtime';

export default function Approach() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>How we work</Eyebrow>
        <Title>Three surfaces, one deck</Title>
      </Head>

      <Grid cols={3} grow>
        <Cell pad="lg">
          <CardTitle>Discovery</CardTitle>
          <Line>Two weeks, ending in a written scope.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
```

### Components

| Purpose | Components |
| --- | --- |
| Frame | `Slide`, `Cover`, `Section` |
| Heading block | `Head`, `Eyebrow`, `Title`, `Lede`, `Statement`, `Rule` |
| Filling the frame | `Fill` to centre, `Grow` to stretch |
| Structure | `Grid` + `Cell`, `Columns` + `Column`, `Card` |
| Inside a cell | `Kicker`, `CardTitle`, `Line` |
| Lists | `Ticks` + `Tick`, `Steps` + `Step` |
| Data | `Stat`, `Rows` + `Row`, `Checklist` + `ChecklistRow` |
| Media | `Figure`, `Code` + `Hl`, `Quote` |
| Trim | `Note`, `Badge`, `Track` |

The canvas is a fixed 1280x720 and nothing scrolls. That constraint is the
point: content that does not fit is content to cut. The whole frame is scaled
with a CSS transform, so the studio, the exported HTML and the PDF are identical
to the pixel.

Set `dark` on any `Slide` to flip it to the template's dark palette. Put speaker
notes in the `notes` prop; they never render on the slide.

### Images

Drop files in `assets/` and reference them from the root:

```tsx
<Figure src="/diagram.svg" caption="Request path" />
```

Or import them, if you want the build to fingerprint and inline-check them:

```tsx
import diagram from '../assets/diagram.svg';
```

## Exporting

```bash
slide-maker build              # one self-contained dist/index.html
slide-maker export             # deck.pdf, real vector text
slide-maker export -f png      # one image per slide
```

While the Studio is running, click **Export PDF** to render and download the
same PDF without leaving the browser.

`build` produces a single HTML file with the script, styles and images inlined.
No server, no sibling directory: double-click it, or email it to someone. Arrow
keys page through, <kbd>F</kbd> is fullscreen, <kbd>P</kbd> prints.

PDF and PNG export need Playwright:

```bash
pnpm add playwright
pnpm exec playwright install chromium
```

## Claude Code setup

`slide-maker init` writes a `.mcp.json` registering the deck's MCP server, and a
`CLAUDE.md` briefing Claude on how to work with the deck. Claude Code asks you to
approve the server the first time it starts.

The server exposes:

| Tool | Purpose |
| --- | --- |
| `deck_overview` | Template, running order, open comment count, what you are looking at |
| `read_slide` | Source of one slide |
| `list_comments` | Your feedback, with file paths and quoted text |
| `resolve_comment` | Clear a note once it is addressed |
| `list_templates` / `set_template` | Pick and switch the design system |
| `render_slide` | Render to PNG, so Claude can check its own work |
| `deck_files` | Where things live, and what to name the next slide |

To register it by hand instead:

```json
{
  "mcpServers": {
    "slide-maker": {
      "command": "pnpm",
      "args": ["dlx", "slide-maker", "mcp", "/absolute/path/to/deck"]
    }
  }
}
```

## CLI

```
slide-maker init [dir]         scaffold a deck and wire up Claude Code
slide-maker start [dir]        open the studio
slide-maker build [dir]        export a static site
slide-maker export [dir]       render to PDF or PNG
slide-maker templates          list templates
slide-maker use <template>     switch template
slide-maker comments           read feedback from the terminal
slide-maker comments resolve <id>
slide-maker mcp [dir]          run the MCP server over stdio
```

## Anatomy of a deck

```
my-deck/
  deck.json            title, template, canvas size
  slides/
    01-cover.tsx       order comes from the filename
    02-agenda.tsx
  assets/              served from the root
  templates/           optional local templates
  CLAUDE.md            how Claude should work with this deck
  .mcp.json            MCP registration
  .slide-maker/        comments and view state, gitignored
```

## Keyboard

| Key | |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | Previous and next slide |
| <kbd>C</kbd> | Comment on the current slide |
| <kbd>P</kbd> | Presenting mode |
| <kbd>F</kbd> | Fullscreen |
| <kbd>Esc</kbd> | Close the composer, exit presenting |
| <kbd>⌘</kbd><kbd>↵</kbd> | Send a comment |

## Requirements

Node 20.19+ or 22.12+. Playwright is optional and only needed for PDF and PNG
export and for `render_slide`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). New templates are especially welcome:
a template is a `template.json` and a `theme.css`, and the runtime does the rest.

## License

MIT
