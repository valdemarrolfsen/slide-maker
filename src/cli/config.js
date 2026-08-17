import fs from 'node:fs';
import path from 'node:path';
import { resolveDeckDir, userConfigFile, userDir } from '../core/paths.js';
import {
  readUserConfig,
  readUserConfigFile,
  resolveSetting,
  settings,
  setUserSetting,
  unsetUserSetting,
  userDefaults,
} from '../core/user-config.js';
import { listTemplates, resolveTemplate } from '../core/templates.js';
import { listStyles, resolveStyle } from '../core/styles.js';
import {
  craftingBrief,
  createCustomTemplate,
  removeCustomTemplate,
  saveDeckAsTemplate,
} from '../core/custom-template.js';
import { color, fail, ok } from '../core/log.js';

function shown(value) {
  if (value === null || value === undefined || value === '') return color.dim('not set');
  return String(value);
}

/** Rejects a default that names something not installed, since the failure
 *  would otherwise surface much later, inside an unrelated `init`. */
async function validate(setting, value) {
  if (setting.kind === 'template' && !(await resolveTemplate(value))) {
    const available = (await listTemplates()).map((t) => t.name).join(', ');
    fail(`No template named "${value}".`, `Available: ${available}`);
  }
  if (setting.kind === 'style' && !(await resolveStyle(null, value))) {
    const available = (await listStyles(null)).map((s) => s.name).join(', ');
    fail(`No style named "${value}".`, `Available: ${available}`);
  }
}

export async function configListCommand() {
  const [stored, effective, templates] = await Promise.all([
    readUserConfigFile(),
    readUserConfig(),
    listTemplates(),
  ]);
  const custom = templates.filter((template) => template.source === 'user');

  console.log('');
  console.log(`  ${color.dim(userConfigFile())}`);
  console.log('');
  for (const setting of settings) {
    const explicit = setting.key in stored;
    const marker = explicit ? color.green('●') : color.dim('○');
    const value = shown(effective[setting.key]);
    const note = explicit ? '' : color.dim('  (default)');
    console.log(`  ${marker} ${color.bold(setting.key)}  ${value}${note}`);
    console.log(`      ${color.dim(setting.describe)}`);
  }

  console.log('');
  if (custom.length) {
    console.log(`  ${color.bold('Your templates')}`);
    for (const template of custom) {
      console.log(`    ${template.name}  ${color.dim(template.description)}`);
    }
  } else {
    console.log(color.dim('  No templates of your own yet.'));
    console.log(
      color.dim('  Ask Claude to craft one from a project, or run `slide-maker config new-template <name>`.'),
    );
  }
  console.log('');
  console.log(color.dim('  Change a setting with `slide-maker config set <key> <value>`.'));
  console.log('');
}

export async function configPathCommand() {
  console.log(userDir());
}

export async function configGetCommand(key) {
  const config = await readUserConfig();
  if (!key) {
    for (const setting of settings) console.log(`${setting.key}=${config[setting.key] ?? ''}`);
    return;
  }
  const setting = resolveSetting(key);
  if (!setting) {
    fail(`Unknown setting "${key}".`, `Known settings: ${settings.map((s) => s.key).join(', ')}`);
  }
  console.log(config[setting.key] ?? '');
}

export async function configSetCommand(key, value) {
  const setting = resolveSetting(key);
  if (!setting) {
    fail(`Unknown setting "${key}".`, `Known settings: ${settings.map((s) => s.key).join(', ')}`);
  }
  await validate(setting, value);
  await setUserSetting(setting.key, value);
  ok(`${color.bold(setting.key)} set to ${color.bold(value)}.`);
  console.log(`  ${color.dim(`Stored in ${userConfigFile()}`)}`);
}

export async function configUnsetCommand(key) {
  const setting = resolveSetting(key);
  if (!setting) {
    fail(`Unknown setting "${key}".`, `Known settings: ${settings.map((s) => s.key).join(', ')}`);
  }
  await unsetUserSetting(setting.key);
  ok(`${color.bold(setting.key)} back to its default (${shown(userDefaults[setting.key])}).`);
}

export async function configTemplatesCommand() {
  const templates = (await listTemplates()).filter((template) => template.source === 'user');
  console.log('');
  if (!templates.length) {
    console.log(color.dim(`  No templates in ${userDir()}.`));
    console.log('');
    console.log(color.dim('  Create one with `slide-maker config new-template <name>`,'));
    console.log(color.dim('  or save a deck you like with `slide-maker config save-template <name>`.'));
    console.log('');
    return;
  }
  const active = (await readUserConfig()).defaultTemplate;
  for (const template of templates) {
    const marker = template.name === active ? color.green('●') : color.dim('○');
    console.log(`  ${marker} ${color.bold(template.name)}  ${color.dim(`style: ${template.defaultStyle}`)}`);
    if (template.description) console.log(`      ${color.dim(template.description)}`);
    if (template.craftedFrom) console.log(`      ${color.dim(`from ${template.craftedFrom}`)}`);
    console.log(`      ${color.dim(template.dir)}`);
  }
  console.log('');
  console.log(color.dim('  Preview one with `slide-maker browse <name>`.'));
  console.log(color.dim('  Make one the default with `slide-maker config set defaultTemplate <name>`.'));
  console.log('');
}

export async function configNewTemplateCommand(name, options) {
  const result = await createCustomTemplate({
    name,
    label: options.label,
    description: options.description,
    basedOn: options.from,
    style: options.style,
    baseStyle: options.baseStyle,
    craftedFrom: options.source ? path.resolve(process.cwd(), options.source) : '',
    force: options.force,
  });

  console.log('');
  ok(`Scaffolded ${color.bold(name)} in ${color.cyan(userDir())}`);
  console.log(`  ${color.dim('template')} ${result.template.dir}`);
  if (result.style) console.log(`  ${color.dim('style')}    ${result.style.dir}`);
  else console.log(`  ${color.dim('style')}    ${result.styleName} (existing)`);
  console.log('');
  console.log(`  ${color.bold('Next')}`);
  console.log(`    ${color.dim('Open Claude Code and say:')}`);
  console.log(
    `    "craft the ${name} template from ${options.source || '<path to the project or dist>'}"`,
  );
  console.log('');
  console.log(color.dim(`    slide-maker browse ${name}`));
  console.log(color.dim(`    slide-maker config set defaultTemplate ${name}`));
  console.log('');
}

export async function configSaveTemplateCommand(name, dir, options) {
  const deckDir = resolveDeckDir(dir);
  if (!fs.existsSync(path.join(deckDir, 'deck.json'))) {
    fail(`${deckDir} is not a slide-maker deck.`, 'Run this from a deck, or pass its directory.');
  }
  const result = await saveDeckAsTemplate({
    name,
    deckDir,
    label: options.label,
    description: options.description,
    force: options.force,
  });
  console.log('');
  ok(`Saved ${color.cyan(path.relative(process.cwd(), deckDir) || '.')} as ${color.bold(name)}`);
  console.log(`  ${color.dim('template')} ${result.template.dir}`);
  if (result.style) console.log(`  ${color.dim('style')}    ${result.style.dir}`);
  console.log('');
  console.log(color.dim(`  Start a deck from it with \`slide-maker init --template ${name}\`.`));
  console.log('');
}

export async function configRemoveTemplateCommand(name, options) {
  const removed = await removeCustomTemplate(name, { withStyle: options.style });
  ok(`Removed ${color.bold(name)}.`);
  for (const dir of removed) console.log(`  ${color.dim('-')} ${dir}`);
}

/** The same brief the MCP tool returns, for anyone working without MCP. */
export async function configBriefCommand(name) {
  const template = await resolveTemplate(name);
  if (!template) {
    const available = (await listTemplates()).map((t) => t.name).join(', ');
    fail(`No template named "${name}".`, `Available: ${available}`);
  }
  const style = await resolveStyle(null, template.defaultStyle);
  console.log(
    craftingBrief({
      template,
      styleName: template.defaultStyle,
      styleDir: style?.dir,
      craftedFrom: template.craftedFrom,
    }),
  );
}
