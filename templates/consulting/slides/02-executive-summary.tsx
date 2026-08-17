import { Slide, Head, Eyebrow, Title, Kicker, Note } from 'slide-maker/runtime';

export default function ExecutiveSummary() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>Executive summary</Eyebrow>
        <Title wide>Northstar can add $120m in revenue and 340 bps of margin by concentrating investment in two advantaged growth plays</Title>
      </Head>

      <div className="consulting-summary">
        <article className="consulting-summary-item" data-n="01">
          <h3>Growth has migrated away from Northstar’s core</h3>
          <p><strong>73% of category growth</strong> now sits in specialty and direct channels, where Northstar generates only 18% of sales.</p>
          <p>The issue is exposure—not category health. The underlying market continues to grow at 5.2%.</p>
        </article>
        <article className="consulting-summary-item" data-n="02">
          <h3>Complexity absorbs investment without creating growth</h3>
          <p><strong>24% of SKUs contribute less than 3% of gross profit</strong>, while launch cycles run six months behind peers.</p>
          <p>Stopping twelve initiatives releases $18m and scarce commercial capacity.</p>
        </article>
        <article className="consulting-summary-item" data-n="03">
          <h3>Two moves create most of the value</h3>
          <p>Win premium specialty occasions; build a scaled direct channel around replenishment and bundles.</p>
          <p><strong>More than 80% of modeled value</strong> comes from mix, pricing, and repeat—not heroic share assumptions.</p>
        </article>
        <aside className="consulting-value-case">
          <Kicker>2028 value at stake</Kicker>
          <h3>+$120m</h3><p>net revenue versus 2026 baseline</p>
          <h3>+340 bps</h3><p>EBITDA margin expansion</p>
          <h3>$23m</h3><p>incremental EBITDA run rate</p>
          <div className="consulting-decision"><b>DECISION REQUIRED</b><p>Approve a 90-day proof phase and reallocate $18m from the initiative tail.</p></div>
        </aside>
      </div>
      <Note>Company P&amp;L; syndicated category data; customer interviews (n=42); initiative census; team analysis. Value case shown at constant 2026 FX.</Note>
    </Slide>
  );
}
