import { Slide, Head, Eyebrow, Title, Columns, Column, StackedBarChart, Note } from 'slide-maker/runtime';

export default function Recommendation() {
  return (
    <Slide className="consulting-recommendation" label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>04 · What to do</Eyebrow>
        <Title wide>Two growth plays—and three enabling moves—concentrate resources where Northstar has evidence-backed advantage</Title>
      </Head>
      <Columns ratio=".93fr 1.07fr" gap={32} style={{ height: 390 }}>
        <Column>
          <div className="consulting-play"><div className="consulting-play-n">01</div><div><h3>Win premium specialty occasions</h3><p>Build two modular platforms around sustained energy and healthier family convenience; tailor pack-price architecture by occasion.</p><small>VALUE: +$72m REVENUE · +$13m EBITDA</small></div></div>
          <div className="consulting-play"><div className="consulting-play-n">02</div><div><h3>Build a scaled direct channel</h3><p>Lead with replenishment, bundles, and first-party learning—not single-item e-commerce economics.</p><small>VALUE: +$48m REVENUE · +$10m EBITDA</small></div></div>
          <div className="consulting-play"><div className="consulting-play-n">→</div><div><h3>Enable through simplification, pods, and evidence gates</h3><p>Remove the tail, create one P&amp;L owner per platform, and release capital only when consumer, customer, and unit-economic thresholds are met.</p></div></div>
        </Column>
        <Column>
          <div className="consulting-exhibit-head"><span>Commercial resource allocation</span><span className="consulting-unit">% of addressable spend</span></div>
          <StackedBarChart rows={[
            { label: 'Today', total: '$76m', segments: [
              { label: 'Priority plays', value: 24, display: '24%', tone: 'accent' },
              { label: 'Core defense', value: 42, display: '42%', tone: 'muted' },
              { label: 'Tail initiatives', value: 34, display: '34%', tone: 'light' },
            ]},
            { label: 'Recommended', total: '$76m', segments: [
              { label: 'Priority plays', value: 61, display: '61%', tone: 'accent' },
              { label: 'Core defense', value: 31, display: '31%', tone: 'muted' },
              { label: 'Tail initiatives', value: 8, display: '8%', tone: 'light' },
            ]},
          ]} />
          <div className="consulting-insight" style={{ marginTop: 30 }}><b>Funding is available inside the base:</b> reallocating the initiative tail releases $18m without increasing the 2027 commercial envelope.</div>
        </Column>
      </Columns>
      <div className="consulting-enablers">
        <div>THREE ENABLERS</div>
        <div><b>1 · Simplify the portfolio</b>Remove 19 tail SKUs and twelve initiatives; redeploy expert capacity.</div>
        <div><b>2 · Organize around value</b>Give each platform one P&amp;L owner and a dedicated cross-functional pod.</div>
        <div><b>3 · Fund evidence, not activity</b>Scale only after consumer, customer, and unit-economic thresholds are met.</div>
      </div>
      <Note>Northstar FY2026 budget; zero-based resource review; team value model. Addressable spend includes innovation, media, insights, and dedicated personnel.</Note>
    </Slide>
  );
}
