import { Slide, Head, Eyebrow, Title, Grid, Cell, Stat, Note } from 'slide-maker/runtime';

export default function Metrics() {
  return (
    <Slide grid>
      <Head>
        <Eyebrow>Since January</Eyebrow>
        <Title>Three numbers that moved</Title>
      </Head>

      <Grid cols={3} grow mid>
        <Cell pad="lg">
          <Stat value="38%" label="Fewer support conversations per thousand sessions" accent />
        </Cell>
        <Cell pad="lg">
          <Stat value="4.2 days" label="Median time from request to shipped change, down from eleven" />
        </Cell>
        <Cell pad="lg">
          <Stat value="1 in 3" label="New accounts that reach the second week, up from one in five" />
        </Cell>
      </Grid>

      <Note style={{ marginTop: 28 }}>
        Product analytics, 1 January to 28 February 2026. Excludes trial accounts.
      </Note>
    </Slide>
  );
}
