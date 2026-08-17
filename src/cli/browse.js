import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listTemplates, resolveTemplate } from '../core/templates.js';
import { resolveStyle } from '../core/styles.js';
import { fail } from '../core/log.js';
import { canPrompt, select } from './prompt.js';
import { startCommand } from './start.js';

async function chooseTemplate(given) {
  const templates = await listTemplates();
  if (given) return resolveTemplate(given);
  if (!canPrompt()) return templates[0] || null;
  const name = await select({
    message: 'Browse template',
    hint: 'opens a disposable preview in the studio',
    choices: templates.map((template) => ({
      value: template.name,
      label: template.label,
      note: template.description,
    })),
  });
  return name === null ? null : resolveTemplate(name);
}

export async function browseCommand(name, options) {
  const template = await chooseTemplate(name);
  if (!template) {
    const available = (await listTemplates()).map((item) => item.name).join(', ');
    fail(name ? `No template named "${name}".` : 'No template selected.', `Available: ${available}`);
  }
  const styleName = options.style || template.defaultStyle;
  if (!(await resolveStyle(null, styleName))) fail(`No style named "${styleName}".`);

  const previewDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'slide-maker-browse-'));
  await fsp.cp(template.slidesDir, path.join(previewDir, 'slides'), { recursive: true });
  if (fs.existsSync(template.assetsDir)) {
    await fsp.cp(template.assetsDir, path.join(previewDir, 'assets'), { recursive: true });
  } else {
    await fsp.mkdir(path.join(previewDir, 'assets'));
  }
  if (template.stylesheet) {
    await fsp.copyFile(template.stylesheet, path.join(previewDir, 'template.css'));
  }
  await fsp.writeFile(
    path.join(previewDir, 'deck.json'),
    `${JSON.stringify({
      title: `${template.label} · preview`,
      author: '',
      template: template.name,
      style: styleName,
      layout: 'template.css',
      width: 1280,
      height: 720,
      slides: 'slides',
      assets: 'assets',
    }, null, 2)}\n`,
  );

  // The directory is unique and disposable; browsing must never mutate the
  // package's bundled source decks.
  process.once('exit', () => fs.rmSync(previewDir, { recursive: true, force: true }));
  return startCommand(previewDir, options);
}
