import { Slide, Head, Eyebrow, Title, Columns, Column, BarChart, DataTable, Note } from 'slide-maker/runtime';

export default function Recommendation() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Recommendation</Eyebrow><Title wide>Reallocating resources toward two priority plays creates a credible path to $145m incremental revenue</Title></Head>
      <Columns ratio="0.88fr 1.12fr" gap={26} style={{ flex: 1 }}>
        <Column>
          <BarChart title="Illustrative 2028 revenue bridge, $m" max={150} data={[
            { label: 'Core momentum', value: 22, display: '+22', tone: 'muted' },
            { label: 'Functional snacks', value: 68, display: '+68', tone: 'accent' },
            { label: 'Premium convenience', value: 54, display: '+54', tone: 'accent' },
            { label: 'Portfolio exits', value: -18, display: '–18', tone: 'strong' },
            { label: 'Net impact', value: 126, display: '+126', tone: 'strong' },
          ]} />
        </Column>
        <Column>
          <DataTable columns={['Move', 'Now', 'Next 90 days', 'Success measure']} rows={[
            ['Portfolio', 'Nine subsegments funded', 'Select two plays and stop six initiatives', '≥70% resources on priority plays'],
            ['Channels', 'One proposition everywhere', 'Co-design two pilots with priority accounts', '≥15% sell-through uplift'],
            ['Operating model', 'Functional hand-offs', 'Stand up one category pod with P&L owner', 'Cycle time below nine months'],
            ['Governance', 'Annual allocation', 'Install monthly evidence gates', '100% initiatives with stop rule'],
          ]} />
        </Column>
      </Columns>
      <Note>Model uses category growth, expected share capture, realized price/mix, and explicit cannibalization. It excludes acquisitions and geographic expansion.</Note>
    </Slide>
  );
}
