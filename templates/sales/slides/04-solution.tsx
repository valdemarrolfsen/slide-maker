import { Slide, Head, Eyebrow, Title, Columns, Column, Note } from 'slide-maker/runtime';

export default function Solution() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>How Pulse works</Eyebrow><Title wide>Pulse turns every account signal into a prioritized, explainable, and measurable revenue play.</Title></Head>
      <Columns ratio=".72fr 1.28fr" gap={20} style={{ flex: 1 }}>
        <Column className="sales-solution-steps">
          <div className="sales-solution-step"><b>1</b><div><h3>Connect the account</h3><p>Unify CRM, product, support, billing, and first-party engagement without changing seller workflow.</p></div></div>
          <div className="sales-solution-step"><b>2</b><div><h3>Explain what changed</h3><p>Rank material signals and show the evidence behind every risk, opportunity, and recommendation.</p></div></div>
          <div className="sales-solution-step"><b>3</b><div><h3>Launch the right play</h3><p>Route one owned action into the tools your team already uses, then measure whether it worked.</p></div></div>
        </Column>
        <Column className="sales-product-board">
          <div className="sales-product-card"><small>ACCOUNT HEALTH</small><h4>Mercury Health · 64</h4><div className="sales-progress"><i style={{ width: '64%' }} /></div><div className="sales-signal-row"><span>Adoption trend</span><b>–12%</b></div><div className="sales-signal-row"><span>Support sentiment</span><b>Watch</b></div></div>
          <div className="sales-product-card"><small>NEXT BEST ACTION</small><h4>Re-engage the operations sponsor</h4><div className="sales-signal-row"><span>Recommended owner</span><b>CSM</b></div><div className="sales-signal-row"><span>Expected lift</span><b>18%</b></div><div className="sales-signal-row"><span>Evidence</span><b>4 signals</b></div></div>
          <div className="sales-product-card wide"><small>PRIORITIZED SIGNALS</small><h4>Three changes need attention today</h4><div className="sales-signal-row"><span>Northwind opened 3 enterprise seats and hit its usage ceiling</span><b>Expand</b></div><div className="sales-signal-row"><span>Mercury’s weekly active users fell for the third consecutive week</span><b>Retain</b></div><div className="sales-signal-row"><span>Atlas appointed a new COO in the middle of procurement</span><b>Map</b></div></div>
        </Column>
      </Columns>
      <Note>Illustrative product experience. Replace with approved screenshots or a live workflow configured around the buyer’s priority accounts.</Note>
    </Slide>
  );
}
