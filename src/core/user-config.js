import fsp from 'node:fs/promises';
import path from 'node:path';
import { userConfigFile } from './paths.js';

/**
 * Machine-wide settings, read by `init` and edited through `slide-maker config`.
 *
 * Kept separate from a deck's `deck.json`: this file answers "what does a new
 * deck start as on this machine", while `deck.json` answers "what is this deck".
 * A deck stays portable because nothing here is required to open one.
 */

export const userDefaults = {
  /** Template `init` starts from when the user does not pick one. */
  defaultTemplate: 'blank',
  /** Style `init` uses. Null means "whatever the template recommends". */
  defaultStyle: null,
  /** Author written into new decks. */
  author: '',
};

/** The settings `config set` accepts, with the aliases people actually type. */
export const settings = [
  {
    key: 'defaultTemplate',
    aliases: ['template', 'default-template', 'default_template'],
    kind: 'template',
    describe: 'template `init` starts from',
  },
  {
    key: 'defaultStyle',
    aliases: ['style', 'default-style', 'default_style'],
    kind: 'style',
    describe: 'style `init` uses, overriding the template\'s recommendation',
  },
  {
    key: 'author',
    aliases: [],
    kind: 'text',
    describe: 'author written into new decks',
  },
];

export class UserConfigError extends Error {}

/** Resolves a user-typed key to a setting, case- and dash-insensitively. */
export function resolveSetting(key) {
  const wanted = String(key || '')
    .toLowerCase()
    .replace(/[-_]/g, '');
  return (
    settings.find(
      (setting) =>
        setting.key.toLowerCase() === wanted ||
        setting.aliases.some((alias) => alias.toLowerCase().replace(/[-_]/g, '') === wanted),
    ) || null
  );
}

/** What is actually on disk, with nothing filled in. */
export async function readUserConfigFile() {
  let raw;
  try {
    raw = await fsp.readFile(userConfigFile(), 'utf8');
  } catch {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    throw new UserConfigError(`${userConfigFile()} is not valid JSON: ${err.message}`);
  }
}

/** The settings in effect, defaults included. */
export async function readUserConfig() {
  return { ...userDefaults, ...(await readUserConfigFile()) };
}

export async function writeUserConfig(config) {
  const file = userConfigFile();
  await fsp.mkdir(path.dirname(file), { recursive: true });
  // Only the keys that differ from the defaults are stored, so a default that
  // changes in a later release reaches users who never expressed a preference.
  const stored = Object.fromEntries(
    Object.entries(config).filter(
      ([key, value]) => !(key in userDefaults) || value !== userDefaults[key],
    ),
  );
  await fsp.writeFile(file, `${JSON.stringify(stored, null, 2)}\n`, 'utf8');
  return file;
}

export async function setUserSetting(key, value) {
  const setting = resolveSetting(key);
  if (!setting) {
    throw new UserConfigError(
      `Unknown setting "${key}". Known settings: ${settings.map((s) => s.key).join(', ')}`,
    );
  }
  const config = await readUserConfigFile();
  await writeUserConfig({ ...config, [setting.key]: value });
  return setting;
}

export async function unsetUserSetting(key) {
  const setting = resolveSetting(key);
  if (!setting) {
    throw new UserConfigError(
      `Unknown setting "${key}". Known settings: ${settings.map((s) => s.key).join(', ')}`,
    );
  }
  const config = await readUserConfigFile();
  delete config[setting.key];
  await writeUserConfig(config);
  return setting;
}
