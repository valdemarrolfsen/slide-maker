import pc from 'picocolors';

const tag = pc.dim('slide-maker');

export function info(msg) {
  console.log(`${tag} ${msg}`);
}

export function step(msg) {
  console.log(`${tag} ${pc.cyan('›')} ${msg}`);
}

export function ok(msg) {
  console.log(`${tag} ${pc.green('✓')} ${msg}`);
}

export function warn(msg) {
  console.warn(`${tag} ${pc.yellow('!')} ${msg}`);
}

export function error(msg) {
  console.error(`${tag} ${pc.red('✗')} ${msg}`);
}

/** Prints an error and exits. Used for user-facing failures where a stack
 *  trace would be noise rather than signal. */
export function fail(msg, hint) {
  error(msg);
  if (hint) console.error(`  ${pc.dim(hint)}`);
  process.exit(1);
}

export const color = pc;
