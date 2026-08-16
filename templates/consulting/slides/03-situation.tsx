import { Slide, Head, Eyebrow, Title, Columns, Column, BarChart, LineChart, Note } from 'slide-maker/runtime';

export default function Situation() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Market context</Eyebrow><Title wide>Growth has moved toward premium convenience while Northstar remains overexposed to the declining core</Title></Head>
      <Columns ratio="0.9fr 1.35fr" gap={28} style={{ flex: 1 }}>
        <Column>
          <BarChart title="Category growth, 2023–26 CAGR" max={12} data={[
            { label: 'Functional snacks', value: 11.2, display: '11.2%', tone: 'accent' },
            { label: 'Premium convenience', value: 8.7, display: '8.7%', tone: 'accent' },
            { label: 'Everyday core', value: 1.4, display: '1.4%', tone: 'strong' },
            { label: 'Value tier', value: -2.1, display: '–2.1%', tone: 'muted' },
          ]} />
          <Note style={{ marginTop: 18 }}>Premium subsegments contribute 71% of absolute category growth despite representing only 34% of current sales.</Note>
        </Column>
        <Column>
          <LineChart
            title="Revenue index by segment, 2021 = 100"
            labels={['2021', '2022', '2023', '2024', '2025', '2026']}
            series={[
              { name: 'Premium convenience', values: [100, 108, 117, 129, 142, 157], tone: 'accent' },
              { name: 'Northstar portfolio', values: [100, 101, 100, 98, 97, 96], tone: 'strong' },
            ]}
          />
        </Column>
      </Columns>
      <Note>Source: syndicated retail data; company net sales; constant currency. Analysis covers the twelve priority markets.</Note>
    </Slide>
  );
}
