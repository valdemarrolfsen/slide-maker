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

export default function Closing() {
  return (
    <Slide dark grid>
      <Head>
        <Eyebrow>What we need</Eyebrow>
        <Title>Three decisions, today</Title>
      </Head>

      <Grid cols={3} grow>
        <Cell pad="lg">
          <Kicker accent>Decide</Kicker>
          <CardTitle>Approve the quarter</CardTitle>
          <Line>Four engineers and a designer, from 6 April, on billing only.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>Assign</Kicker>
          <CardTitle>Name the owner</CardTitle>
          <Line>One person accountable for the number, not a steering group.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>Diarise</Kicker>
          <CardTitle>Book the review</CardTitle>
          <Line>Thirty minutes in the last week of May, against the same three metrics.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
