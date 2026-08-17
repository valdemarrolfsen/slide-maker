import { Slide, Head, Eyebrow, Title, Grid, Cell, Note } from 'slide-maker/runtime';

export default function WhatWeHeard() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>What we heard</Eyebrow><Title wide>Your team has the data—just not one reliable view of what to do next.</Title></Head>
      <Grid cols={3} className="sales-pain-grid">
        <Cell><span className="sales-pain-n">01</span><h3>Signals arrive after the moment has passed</h3><p>Product usage, support friction, executive changes, and intent data live in separate tools with separate owners.</p></Cell>
        <Cell><span className="sales-pain-n">02</span><h3>Every forecast starts with a reconciliation exercise</h3><p>Managers spend Thursday rebuilding account context instead of coaching the action that could change the outcome.</p></Cell>
        <Cell><span className="sales-pain-n">03</span><h3>Plays depend on individual memory</h3><p>The best sellers recognize patterns early; the rest discover risk during inspection or after a customer has already moved.</p></Cell>
      </Grid>
      <div className="sales-quote-strip"><div><b>DISCOVERY</b>7 stakeholder interviews</div><div>“We do not need another dashboard. We need the account team to know what changed, why it matters, and what to do before the customer tells us.”</div><div><b>VP REVENUE OPERATIONS</b>Acme Revenue · July 2026</div></div>
      <Note>Discovery synthesis. Replace the illustrative language with the buyer’s confirmed priorities and exact terminology.</Note>
    </Slide>
  );
}
