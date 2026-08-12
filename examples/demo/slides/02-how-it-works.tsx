import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function HowItWorks() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>How this works</Eyebrow>
        <Title>Three surfaces, one deck</Title>
      </Head>

      <Grid cols={3} grow>
        <Cell pad="lg">
          <Kicker accent>01</Kicker>
          <CardTitle>You brief Claude</CardTitle>
          <Line>Describe the deck in your terminal. Claude writes the slide files.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>02</Kicker>
          <CardTitle>You review here</CardTitle>
          <Line>Slides reload the moment a file is saved. No build step to wait on.</Line>
        </Cell>
        <Cell pad="lg">
          <Kicker accent>03</Kicker>
          <CardTitle>You comment back</CardTitle>
          <Line>Select any text on a slide and leave a note. Claude reads it directly.</Line>
        </Cell>
      </Grid>
    </Slide>
  );
}
