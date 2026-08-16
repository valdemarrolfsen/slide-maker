import { Slide, Head, Eyebrow, Title, Columns, BarChart, LineChart, Note } from 'slide-maker/runtime';

export default function Charts() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Market evidence</Eyebrow>
        <Title>Premium channels are growing three times faster than the core</Title>
      </Head>

      <Columns ratio="1fr 1.08fr" gap={28} style={{ flex: 1, alignItems: 'center' }}>
        <BarChart
          title="Revenue growth by channel, 2026 (%)"
          max={18}
          data={[
            { label: 'Specialty', value: 16, display: '16%' },
            { label: 'Direct', value: 12, display: '12%' },
            { label: 'Grocery', value: 5, display: '5%', tone: 'muted' },
            { label: 'Wholesale', value: 3, display: '3%', tone: 'muted' },
          ]}
        />
        <LineChart
          title="Indexed category value, 2023 = 100"
          labels={['2023', '2024', '2025', '2026']}
          series={[
            { name: 'Premium', values: [100, 111, 126, 143] },
            { name: 'Core', values: [100, 103, 108, 113], tone: 'muted' },
          ]}
        />
      </Columns>

      <Note>Illustrative data. Replace with an attributed source and define the category perimeter.</Note>
    </Slide>
  );
}
