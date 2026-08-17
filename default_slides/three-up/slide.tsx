import {
  Slide,
  Head,
  Eyebrow,
  Title,
  Grid,
  Cell,
  Kicker,
  CardTitle,
  Line,
} from 'slide-maker/runtime';

export default function ThreeUp() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>How it works</Eyebrow>
        <Title>Three steps, one loop</Title>
      </Head>

      <Grid cols={3} grow>
        <Cell pad="lg">
          <Kicker accent>01</Kicker>
          <CardTitle>Collect</CardTitle>
          <Line>Everything lands in one place, with the source still attached to it.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>02</Kicker>
          <CardTitle>Decide</CardTitle>
          <Line>One owner, one written call, made in the open rather than in a thread.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>03</Kicker>
          <CardTitle>Ship</CardTitle>
          <Line>The decision leaves as working software inside the same week.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
