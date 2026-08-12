import { Slide, Head, Eyebrow, Title, Fill, Ticks, Tick, Note } from 'slide-maker/runtime';

export default function TryIt() {
  return (
    <Slide notes="Reminder: select the sentence below and leave a comment, to see the loop close.">
      <Head>
        <Eyebrow>Try it now</Eyebrow>
        <Title>Select this sentence and tell Claude to rewrite it.</Title>
      </Head>

      <Fill>
        <Ticks>
          <Tick>
            <b>Select text</b> anywhere on a slide to comment on those exact words.
          </Tick>
          <Tick>
            <b>Pin a note</b> to drop a marker on a specific spot in the layout.
          </Tick>
          <Tick>
            <b>Press C</b> to leave a note about the whole slide.
          </Tick>
        </Ticks>
      </Fill>

      <Note>
        Delete these starter slides once you are ready. Ask Claude to swap the style and
        the whole deck restyles, with no edits to any slide.
      </Note>
    </Slide>
  );
}
