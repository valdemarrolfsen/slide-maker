import { Slide, Head, Eyebrow, Title, DataTable, Note } from 'slide-maker/runtime';

export default function Diagnosis() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Performance diagnosis</Eyebrow><Title wide>Most value leakage traces to a small set of portfolio and operating-model choices</Title></Head>
      <DataTable
        columns={['Value driver', 'Northstar', 'Peer median', 'Gap', 'Root cause', 'Priority action']}
        rows={[
          ['Revenue in growth segments', '34%', '57%', '–23 pts', 'Innovation spread across nine subsegments', 'Concentrate on two where brand permission is strongest'],
          ['Gross margin', '31.8%', '36.1%', '–430 bps', 'Complexity and promotional depth', 'Remove low-velocity variants and reset promo guardrails'],
          ['Digital channel mix', '8%', '19%', '–11 pts', 'Retail-first proposition and content', 'Create channel-native formats and dedicated ownership'],
          ['Launch cycle', '14 months', '8 months', '+6 months', 'Five sequential hand-offs', 'Create one cross-functional category pod'],
          ['Innovation hit rate', '22%', '41%', '–19 pts', 'Funding released before evidence', 'Use three evidence gates and stop rules'],
          ['Active initiatives', '37', '18', '+19', 'No portfolio-level value owner', 'Stop bottom third and reinvest capacity'],
          ['Media ROI', '0.8×', '1.4×', '–0.6×', 'Spend follows history, not headroom', 'Reallocate quarterly using incrementality'],
        ]}
      />
      <Note style={{ marginTop: 12 }}>Source: internal P&amp;L, innovation census, retailer interviews, public peer benchmarks. Peer set normalized for geography and category mix.</Note>
    </Slide>
  );
}
