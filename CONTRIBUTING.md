# Contributing

## Getting set up

```bash
git clone https://github.com/heisthq/slide-maker
cd slide-maker
npm install
npx playwright install chromium   # only needed for PDF/PNG export work

npm run demo                      # studio on the example deck
npm run demo:build                # static build of it
npx tsc --noEmit                  # typecheck
```

There is no build step for development. The Node side is plain ESM JavaScript
and the viewer is TypeScript compiled by Vite on demand, so edits take effect on
save. `npm run types` generates the published type declarations and runs
automatically on `npm pack`.

## Layout

```
bin/                CLI entry point
src/
  cli/              commands, and the files `init` scaffolds
  core/             deck config, slide discovery, comments, template registry
  vite/             Vite config factory and the deck plugin
  viewer/           the studio and the standalone presentation, in React
  runtime/          the component library slides import, and its stylesheet
  render/           headless rendering for PDF, PNG and the MCP tool
  mcp/              the MCP server
templates/          built-in templates
examples/demo/      a scratch deck for development
```

## Where things are decided

**The runtime owns structure, the template owns looks.** If you find yourself
adding a colour or a font size to `src/runtime/`, it probably belongs in a
template as a token instead. If a template needs a new structural element, add
it to the runtime and let every template style it.

**Slides never scroll.** The canvas is fixed and scaled with a transform. This
is what makes the studio, the static build and the PDF identical, and it is what
keeps comment anchors valid at any zoom. Do not add overflow handling to a slide.

**Comments are a file.** `.slide-maker/comments.json` is the single source of
truth, written atomically through a temp file and a rename. Both the dev server
and the MCP server read and write it, and neither needs the other to be running.

## Writing a template

A template is a directory under `templates/` with two files:

```
templates/mytheme/
  template.json     label, description, tags, and guidance for Claude
  theme.css         tokens, and any rules you want to override
```

Start by redefining the custom properties on `.sm-slide`. The full token list is
at the top of `src/runtime/runtime.css`. Most templates need nothing more than
tokens plus a `.sm-slide.sm-dark` block for the inverted palette.

The `guidance` field in `template.json` is read by Claude through
`list_templates`. Write it as advice to whoever is composing the deck: what the
template is for, which components suit it, and what to avoid. It is the most
useful field in the file.

Two things to watch:

- **Specificity.** Runtime rules are single-class, so a template rule at the same
  specificity wins on order alone. Do not reach for `!important`, and be careful
  with descendant selectors, which will out-specify runtime rules you did not
  mean to override.
- **Head sizing.** If your type scale is larger than the default, raise
  `--sm-head-min` and `--sm-head-gap` or long headings will crowd the content
  underneath. `noir` is the worked example.

Test a template by pointing the example deck at it:

```bash
node bin/slide-maker.js use mytheme --deck examples/demo
node bin/slide-maker.js export examples/demo -f png -o ../../.preview
```

Render every slide and look at the images. A template that has only been checked
on a cover slide is a template that has not been checked.

## Adding a runtime component

Add it to `src/runtime/index.tsx` with an `sm-` prefixed class, give it
structural CSS in `runtime.css` that reads from tokens, and confirm it looks
deliberate in all five templates. Then mention it in the component table in
`README.md` and in the one `src/cli/scaffold.js` writes into each deck's
`CLAUDE.md`, since that table is what Claude actually reads.

## Style

- ESM everywhere, no CommonJS.
- No em dashes in comments, docs or UI copy.
- Comments explain why, not what. If a line needs a comment to say what it does,
  rename something instead.
- Keep dependencies few. Everything currently shipped is load-bearing.

## Pull requests

Include before and after renders for anything that changes how a slide looks.
`slide-maker export -f png` produces them in one command.
