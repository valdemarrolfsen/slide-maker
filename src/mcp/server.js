import path from 'node:path';
import fsp from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { listSlides, readConfig, readSlide, writeConfig } from '../core/deck.js';
import { listTemplates, resolveTemplate } from '../core/templates.js';
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
    { name: 'slide-maker', version: '0.1.0' },
    {
      instructions: [
        'This project is a slide-maker deck. Slides are JSX modules under the deck',
        'directory, rendered live in a browser studio the user is watching.',
        '',
        'Working rules:',
        '- Call deck_overview first. It reports the template, the slide list and how',
        '  many comments are waiting.',
        '- The user leaves feedback by selecting text in the studio. Call list_comments',
        '  to read it. Each comment names the file it belongs to and quotes the exact',
        '  text it was left on, so search the file for that quote.',
        '- After acting on a comment, call resolve_comment so it clears from the',
        '  user\'s panel. Say what you changed in the note argument.',
        '- Compose slides from the components exported by "slide-maker/runtime"',
        '  rather than raw HTML, otherwise switching template will not restyle them.',
        '- Call render_slide to see your own work before claiming a slide is done.',
      ].join('\n'),
    },
  );

  /* ── Reading the deck ── */

  server.registerTool(
    'deck_overview',
    {
      title: 'Deck overview',
      description:
        'The state of the deck: title, active template, every slide in running order, ' +
        'how many comments are open, and which slide the user is currently looking at. ' +
        'Start here.',
      inputSchema: {},
    },
    async () => {
      const config = await readConfig(deckDir);
      const [slides, comments, state, template] = await Promise.all([
        listSlides(deckDir, config),
        listComments(deckDir),
        readState(deckDir),
        resolveTemplate(deckDir, config.template),
      ]);
      const open = comments.filter((c) => c.status === 'open');
      return json({
        deckDir,
        title: config.title,
        template: config.template,
        templateFound: Boolean(template),
        templateGuidance: template?.guidance || null,
        canvas: `${config.width}x${config.height}`,
        slideCount: slides.length,
        openComments: open.length,
        viewing: state.slideId
          ? { slideId: state.slideId, slideNumber: (state.slideIndex ?? 0) + 1 }
          : null,
        slides: slides.map((s) => ({ number: s.number, id: s.id, file: s.file })),
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

  /* ── Templates ── */

  server.registerTool(
    'list_templates',
    {
      title: 'List templates',
      description:
        'Available slide templates with guidance on what each is for. Read this before ' +
        'starting a new deck and pick the one that matches the audience.',
      inputSchema: {},
    },
    async () => {
      const templates = await listTemplates(deckDir);
      return json(
        templates.map((t) => ({
          name: t.name,
          label: t.label,
          description: t.description,
          tags: t.tags,
          dark: t.dark,
          guidance: t.guidance,
          source: t.source,
        })),
      );
    },
  );

  server.registerTool(
    'set_template',
    {
      title: 'Set the template',
      description:
        'Switches the deck to a different template. Restyles every slide immediately, ' +
        'with no edits to slide files, provided they are built from runtime components.',
      inputSchema: { name: z.string().describe('Template name from list_templates') },
    },
    async ({ name }) => {
      const template = await resolveTemplate(deckDir, name);
      if (!template) {
        const available = (await listTemplates(deckDir)).map((t) => t.name).join(', ');
        return text(`No template named "${name}". Available: ${available}`);
      }
      const config = await readConfig(deckDir);
      await writeConfig(deckDir, { ...config, template: name });
      return text(`Template set to ${name}. The studio has reloaded.\n\n${template.guidance}`);
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
      const slides = await listSlides(deckDir, config);
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
