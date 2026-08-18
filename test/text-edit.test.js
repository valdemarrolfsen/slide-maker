import assert from 'node:assert/strict';
import test from 'node:test';
import { replaceSlideText } from '../src/core/text-edit.js';

test('replaces multiline JSX copy without reformatting the slide', () => {
  const source = `export default () => (
  <Tick>
    We spent longer arguing about the number than
    it would have taken to measure it.
  </Tick>
)`;
  const updated = replaceSlideText(source, {
    oldText: 'We spent longer arguing about the number than it would have taken to measure it.',
    newText: 'Measure first & discuss <later>.',
    occurrence: 0,
  });
  assert.match(updated, /\{"Measure first & discuss <later>\."\}/);
});

test('uses the rendered occurrence to update repeated copy', () => {
  const source = `const x = <><Step status="Done" /><Step status="Done" /></>`;
  const updated = replaceSlideText(source, {
    oldText: 'Done',
    newText: `Owner's review`,
    occurrence: 1,
  });
  assert.equal(updated, `const x = <><Step status="Done" /><Step status="Owner's review" /></>`);
});

test('does not count speaker notes as visible slide text', () => {
  const source = `const x = <Slide notes="Reminder"><Title>Reminder</Title></Slide>`;
  const updated = replaceSlideText(source, {
    oldText: 'Reminder',
    newText: 'Decision',
    occurrence: 0,
  });
  assert.equal(updated, `const x = <Slide notes="Reminder"><Title>{"Decision"}</Title></Slide>`);
});

test('preserves the literal quote style and escapes replacement copy', () => {
  const source = `const x = <Cover title='It\\'s ready' />`;
  const updated = replaceSlideText(source, {
    oldText: `It's ready`,
    newText: `We're ready`,
    occurrence: 0,
  });
  assert.equal(updated, `const x = <Cover title='We\\'re ready' />`);
});

test('rejects computed text instead of guessing at source', () => {
  assert.throws(
    () => replaceSlideText(`const title = makeTitle()`, {
      oldText: 'Computed title',
      newText: 'New title',
      occurrence: 0,
    }),
    /computed/,
  );
});
