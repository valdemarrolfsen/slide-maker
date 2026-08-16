import { Slide, Head, Eyebrow, Title, DataTable, Note } from 'slide-maker/runtime';

export default function Roadmap() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Implementation roadmap</Eyebrow><Title wide>Four evidence gates sequence the transformation while keeping capital reversible</Title></Head>
      <DataTable columns={['Workstream', '0–30 days · Align', '31–90 days · Prove', '3–6 months · Scale', '6–12 months · Embed']} rows={[
        ['Portfolio', 'Confirm segment economics and stop list', 'Test two propositions with target consumers', 'Launch winning formats in six markets', 'Refresh portfolio and exit legacy tail'],
        ['Commercial', 'Select twelve priority accounts', 'Run joint plans in two channels', 'Scale account playbook and content', 'Move targets into annual planning'],
        ['Supply', 'Map complexity and capacity constraints', 'Qualify flexible packaging route', 'Consolidate low-volume SKUs', 'Reinvest savings in priority capacity'],
        ['Organization', 'Name value owner and category pod', 'Move five experts into the pod', 'Replicate pod for second play', 'Retire transformation office'],
        ['Evidence gate', <b>Baseline signed</b>, <b>Consumer and retailer proof</b>, <b>Economics at scale</b>, <b>Run-rate value realized</b>],
      ]} />
      <Note style={{ marginTop: 14 }}>Capital is released at each evidence gate. Missing a threshold triggers redesign or stop, not an automatic extension.</Note>
    </Slide>
  );
}
