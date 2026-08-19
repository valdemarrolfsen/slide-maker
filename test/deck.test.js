import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { listSlides, readConfig, setSlideHidden } from '../src/core/deck.js';

test('hidden slides stay discoverable but leave the presentation order', async () => {
  const deckDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'slide-maker-deck-'));
  try {
    await fsp.mkdir(path.join(deckDir, 'slides'));
    await fsp.writeFile(
      path.join(deckDir, 'deck.json'),
      `${JSON.stringify({ title: 'Visibility test', slides: 'slides' }, null, 2)}\n`,
    );
    await Promise.all([
      fsp.writeFile(path.join(deckDir, 'slides/01-cover.tsx'), 'export default () => null;\n'),
      fsp.writeFile(path.join(deckDir, 'slides/02-detail.tsx'), 'export default () => null;\n'),
      fsp.writeFile(path.join(deckDir, 'slides/03-close.tsx'), 'export default () => null;\n'),
    ]);

    const hidden = await setSlideHidden(deckDir, '2', true);
    assert.equal(hidden.id, '02-detail');
    assert.equal(hidden.hidden, true);

    const config = await readConfig(deckDir);
    assert.deepEqual(config.hiddenSlides, ['02-detail']);

    const visible = await listSlides(deckDir, config);
    assert.deepEqual(
      visible.map(({ id, index, number }) => ({ id, index, number })),
      [
        { id: '01-cover', index: 0, number: 1 },
        { id: '03-close', index: 1, number: 2 },
      ],
    );

    const all = await listSlides(deckDir, config, { includeHidden: true });
    assert.deepEqual(
      all.map(({ id, hidden: isHidden }) => ({ id, hidden: isHidden })),
      [
        { id: '01-cover', hidden: false },
        { id: '02-detail', hidden: true },
        { id: '03-close', hidden: false },
      ],
    );

    await setSlideHidden(deckDir, '02-detail.tsx', false);
    assert.deepEqual((await readConfig(deckDir)).hiddenSlides, []);
  } finally {
    await fsp.rm(deckDir, { recursive: true, force: true });
  }
});
