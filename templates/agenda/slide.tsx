import { Slide, Head, Eyebrow, Title, Steps, Step } from 'slide-maker/runtime';

export default function Agenda() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>Agenda</Eyebrow>
        <Title>What we will cover</Title>
      </Head>

      <Steps>
        <Step n={1} title="Where we ended last quarter" badge="10 min" />
        <Step n={2} title="What changed, and what it cost" badge="15 min" />
        <Step n={3} title="The decision in front of us" badge="10 min" />
        <Step n={4} title="Questions" badge="15 min" />
      </Steps>
    </Slide>
  );
}
