import path from 'node:path';
import fsp from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listSlides, readConfig, readSlide, writeConfig } from '../core/deck.js';
import { listStyles, resolveStyle } from '../core/styles.js';
import {
  listDefaultSlides,
  readDefaultSlideSource,
} from '../core/default-slides.js';
import { listTemplates, resolveTemplate } from '../core/templates.js';
import { craftingBrief, createCustomTemplate } from '../core/custom-template.js';
import { readUserConfig, setUserSetting } from '../core/user-config.js';
import { userDir } from '../core/paths.js';
import { listComments, readState, resolveComment, reopenComment } from '../core/comments.js';
import { renderSlides, closeRenderer } from '../render/renderer.js';

/** Wraps a plain string as MCP text content. */
function text(value) {
  return { content: [{ type: 'text', text: value }] };
}

function json(value) {
  return text(JSON.stringify(value, null, 2));
}

/**
 * The bridge between a deck on disk and Claude Code.
 *
 * Deliberately read-mostly. Claude already edits slide files with its own file
 * tools, so duplicating that here would only create two ways to do the same
 * thing. What it cannot get any other way is the review state: which comments
 * are open, what text they point at, which slide is on screen, and what the
 * deck actually looks like once rendered.
 */
export async function startMcpServer(deckDir) {
  const server = new McpServer(
    { name: 'slide-maker', version: '0.6.0' },
    {
      instructions: [
        'This project is a slide-maker deck. Slides are JSX modules under the deck',
        'directory, rendered live in a browser studio the user is watching.',
        '',
        'Your job is the slide files. The user runs the studio: never start, stop or',
        'inspect a dev server, and never fetch localhost. render_slide brings up its',
        'own renderer and works whether or not the studio is open.',
        '',
        'A template is the full starter deck. A style is its design system. A default',
        'slide is one reusable layout offered by that template in the studio.',
        '',
        'Working rules:',
        '- Call deck_overview first. It reports the style, the slide list and how',
        '  many comments are waiting.',
        '- Call list_default_slides early and often. The library is the fastest way to',
        '  decide what each slide should be, and read_default_slide hands you the JSX to',
        '  copy into a new slide file. Check it before building a layout by hand.',
        '- The user leaves feedback by selecting text in the studio. Call list_comments',
        '  to read it. Each comment names the file it belongs to and quotes the exact',
        '  text it was left on, so search the file for that quote.',
        '- After acting on a comment, call resolve_comment so it clears from the',
        '  user\'s panel. Say what you changed in the note argument.',
        '- Compose slides from the components exported by "slide-maker/runtime"',
        '  rather than raw HTML, otherwise switching style will not restyle them.',
        '- Call render_slide to see your own work before claiming a slide is done.',
        '- When the user wants their own look, or points you at a product, brand site or',
        '  dist directory and asks for a template, call create_custom_template. It',
        '  scaffolds the template into their slide-maker home, where every future deck',
        '  can reach it, and returns the brief for filling it in.',
      ].join('\n'),
    },
  );

  /* ── Reading the deck ── */

  server.registerTool(
    'deck_overview',
    {
      title: 'Deck overview',
      description:
        'The state of the deck: title, active style, every slide in running order, ' +
        'how many default slides are available, and which ' +
        'slide the user is currently looking at. Start here.',
      inputSchema: {},
    },
    async () => {
      const config = await readConfig(deckDir);
      const template = await resolveTemplate(config.template);
      const [slides, comments, state, style, defaultSlides] = await Promise.all([
        listSlides(deckDir, config, { includeHidden: true }),
        listComments(deckDir),
        readState(deckDir),
        resolveStyle(deckDir, config.style),
        listDefaultSlides(deckDir, template?.defaultSlides),
      ]);
      const open = comments.filter((c) => c.status === 'open');
      return json({
        deckDir,
        title: config.title,
        template: config.template,
        templateGuidance: template?.guidance || null,
        style: config.style,
        styleFound: Boolean(style),
        styleGuidance: style?.guidance || null,
        canvas: `${config.width}x${config.height}`,
        slideCount: slides.filter((slide) => !slide.hidden).length,
        hiddenSlideCount: slides.filter((slide) => slide.hidden).length,
        openComments: open.length,
        // Surfaced here so the library is visible from the first call, rather
        // than only to whoever thinks to go looking for it.
        defaultSlidesAvailable: defaultSlides.length,
        defaultSlideHint:
          'Reusable layouts for this template. Call list_default_slides before building one by hand.',
        viewing: state.slideId
          ? { slideId: state.slideId, slideNumber: (state.slideIndex ?? 0) + 1 }
          : null,
        slides: slides.map((s) => ({
          number: s.number,
          id: s.id,
          file: s.file,
          hidden: s.hidden,
        })),
      });
    },
  );

  server.registerTool(
    'read_slide',
    {
      title: 'Read a slide',
      description: 'The source of one slide, by id (its filename without extension) or by number.',
      inputSchema: {
        slide: z.string().describe('Slide id such as "02-agenda", or a slide number such as "2"'),
      },
    },
    async ({ slide }) => {
      const config = await readConfig(deckDir);
      const found = await readSlide(deckDir, config, slide);
      if (!found) return text(`No slide matches "${slide}".`);
      return text(`${found.file}\n\n${found.source}`);
    },
  );

  /* ── Feedback ── */

  server.registerTool(
    'list_comments',
    {
      title: 'List comments',
      description:
        'Feedback the user left in the studio. Each comment names the slide file it ' +
        'belongs to and, when it came from a text selection, quotes the exact words it ' +
        'was left on along with the surrounding text.',
      inputSchema: {
        status: z
          .enum(['open', 'resolved', 'all'])
          .default('open')
          .describe('Which comments to return. Defaults to open.'),
        slide: z.string().optional().describe('Restrict to one slide id.'),
      },
    },
    async ({ status, slide }) => {
      const comments = await listComments(deckDir, { status, slideId: slide });
      if (!comments.length) {
        return text(status === 'open' ? 'No open comments.' : 'No comments match.');
      }
      return json(
        comments.map((c) => ({
          id: c.id,
          file: c.slideFile,
          slideNumber: c.slideNumber,
          status: c.status,
          comment: c.body,
          onText: c.quote,
          context: c.context,
          createdAt: c.createdAt,
        })),
      );
    },
  );

  server.registerTool(
    'resolve_comment',
    {
      title: 'Resolve a comment',
      description:
        'Marks a comment done, which clears it from the user\'s panel in the studio. ' +
        'Call this once you have actually made the change, and say what you did.',
      inputSchema: {
        id: z.string().describe('The comment id from list_comments'),
        note: z.string().optional().describe('What you changed, shown to the user'),
      },
    },
    async ({ id, note }) => {
      const comment = await resolveComment(deckDir, id, note);
      return text(comment ? `Resolved ${id}.` : `No comment with id ${id}.`);
    },
  );

  server.registerTool(
    'reopen_comment',
    {
      title: 'Reopen a comment',
      description: 'Moves a resolved comment back to open, if it was closed prematurely.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      const comment = await reopenComment(deckDir, id);
      return text(comment ? `Reopened ${id}.` : `No comment with id ${id}.`);
    },
  );

  /* ── Styles ── */

  server.registerTool(
    'list_styles',
    {
      title: 'List styles',
      description:
        'Available design systems with guidance on what each is for. Read this before ' +
        'starting a new deck and pick the one that matches the audience.',
      inputSchema: {},
    },
    async () => {
      const styles = await listStyles(deckDir);
      return json(
        styles.map((s) => ({
          name: s.name,
          label: s.label,
          description: s.description,
          tags: s.tags,
          dark: s.dark,
          guidance: s.guidance,
          source: s.source,
        })),
      );
    },
  );

  server.registerTool(
    'set_style',
    {
      title: 'Set the style',
      description:
        'Switches the deck to a different design system. Restyles every slide ' +
        'immediately, with no edits to slide files, provided they are built from ' +
        'runtime components.',
      inputSchema: { name: z.string().describe('Style name from list_styles') },
    },
    async ({ name }) => {
      const style = await resolveStyle(deckDir, name);
      if (!style) {
        const available = (await listStyles(deckDir)).map((s) => s.name).join(', ');
        return text(`No style named "${name}". Available: ${available}`);
      }
      const config = await readConfig(deckDir);
      await writeConfig(deckDir, { ...config, style: name });
      return text(`Style set to ${name}. The studio has reloaded.\n\n${style.guidance}`);
    },
  );

  /* ── Templates ── */

  server.registerTool(
    'list_templates',
    {
      title: 'List templates',
      description:
        'Complete starter decks available on this machine: the built-in ones and any ' +
        'the user has crafted and stored. Read this before creating another template, ' +
        'since the user may already have the one they are describing.',
      inputSchema: {},
    },
    async () => {
      const [templates, user] = await Promise.all([listTemplates(), readUserConfig()]);
      return json({
        home: userDir(),
        defaultTemplate: user.defaultTemplate,
        defaultStyle: user.defaultStyle,
        templates: templates.map((t) => ({
          name: t.name,
          label: t.label,
          description: t.description,
          tags: t.tags,
          defaultStyle: t.defaultStyle,
          guidance: t.guidance,
          source: t.source,
          craftedFrom: t.craftedFrom || undefined,
          dir: t.source === 'user' ? t.dir : undefined,
        })),
      });
    },
  );

  server.registerTool(
    'create_custom_template',
    {
      title: 'Create a custom template',
      description:
        'Scaffolds a template of the user\'s own and returns the brief for crafting it. ' +
        'Reach for this when the user points at a product, brand site or dist directory ' +
        'and asks for a deck that looks like it. The skeleton lands in the user\'s ' +
        'slide-maker home rather than in this deck, so every future deck on the machine ' +
        'can start from it. It writes a forked style with every design token in place and ' +
        'a template with starter slides and a layout stylesheet; you then read the source ' +
        'project and fill those files in with your own file tools. Follow the returned ' +
        'brief, then verify by starting a scratch deck from the template and rendering it.',
      inputSchema: {
        name: z
          .string()
          .describe('Lowercase name, such as "acme-brand". Becomes the template and style name.'),
        label: z.string().optional().describe('Human name, such as "Acme brand"'),
        description: z.string().optional().describe('One line on what the template is for'),
        guidance: z
          .string()
          .optional()
          .describe('Notes for a future session on how to use this template well'),
        source: z
          .string()
          .optional()
          .describe('Path or URL the design comes from, recorded in the manifest'),
        basedOn: z
          .string()
          .optional()
          .describe('Template to take the starting slides and layout from. Defaults to blank.'),
        style: z
          .string()
          .optional()
          .describe('Use an existing style instead of creating one for this template'),
        baseStyle: z
          .string()
          .optional()
          .describe('Style to fork the new one from. Pick the closest built-in.'),
        force: z.boolean().optional().describe('Overwrite a template of the same name'),
      },
    },
    async ({ name, label, description, guidance, source, basedOn, style, baseStyle, force }) => {
      try {
        const result = await createCustomTemplate({
          name,
          label,
          description,
          guidance,
          basedOn: basedOn || 'blank',
          style,
          baseStyle,
          craftedFrom: source || '',
          force: Boolean(force),
        });
        return text(
          `Scaffolded "${name}" in ${userDir()}, forked from the ${result.basedOn} template.\n\n` +
            craftingBrief({
              template: result.template,
              styleName: result.styleName,
              styleDir: result.styleDir,
              craftedFrom: source || '',
            }),
        );
      } catch (err) {
        // A name that is already taken is the common failure, and the useful
        // next step is reading the brief rather than retrying with force.
        return text(
          `${err.message}\n\nRun \`slide-maker config brief ${name}\` to see what an existing ` +
            'template still needs filled in.',
        );
      }
    },
  );

  server.registerTool(
    'set_default_template',
    {
      title: 'Set the default template',
      description:
        'Changes what `slide-maker init` starts from on this machine, for every future ' +
        'deck. Use it only when the user asks for a default; it does not affect this deck.',
      inputSchema: {
        template: z.string().describe('Template name from list_templates'),
        style: z
          .string()
          .optional()
          .describe('Also pin the style, overriding what each template recommends'),
      },
    },
    async ({ template, style }) => {
      if (!(await resolveTemplate(template))) {
        const available = (await listTemplates()).map((t) => t.name).join(', ');
        return text(`No template named "${template}". Available: ${available}`);
      }
      await setUserSetting('defaultTemplate', template);
      if (style) {
        if (!(await resolveStyle(null, style))) {
          const available = (await listStyles(null)).map((s) => s.name).join(', ');
          return text(
            `Default template set to ${template}, but there is no style named "${style}". ` +
              `Available: ${available}`,
          );
        }
        await setUserSetting('defaultStyle', style);
      }
      return text(
        `New decks will start from ${template}${style ? ` in the ${style} style` : ''}.`,
      );
    },
  );

  /* ── Default slides ── */

  server.registerTool(
    'list_default_slides',
    {
      title: 'List default slides',
      description:
        'The default-slide library: ready-made slide layouts, with guidance on when each ' +
        'one is the right shape. Default slides carry no colour of their own, so any of ' +
        'them renders in the deck\'s style. Read this before building a layout by ' +
        'hand, and again whenever you plan a run of slides: picking a default slide per ' +
        'slide is most of what deck structure is.',
      inputSchema: {},
    },
    async () => {
      const config = await readConfig(deckDir);
      const template = await resolveTemplate(config.template);
      const defaultSlides = await listDefaultSlides(deckDir, template?.defaultSlides);
      return json(
        defaultSlides.map((t) => ({
          name: t.name,
          label: t.label,
          description: t.description,
          tags: t.tags,
          guidance: t.guidance,
          source: t.source,
        })),
      );
    },
  );

  server.registerTool(
    'read_default_slide',
    {
      title: 'Read a default slide',
      description:
        'The JSX behind one default slide. Copy it into a new file under the slides ' +
        'directory with your own content: the structure is the part worth keeping. ' +
        'Faster and safer than composing a layout from scratch, since every default slide ' +
        'has been checked in every style.',
      inputSchema: { name: z.string().describe('Default slide name from list_default_slides') },
    },
    async ({ name }) => {
      const config = await readConfig(deckDir);
      const template = await resolveTemplate(config.template);
      const allowed = await listDefaultSlides(deckDir, template?.defaultSlides);
      const defaultSlide = allowed.find((item) => item.name === name) || null;
      if (!defaultSlide) {
        const available = allowed.map((item) => item.name).join(', ');
        return text(`No default slide named "${name}". Available: ${available}`);
      }
      const source = await readDefaultSlideSource(defaultSlide);
      return text(`${defaultSlide.label}\n\n${defaultSlide.guidance}\n\n${source}`);
    },
  );

  /* ── Seeing the result ── */

  server.registerTool(
    'render_slide',
    {
      title: 'Render a slide',
      description:
        'Renders slides to PNG and returns the images, so you can check your own work ' +
        'before telling the user it is done. Catches layout problems that reading the ' +
        'source cannot, such as text overflowing the frame.',
      inputSchema: {
        slide: z
          .string()
          .optional()
          .describe('Slide id or number. Omit to render every slide in the deck.'),
      },
    },
    async ({ slide }) => {
      const config = await readConfig(deckDir);
      const slides = await listSlides(deckDir, config);
      const wanted = slide
        ? slides.filter((s) => s.id === slide || String(s.number) === String(slide))
        : slides;

      if (!wanted.length) return text(`No slide matches "${slide}".`);
      // Every slide at once would blow past a sensible response size.
      if (wanted.length > 12) {
        return text(
          `That would render ${wanted.length} slides. Render them in smaller batches, ` +
            'or pass a single slide id.',
        );
      }

      try {
        const shots = await renderSlides({ deckDir, config, slides: wanted });
        return {
          content: shots.flatMap((shot) => [
            { type: 'text', text: `Slide ${shot.number}: ${shot.file}` },
            { type: 'image', data: shot.base64, mimeType: 'image/png' },
          ]),
        };
      } catch (err) {
        return text(`Could not render: ${err.message}`);
      }
    },
  );

  /* ── Housekeeping ── */

  server.registerTool(
    'deck_files',
    {
      title: 'Deck file layout',
      description:
        'Where things live in this deck: the slides directory, the assets directory, ' +
        'and the config file. Useful before creating a new slide file.',
      inputSchema: {},
    },
    async () => {
      const config = await readConfig(deckDir);
      const slides = await listSlides(deckDir, config, { includeHidden: true });
      const next = slides.length + 1;
      return json({
        deckDir,
        config: path.join(deckDir, 'deck.json'),
        slidesDir: path.join(deckDir, config.slides),
        assetsDir: path.join(deckDir, config.assets),
        namingConvention:
          'Slides are ordered by the number at the start of the filename, so reordering ' +
          'a deck is a rename. Prefix new files with a zero-padded number.',
        suggestedNextFile: path.join(
          deckDir,
          config.slides,
          `${String(next).padStart(2, '0')}-name.tsx`,
        ),
        importFrom: 'slide-maker/runtime',
      });
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const shutdown = async () => {
    await closeRenderer().catch(() => {});
    await server.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return server;
}

/** Sanity check used by the CLI before starting: is this actually a deck? */
export async function assertDeck(deckDir) {
  try {
    await fsp.access(path.join(deckDir, 'deck.json'));
    return true;
  } catch {
    return false;
  }
}
