import { Slide, Head, Eyebrow, Title, Note } from 'slide-maker/runtime';

export default function Investment() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>Commercial options</Eyebrow><Title wide>Start with the team and outcome that create the fastest credible proof.</Title></Head>
      <div className="sales-pricing">
        <article className="sales-price-card"><span className="sales-price-tag">PILOT</span><h3>Launch</h3><div className="sales-price">$36k <small>/ 90 days</small></div><ul><li>25 users and 250 accounts</li><li>CRM + one product source</li><li>Three priority signals</li><li>Weekly value review</li></ul><div className="sales-price-outcome"><small>SUCCESS TARGET</small><b>Prove action speed</b><span>Below four days with ≥70% weekly adoption</span></div><div className="sales-price-meta"><span>Implementation <b>Included</b></span><span>Term <b>90 days</b></span></div><strong>Best for technical proof</strong></article>
        <article className="sales-price-card recommended"><span className="sales-price-tag">RECOMMENDED</span><h3>Scale</h3><div className="sales-price">$96k <small>/ year</small></div><ul><li>100 users and 2,500 accounts</li><li>CRM, product, support, intent</li><li>Unlimited signal plays</li><li>Dedicated success lead</li></ul><div className="sales-price-outcome"><small>SUCCESS TARGET</small><b>Prove revenue lift</b><span>Measure forecast and expansion movement</span></div><div className="sales-price-meta"><span>Implementation <b>Included</b></span><span>Term <b>12 months</b></span></div><strong>Best path to business proof</strong></article>
        <article className="sales-price-card"><span className="sales-price-tag">ENTERPRISE</span><h3>Transform</h3><div className="sales-price">Custom</div><ul><li>Multiple regions and teams</li><li>Warehouse and custom sources</li><li>Advanced governance</li><li>Embedded value program</li></ul><div className="sales-price-outcome"><small>SUCCESS TARGET</small><b>Standardize the motion</b><span>One operating model across every region</span></div><div className="sales-price-meta"><span>Implementation <b>Scoped</b></span><span>Term <b>Multi-year</b></span></div><strong>Best for global rollout</strong></article>
      </div>
      <Note>Illustrative commercial structure. Replace prices, scope, terms, exclusions, and taxes with the approved proposal.</Note>
    </Slide>
  );
}
