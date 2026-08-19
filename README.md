<p align="center">
  <img src="./assets/slidemaker-logo.png" alt="slide-maker" width="466" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/slide-maker"><img src="https://img.shields.io/npm/v/slide-maker?style=flat-square" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/slide-maker"><img src="https://img.shields.io/npm/dm/slide-maker?style=flat-square" alt="npm downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/github/license/valdemarrolfsen/slide-maker?style=flat-square" alt="MIT license" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/slide-maker?style=flat-square" alt="Node.js version" /></a>
</p>

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

The studio opens in your default browser when it is ready. Use
`slide-maker start --no-open` when you only want to start the server.

`init` asks which complete template deck to start from, then offers its default
style. Open Claude Code in the same directory and start briefing it.

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

**You edit the words directly.** Click any text on the active slide, type the
replacement, then press <kbd>Enter</kbd> or click away. The studio writes the
change back to the slide's `.tsx` file automatically. Press <kbd>Escape</kbd> to
cancel; use <kbd>Shift</kbd>+<kbd>Enter</kbd> for a line break.

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

## Templates, styles, and default slides

The three concepts solve different parts of starting and extending a presentation.

A **template** is a complete starter deck: a suggested storyline, real starter
slides, a deck-owned layout stylesheet, a default style, and a curated set of
layouts for adding more slides.

A **style** is a visual design system: colour, typography, and the treatment of
shared runtime components. Template-specific composition stays in
`template.css`, so switching style restyles the deck without discarding its
grids, timelines, dashboards, or other bespoke structures. A deck wears
exactly one style and keeps exactly one layout stylesheet.

A **default slide** is one reusable slide layout. It carries no colour of its
own, renders in every style, and is a starting point rather than a constraint.

```bash
slide-maker styles             # list the design systems
slide-maker use noir           # switch the deck to one
slide-maker templates          # list complete starter decks
slide-maker default-slides     # list reusable slide layouts
slide-maker browse consulting  # preview a template safely
```

The Studio top bar has a style picker and an **Add slide** gallery for the
current template's default slides. The deck reloads immediately after either
change.

### The styles

| Style | For |
| --- | --- |
| `granite` | Working sessions and partner workshops. Warm neutrals, hairline rules, mono labels. |
| `consulting` | Strategy reports. Dense evidence, serif action titles, analytical charts and tables. |
| `portfolio` | Creative portfolios. Warm editorial restraint, oversized type and image-led layouts. |
| `sales` | Product-led B2B selling. Violet accents, UI mockups, proof charts and modular commercial pages. |
| `noir` | Stage talks. Dark ground, oversized headlines, one idea per slide. |
| `editorial` | Decks that argue a position. Serif headlines on warm paper, wide measures. |
| `slate` | Clients and boards. Cool greys, soft corners, tolerant of dense slides. |
| `terminal` | Engineering audiences. Monospace throughout, built around code and status tables. |

Fork one by copying it into `styles/` inside your deck. A local style shadows a
built-in of the same name.

### The template decks

| Template | Storyline |
| --- | --- |
| `blank` | One cover and no prescribed narrative |
| `consulting` | Answer first, situation, diagnosis, recommendation, roadmap, decision |
| `portfolio` | Profile and selected work told through complete case studies |
| `sales` | Buyer pain, cost of inaction, solution, proof, plan, investment, next step |
| `raise-capital` | Purpose, problem, solution, why now, market, traction, model, team, ask |
| `technical-presentation` | Problem, constraints, architecture, interface, evidence, rollout, decisions |

Every template recommends a style, which you can override during initialization
or later from the CLI or Studio. The selected template's `template.css` is
copied into the new deck, while its colours and typefaces continue to come from
the selected style. `slide-maker browse <template>` opens a disposable Studio
preview, so browsing never modifies the bundled source deck.

### Templates of your own

The built-in templates are a starting point, not the list. Point Claude at a
product you already have and ask for a template that looks like it:

```
craft a slide-maker template from ./dist and call it acme-brand
```

Claude calls `create_custom_template`, which scaffolds the template and a style
of its own into your slide-maker home, then reads the source for its palette,
typefaces, spacing and logo and fills them in. Nothing lands in the deck you
happen to be standing in: the point of a brand template is the next deck, and
the one after that.

```bash
slide-maker config new-template acme-brand --source ../acme/dist
slide-maker config templates              # what you have stored
slide-maker browse acme-brand             # look at it
slide-maker config brief acme-brand       # what still needs filling in
slide-maker config save-template acme     # store the current deck as a template
slide-maker config remove-template acme --style
```

A stored template lives beside the built-ins from then on, so
`slide-maker init --template acme-brand` and the template picker both offer it.
A template or style in your home that shares a name with a built-in shadows it,
and a deck-local one still wins over both.

### Defaults for new decks

`slide-maker config` also holds the settings `init` starts from, so you stop
answering the same two questions:

```bash
slide-maker config                                    # everything, and where it lives
slide-maker config set defaultTemplate acme-brand
slide-maker config set defaultStyle noir
slide-maker config set author "Your Name"
slide-maker config unset defaultStyle
```

`--template` and `--style` on `init` still win, and a configured style outranks
the one a template recommends. Everything lives in `~/.slide-maker`, which
`SLIDE_MAKER_HOME` can point elsewhere:

```
~/.slide-maker/
  config.json          defaults for init
  templates/<name>/    templates you or Claude made
  styles/<name>/       styles to go with them
  default_slides/      reusable layouts of your own
```

### The default-slide library

Add one to a deck from the studio. The **Add slide** button next to the style
name opens a gallery of the layouts selected by the current template, each
previewed as a live thumbnail in your deck's own style, so you pick a shape by
looking at it rather than guessing from a name. Clicking one appends it as a new slide and takes you
there. Then tell Claude what it should actually say: picking the shape yourself
and leaving the words to Claude is usually faster than describing a layout in
prose.

Claude reaches for the same library on its own. The deck's `CLAUDE.md` and the
MCP server both point at it, and `read_default_slide` hands over the JSX, so "a slide
with three pillars" starts from `three-up` rather than from nothing.

Fork a default slide by copying it into `default_slides/` inside your deck. A
local default slide shadows a built-in of the same name.

## Starting a deck

```bash
slide-maker init my-deck
```

It asks which template deck to start from, then offers that template's default
style. An explicit style always wins.

```bash
slide-maker init my-deck --template consulting
slide-maker init my-deck --template sales --style noir
slide-maker init my-deck --yes            # blank template, granite style
```

## Writing slides

Every slide is a file with a default export. Running order comes from the number
at the start of the filename, so reordering a deck is a rename. Hide a slide
without deleting it through Studio or the CLI; hidden slides remain editable in
Studio but are skipped in presentation, static builds, PDF, and PNG export.

```bash
slide-maker hide 3             # accepts a number, id, filename, or slide path
slide-maker show 03-appendix   # `unhide` is also accepted
```

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
| Data | `Stat`, `BarChart`, `LineChart`, `StackedBarChart`, `WaterfallChart`, `BubbleMatrix`, `DataTable`, `Rows` + `Row`, `Checklist` + `ChecklistRow` |
| Media | `Figure`, `Code` + `Hl`, `Quote` |
| Trim | `Note`, `Badge`, `Track` |

The canvas is a fixed 1280x720 and nothing scrolls. That constraint is the
point: content that does not fit is content to cut. The whole frame is scaled
with a CSS transform, so the studio, the exported HTML and the PDF are identical
to the pixel.

Set `dark` on any `Slide` to flip it to the style's dark palette. Put speaker
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
| `deck_overview` | Style, running order, open comment count, what you are looking at |
| `read_slide` | Source of one slide |
| `list_comments` | Your feedback, with file paths and quoted text |
| `resolve_comment` | Clear a note once it is addressed |
| `list_styles` / `set_style` | Pick and switch the design system |
| `list_templates` | Starter decks available, built-in and your own |
| `create_custom_template` | Scaffold a template from a product or brand, stored for every deck |
| `set_default_template` | Change what `init` starts from on this machine |
| `list_default_slides` / `read_default_slide` | Find a reusable layout and read its JSX to copy |
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
slide-maker hide <slide>       omit a slide from presentation and export
slide-maker show <slide>       include a hidden slide again
slide-maker styles             list the design systems
slide-maker use <style>        switch style
slide-maker templates          list complete starter decks
slide-maker default-slides     list reusable slide layouts
slide-maker browse [template]  preview a template deck
slide-maker comments           read feedback from the terminal
slide-maker comments resolve <id>
slide-maker config             your settings and your own templates
slide-maker config set <key> <value>
slide-maker config new-template <name>
slide-maker config save-template <name> [deck]
slide-maker mcp [dir]          run the MCP server over stdio
```

## Anatomy of a deck

```
my-deck/
  deck.json            title, template, style, layout, canvas size
  template.css         template-specific composition rules
  slides/
    01-cover.tsx       order comes from the filename
    02-agenda.tsx
  assets/              served from the root
  styles/              optional local design systems
  default_slides/      optional local reusable layouts
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

See [CONTRIBUTING.md](CONTRIBUTING.md). New styles, default slides, and complete
template decks are especially welcome.

## License

MIT
