import { Slide, Head, Eyebrow, Title, Fill, Ticks, Tick } from 'slide-maker/runtime';

export default function Points() {
  return (
    <Slide>
      <Head>
        <Eyebrow>What we learned</Eyebrow>
        <Title>Three things we would do differently</Title>
      </Head>

      <Fill>
        <Ticks>
          <Tick>
            <b>Ship the smallest version first.</b> The full design took six weeks to build
            and one afternoon with real users to invalidate.
          </Tick>
          <Tick>
            <b>Instrument before launch.</b> We spent longer arguing about the number than
            it would have taken to measure it.
          </Tick>
          <Tick>
            <b>Write the announcement early.</b> Anything that is hard to describe in a
            paragraph turns out to be hard to use.
          </Tick>
        </Ticks>
      </Fill>
    </Slide>
  );
}
