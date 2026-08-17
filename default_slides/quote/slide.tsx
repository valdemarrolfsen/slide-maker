import { Slide, Head, Eyebrow, Title, Fill, Quote, Track } from 'slide-maker/runtime';

export default function QuoteSlide() {
  return (
    <Slide>
      <Head>
        <Eyebrow>From the interviews</Eyebrow>
        <Title>They told us the same thing eleven times</Title>
      </Head>

      <Fill>
        <Quote cite="Operations lead, 400-person logistics firm">
          We did not need it to be faster. We needed to be able to explain to a customer why
          it had not happened yet.
        </Quote>
      </Fill>

      <Track>14 interviews · January 2026</Track>
    </Slide>
  );
}
