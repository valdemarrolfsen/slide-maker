import { Slide, Head, Eyebrow, Title, Columns, Column, BarChart, Note } from 'slide-maker/runtime';

export default function CostOfInaction() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>Why change now</Eyebrow><Title wide>Fragmented account intelligence puts $4.8m of near-term pipeline beyond timely intervention.</Title></Head>
      <Columns ratio="1.16fr .84fr" gap={24}>
        <Column style={{ padding: 18, border: '1px solid var(--sm-border)', borderRadius: 12, background: '#fff' }}>
          <BarChart title="Pipeline exposed by preventable signal gap · $m" max={2.1} data={[
            { label: 'Adoption decline', value: 1.9, display: '$1.9m', tone: 'accent' },
            { label: 'Champion change', value: 1.2, display: '$1.2m', tone: 'accent' },
            { label: 'Support friction', value: .8, display: '$0.8m', tone: 'muted' },
            { label: 'No engagement', value: .6, display: '$0.6m', tone: 'muted' },
            { label: 'Pricing event', value: .3, display: '$0.3m', tone: 'muted' },
          ]} />
          <div className="sales-handoff"><span>Signal appears</span><i>→</i><span>Team finds context</span><i>→</i><span>Owner aligns</span><i>→</i><span>Action begins</span></div>
          <div className="sales-cost-detail">
            <div className="sales-cost-detail-head"><b>Where the delay lands</b><span>Current-state consequence</span></div>
            <div><b>Renewal intervention</b><span>Health decline is seen after the account plan is already locked.</span><em>$1.9m exposed</em></div>
            <div><b>Expansion prioritization</b><span>High-intent accounts wait for manual manager inspection.</span><em>9.4 day lag</em></div>
            <div><b>Forecast inspection</b><span>Risk is reconstructed in the meeting instead of before it.</span><em>18 hrs / week</em></div>
          </div>
        </Column>
        <Column>
          <div className="sales-cost-metrics"><div className="sales-cost-metric"><b>9.4 days</b><span>Median time from a material customer signal to an owned action</span></div><div className="sales-cost-metric"><b>18 hrs</b><span>Weekly manager time rebuilding account context</span></div><div className="sales-cost-metric"><b>41%</b><span>At-risk opportunities identified after forecast review</span></div></div>
          <div className="sales-cost-next"><small>WHAT CHANGES</small><h3>Put the next best action beside the signal—not inside another dashboard.</h3><ul><li><b>Detect</b><span>One governed view across CRM, product, and support</span></li><li><b>Decide</b><span>Evidence and playbook arrive with a named owner</span></li><li><b>Act</b><span>Managers inspect outcomes instead of rebuilding context</span></li></ul></div>
        </Column>
      </Columns>
      <Note>Illustrative baseline using CRM stage history, product events, and interview estimates. Validate with the buyer before presenting externally.</Note>
    </Slide>
  );
}
