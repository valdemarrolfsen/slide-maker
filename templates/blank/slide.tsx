import { Slide, Head, Eyebrow, Title } from 'slide-maker/runtime';

export default function BlankSlide() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Section label</Eyebrow>
        <Title>Your first slide</Title>
      </Head>
    </Slide>
  );
}
