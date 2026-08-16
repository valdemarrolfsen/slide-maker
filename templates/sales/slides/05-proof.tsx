import { Slide, Head, Eyebrow, Title, Columns, Column, BarChart, LineChart, Note } from 'slide-maker/runtime';

export default function Proof() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>Customer proof</Eyebrow><Title wide>Comparable revenue teams act earlier, forecast better, and create measurable expansion lift.</Title></Head>
      <Columns ratio="1.18fr .82fr" gap={18} style={{ flex: 1 }}>
        <Column>
          <Columns ratio=".9fr 1.1fr" gap={14}>
            <div className="sales-proof-chart"><BarChart title="Median time to action · days" max={10} data={[{ label: 'Before Pulse', value: 9.4, display: '9.4', tone: 'muted' }, { label: 'Success gate', value: 4, display: '4.0', tone: 'muted' }, { label: 'With Pulse', value: 2.8, display: '2.8', tone: 'accent' }]} /><div className="sales-proof-readout"><b>6.6 days returned</b><span>per material account event</span></div></div>
            <div style={{ padding: 15, border: '1px solid var(--sm-border)', borderRadius: 12, background: '#fff' }}><LineChart title="Expansion pipeline index · launch = 100" labels={['Launch', 'M1', 'M2', 'M3', 'M4']} series={[{ name: 'Pulse cohort', values: [100, 112, 126, 141, 158], tone: 'accent' }, { name: 'Control', values: [100, 103, 107, 112, 118], tone: 'muted' }]} /></div>
          </Columns>
          <div className="sales-proof-stats"><div className="sales-proof-stat"><b>–70%</b><span>time from signal to action</span></div><div className="sales-proof-stat"><b>+18%</b><span>forecast accuracy</span></div><div className="sales-proof-stat"><b>1.6×</b><span>expansion pipeline lift</span></div></div>
          <div className="sales-proof-method"><div><small>COHORT</small><b>42 account executives</b></div><div><small>WINDOW</small><b>Four months post-launch</b></div><div><small>CONTROL</small><b>Matched by segment + ARR</b></div></div>
        </Column>
        <Column className="sales-proof-card"><div className="sales-avatar">JM</div><blockquote>“Pulse gave every manager the context our best account executives used to carry in their heads.”</blockquote><cite><b>JORDAN MILES</b><br />VP Revenue, Northwind Systems<br />Reference available on request</cite></Column>
      </Columns>
      <Note>Illustrative composite case study. Use a customer-approved quote, matched baseline, cohort definition, and measurement period.</Note>
    </Slide>
  );
}
