import { Slide, Head, Eyebrow, Title, Columns, BubbleMatrix, DataTable, Note } from 'slide-maker/runtime';

export default function OpportunityMatrix() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Where to play</Eyebrow>
        <Title wide>Three opportunities combine an attractive value pool with a credible right to win</Title>
      </Head>
      <Columns ratio="1.05fr .95fr" gap={30} style={{ flex: 1 }}>
        <BubbleMatrix title="Opportunity screen" xLabel="RIGHT TO WIN →" yLabel="MARKET ATTRACTIVENESS →" data={[
          { label: 'Priority A', x: 78, y: 82, size: 64, tone: 'accent' },
          { label: 'Priority B', x: 67, y: 66, size: 52, tone: 'accent' },
          { label: 'Priority C', x: 84, y: 52, size: 44, tone: 'strong' },
          { label: 'Option D', x: 43, y: 72, size: 48, tone: 'muted' },
          { label: 'Core', x: 39, y: 27, size: 70, tone: 'light' },
        ]} />
        <DataTable columns={['Priority', 'Pool', 'Growth', 'Why we can win']} rows={[
          ['Priority A', '$410m', '14%', 'Distinctive capability'],
          ['Priority B', '$620m', '9%', 'Customer permission'],
          ['Priority C', '$280m', '11%', 'Channel access'],
          ['Option D', '$510m', '12%', 'Build capability first'],
        ]} />
      </Columns>
      <Note>Illustrative market model. Replace with sourced inputs and define how both axes and bubble size are calculated.</Note>
    </Slide>
  );
}
