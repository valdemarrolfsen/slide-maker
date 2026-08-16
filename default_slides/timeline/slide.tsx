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

export default function Timeline() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>Plan</Eyebrow>
        <Title>Four phases to the end of the year</Title>
      </Head>

      <Grid cols={4} grow>
        <Cell pad="md">
          <Kicker accent>Q1 · now</Kicker>
          <CardTitle>Discovery</CardTitle>
          <Line>Ends with a written scope and a number we both agree on.</Line>
        </Cell>
        <Cell pad="md">
          <Kicker>Q2</Kicker>
          <CardTitle>Pilot</CardTitle>
          <Line>Two teams, running in production, with a way to turn it off.</Line>
        </Cell>
        <Cell pad="md">
          <Kicker>Q3</Kicker>
          <CardTitle>Rollout</CardTitle>
          <Line>Everyone migrated, old path still standing behind a flag.</Line>
        </Cell>
        <Cell pad="md">
          <Kicker>Q4</Kicker>
          <CardTitle>Retire</CardTitle>
          <Line>Old path deleted, and the maintenance budget with it.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
