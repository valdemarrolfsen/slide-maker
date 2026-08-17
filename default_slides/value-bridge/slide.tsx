import { Slide, Head, Eyebrow, Title, Columns, WaterfallChart, DataTable, Note } from 'slide-maker/runtime';

export default function ValueBridge() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Value case</Eyebrow>
        <Title wide>The recommendation adds $23m of run-rate EBITDA, with more than half delivered through mix and pricing</Title>
      </Head>
      <Columns ratio="1.2fr .8fr" gap={30} style={{ flex: 1 }}>
        <WaterfallChart title="EBITDA bridge · $m" data={[
          { label: 'Base', value: 64, display: '64', kind: 'total', tone: 'strong' },
          { label: 'Price', value: 8, display: '+8', tone: 'accent' },
          { label: 'Mix', value: 12, display: '+12', tone: 'accent' },
          { label: 'Channel', value: 7, display: '+7', tone: 'accent' },
          { label: 'Efficiency', value: 5, display: '+5', tone: 'muted' },
          { label: 'Investment', value: -9, display: '–9', tone: 'light' },
          { label: 'Run rate', value: 87, display: '87', kind: 'total', tone: 'strong' },
        ]} />
        <DataTable columns={['Case', 'Revenue', 'EBITDA']} rows={[
          ['Downside', '+$72m', '+$11m'],
          [<b>Base</b>, <b>+$120m</b>, <b>+$23m</b>],
          ['Upside', '+$158m', '+$34m'],
        ]} />
      </Columns>
      <Note>Illustrative value model. State the realization rate, cannibalization, investment, period, and all material exclusions.</Note>
    </Slide>
  );
}
