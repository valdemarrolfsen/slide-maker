import {
  Slide,
  Head,
  Eyebrow,
  Title,
  Grid,
  Cell,
  Kicker,
  CardTitle,
  Ticks,
  Tick,
} from 'slide-maker/runtime';

export default function Comparison() {
  return (
    <Slide>
      <Head>
        <Eyebrow>The proposal</Eyebrow>
        <Title>What changes, and what it buys us</Title>
      </Head>

      <Grid cols={2} grow>
        <Cell pad="lg">
          <Kicker>Today</Kicker>
          <CardTitle>Four tools, no owner</CardTitle>
          <Ticks>
            <Tick>Requests arrive in three places and are triaged in none of them.</Tick>
            <Tick>Nobody can say how long the queue is without asking someone.</Tick>
            <Tick>The same question gets answered from scratch every fortnight.</Tick>
          </Ticks>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>Proposed</Kicker>
          <CardTitle>One queue, one owner</CardTitle>
          <Ticks>
            <Tick>Every request lands in the same queue, whatever door it came through.</Tick>
            <Tick>Queue length and age are on a dashboard, updated hourly.</Tick>
            <Tick>Answers are written once and linked to from then on.</Tick>
          </Ticks>
        </Cell>
      </Grid>
    </Slide>
  );
}
