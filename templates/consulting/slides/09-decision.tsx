import { Slide, Head, Eyebrow, Title, Kicker, Note } from 'slide-maker/runtime';

export default function Decision() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>07 · Decision required</Eyebrow>
        <Title wide>Three decisions this week put Northstar on track to begin the proof phase on 1 September</Title>
      </Head>
      <div className="consulting-decisions">
        <article className="consulting-decision-card"><Kicker>DECISION 01</Kicker><h3>Approve the two-platform portfolio focus</h3><p>Concentrate innovation on performance-led adult occasions and healthier family convenience; manage office as a route to market.</p><div className="consulting-gate"><span>GATE 1 PROOF</span><b>≥18% concept conversion</b></div><b>OWNER · CHIEF GROWTH OFFICER</b></article>
        <article className="consulting-decision-card"><Kicker>DECISION 02</Kicker><h3>Reallocate $18m from the initiative tail</h3><p>Stop twelve initiatives and 19 tail SKUs; protect three launches that have already passed consumer proof.</p><div className="consulting-gate"><span>GATE 1 PROOF</span><b>12 initiatives stopped</b></div><b>OWNER · CFO + CATEGORY PRESIDENTS</b></article>
        <article className="consulting-decision-card"><Kicker>DECISION 03</Kicker><h3>Install one value owner per platform</h3><p>Give each owner a P&amp;L, cross-functional pod, explicit thresholds, and authority to stop or scale at monthly gates.</p><div className="consulting-gate"><span>GATE 1 PROOF</span><b>Owners named by 25 Aug.</b></div><b>OWNER · CEO</b></article>
      </div>
      <div className="consulting-risk-strip"><div>KEY UNCERTAINTIES</div><div><b>Consumer adoption</b><br />Test benefit, price, and repeat independently.</div><div><b>Retailer commitment</b><br />Sequence specialty proof ahead of grocery resets.</div><div><b>Delivery capacity</b><br />Ring-fence simplification authority and experts.</div></div>
      <Note>Steering committee working session. Proposed checkpoint: 18 November 2026, after completion of the 90-day proof phase.</Note>
    </Slide>
  );
}
