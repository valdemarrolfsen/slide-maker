# slide-maker demo

A slide-maker deck. The user is watching these slides in a browser studio while
you edit them, and leaves comments on the text directly.

## Working loop

1. Run `deck_overview` to see the template, the running order and any waiting comments.
2. Write or edit slide files under `slides/`.
3. Run `render_slide` to look at what you produced. Do this before saying a slide is done:
   overflowing text and broken layouts are invisible in the source.
4. Run `list_comments` to read the user's feedback, act on it, then `resolve_comment`
   with a note on what you changed.

If the MCP server is not connected, the same information is on disk:
comments live in `.slide-maker/comments.json`.

## Writing slides

Every slide is a `.tsx` file in `slides/` with a default export. Order comes from
the number at the start of the filename, so reordering the deck is a rename.
Prefix a file with `_` to park it without deleting it.

Compose from the components exported by `slide-maker/runtime`. Do not write raw
HTML for layout: the template styles the runtime classes, so bespoke markup is
what breaks a template switch.

```tsx
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
```

### The component vocabulary

| Purpose | Components |
| --- | --- |
| Frame | `Slide`, `Cover`, `Section` |
| Heading block | `Head`, `Eyebrow`, `Title`, `Lede`, `Statement`, `Rule` |
| Filling the frame | `Fill` to centre, `Grow` to stretch |
| Structure | `Grid` and `Cell`, `Columns` and `Column`, `Card` |
| Inside a cell | `Kicker`, `CardTitle`, `Line` |
| Lists | `Ticks` and `Tick`, `Steps` and `Step` |
| Data | `Stat`, `Rows` and `Row`, `Checklist` and `ChecklistRow` |
| Media | `Figure`, `Code` with `Hl`, `Quote` |
| Trim | `Note`, `Badge`, `Track` |

### Rules that keep a deck looking right

- The canvas is fixed at 1280x720 and nothing scrolls. Content that does not fit
  is content to cut, not to shrink.
- One idea per slide. If a slide needs a second `Title`, it is two slides.
- `Eyebrow` above `Title` on nearly every content slide. It is what gives a deck
  its spine.
- Use `Fill` when a block should sit in the middle of the leftover space, and
  `grow` on a `Grid` when cells should stretch to the bottom.
- Set `dark` on `Slide` to flip the palette for a break slide. Same template,
  no extra CSS.
- Put speaker notes in the `notes` prop. They never render on the slide.
- Reach for inline `style` only for one-off spacing. Anything you would write
  twice belongs in the template.

## This deck

Template: `granite`. Run `list_templates` to see the alternatives and what
each is for, and `set_template` to switch. Switching restyles every slide with
no edits to slide files.
