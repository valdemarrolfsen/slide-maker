import { Slide, Head, Eyebrow, Title, Columns, Column, StackedBarChart, LineChart, Note } from 'slide-maker/runtime';

export default function MarketContext() {
  return (
    <Slide className="consulting-market" label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>01 · Where the market is moving</Eyebrow>
        <Title wide>Category growth is healthy—but 73% of the value pool sits outside the channels where Northstar currently wins</Title>
      </Head>

      <Columns ratio="1.04fr .96fr" gap={32} style={{ flex: 1 }}>
        <Column className="consulting-exhibit">
          <div className="consulting-exhibit-head"><span>Absolute category growth by channel</span><span className="consulting-unit">2026–28E · $m</span></div>
          <StackedBarChart rows={[
            { label: 'Category growth', total: '$164m', segments: [
              { label: 'Specialty', value: 62, display: '38%', tone: 'accent' },
              { label: 'Direct', value: 58, display: '35%', tone: 'strong' },
              { label: 'Grocery', value: 31, display: '19%', tone: 'muted' },
              { label: 'Wholesale', value: 13, display: '8%', tone: 'light' },
            ]},
            { label: 'Northstar sales', total: '$520m', segments: [
              { label: 'Specialty', value: 55, display: '11%', tone: 'accent' },
              { label: 'Direct', value: 36, display: '7%', tone: 'strong' },
              { label: 'Grocery', value: 286, display: '55%', tone: 'muted' },
              { label: 'Wholesale', value: 143, display: '27%', tone: 'light' },
            ]},
          ]} />
          <div className="consulting-insight" style={{ marginTop: 28 }}><b>Northstar is structurally underexposed:</b> specialty and direct represent 73% of category growth, but only 18% of company revenue.</div>
        </Column>
        <Column className="consulting-exhibit">
          <div className="consulting-exhibit-head"><span>Revenue trajectory by channel</span><span className="consulting-unit">Index · 2023 = 100</span></div>
          <LineChart
            labels={['2023', '2024', '2025', '2026', '2027E', '2028E']}
            series={[
              { name: 'Specialty + direct', values: [100, 111, 126, 143, 161, 181], tone: 'accent' },
              { name: 'Category total', values: [100, 104, 109, 116, 122, 128], tone: 'muted' },
              { name: 'Northstar today', values: [100, 99, 98, 100, 101, 103], tone: 'strong' },
            ]}
          />
        </Column>
      </Columns>
      <Note>Syndicated retail data; Northstar net sales; team market model. Twelve priority markets, constant currency; projections assume consensus category inflation.</Note>
    </Slide>
  );
}
