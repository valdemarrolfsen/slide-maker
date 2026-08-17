import { Slide, Head, Eyebrow, Title, Columns, Column, BubbleMatrix, DataTable, Note } from 'slide-maker/runtime';

export default function OpportunityMap() {
  return (
    <Slide className="consulting-opportunity" label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>02 · Where to play</Eyebrow>
        <Title wide>A granular screen identifies three priority micro-markets that combine attractive economics with a credible right to win</Title>
      </Head>
      <Columns ratio="1.02fr .98fr" gap={30} style={{ flex: 1 }}>
        <Column>
          <BubbleMatrix
            title="Micro-market attractiveness screen"
            xLabel="NORTHSTAR RIGHT TO WIN →"
            yLabel="MARKET ATTRACTIVENESS →"
            data={[
              { label: 'Active adults', x: 76, y: 82, size: 62, tone: 'accent' },
              { label: 'Healthy families', x: 68, y: 67, size: 53, tone: 'accent' },
              { label: 'Office fuel', x: 82, y: 55, size: 45, tone: 'strong' },
              { label: 'Energy', x: 48, y: 74, size: 48, tone: 'muted' },
              { label: 'Kids', x: 62, y: 38, size: 56, tone: 'muted' },
              { label: 'Value packs', x: 31, y: 34, size: 64, tone: 'light' },
              { label: 'Core', x: 44, y: 20, size: 70, tone: 'light' },
            ]}
          />
        </Column>
        <Column>
          <div className="consulting-exhibit-head"><span>Priority micro-markets</span><span className="consulting-unit">2028E</span></div>
          <DataTable
            columns={['Micro-market', 'Pool', 'Growth', 'Margin', 'Why Northstar can win']}
            rows={[
              [<b>Active adults</b>, '$410m', '14%', '44%', 'Strong functional credentials'],
              [<b>Healthy families</b>, '$620m', '9%', '38%', 'Household trust and distribution'],
              [<b>Office fuel</b>, '$280m', '11%', '47%', 'Portable formats; employer access'],
            ]}
          />
          <div className="consulting-insight" style={{ marginTop: 16 }}><b>Focus the portfolio around two platforms:</b> performance-led adult occasions and healthier family convenience; treat office as an activation channel, not a third platform.</div>
        </Column>
      </Columns>
      <Note>Euromonitor; retailer scan; 2,400-consumer concept survey; brand-demand model; team analysis. Bubble size represents estimated 2028 revenue pool.</Note>
    </Slide>
  );
}
