import { Slide, Head, Eyebrow, Title, Columns, Column, WaterfallChart, DataTable, Note } from 'slide-maker/runtime';

export default function ValueCase() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>05 · What it is worth</Eyebrow>
        <Title wide>The program can add $23m of EBITDA by 2028, with more than half delivered through mix and pricing</Title>
      </Head>
      <Columns ratio="1.22fr .78fr" gap={30} style={{ flex: 1 }}>
        <Column>
          <div className="consulting-exhibit-head"><span>EBITDA value bridge</span><span className="consulting-unit">2028 run rate · $m</span></div>
          <WaterfallChart data={[
            { label: '2026 base', value: 64, display: '64', kind: 'total', tone: 'strong' },
            { label: 'Price', value: 8, display: '+8', tone: 'accent' },
            { label: 'Premium mix', value: 12, display: '+12', tone: 'accent' },
            { label: 'Direct', value: 7, display: '+7', tone: 'accent' },
            { label: 'Simplification', value: 5, display: '+5', tone: 'muted' },
            { label: 'Investment', value: -9, display: '–9', tone: 'light' },
            { label: '2028 run rate', value: 87, display: '87', kind: 'total', tone: 'strong' },
          ]} />
        </Column>
        <Column>
          <div className="consulting-exhibit-head"><span>Scenario sensitivity</span><span className="consulting-unit">2028</span></div>
          <DataTable columns={['Case', 'Revenue', 'EBITDA', 'Margin']} rows={[
            ['Downside', '+$72m', '+$11m', '+170 bps'],
            [<b>Base</b>, <b>+$120m</b>, <b>+$23m</b>, <b>+340 bps</b>],
            ['Upside', '+$158m', '+$34m', '+460 bps'],
          ]} />
          <div className="consulting-insight" style={{ marginTop: 18 }}><b>The strategic direction is robust:</b> the downside case remains value-accretive and self-funding; the principal uncertainty is pace, not whether to act.</div>
        </Column>
      </Columns>
      <Note>Team value model based on 2026 actuals. Base case assumes 60% initiative realization, explicit cannibalization, and no benefit from acquisitions or geographic expansion.</Note>
    </Slide>
  );
}
