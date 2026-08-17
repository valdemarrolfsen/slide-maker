import { Slide, Head, Eyebrow, Title, Columns, Column, Note } from 'slide-maker/runtime';

const leaks = [
  ['Portfolio complexity', 34, '$14m'], ['Promo leakage', 27, '$11m'], ['Channel mix', 21, '$9m'],
  ['Launch delay', 10, '$4m'], ['Media productivity', 6, '$2m'], ['Other', 2, '$1m'],
];

export default function Diagnosis() {
  return (
    <Slide className="consulting-diagnosis" label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>03 · Why performance lags</Eyebrow>
        <Title wide>Northstar’s growth engine leaks at three points—portfolio complexity is the largest and most controllable</Title>
      </Head>
      <div className="consulting-driver-tree" style={{ marginTop: 4 }}>
        <div className="consulting-driver-root"><b>$41m</b><span>EBITDA value leakage versus normalized peer performance</span></div>
        <div className="consulting-driver-branches">
          <article className="consulting-driver-branch"><b>Portfolio</b><em>41%</em><p>128 active SKUs; 31 contribute less than 3% of profit. Resources are spread across nine need states.</p></article>
          <article className="consulting-driver-branch"><b>Commercial</b><em>33%</em><p>Promotion depth is 1.4× peers; spend follows last year’s base rather than incremental headroom.</p></article>
          <article className="consulting-driver-branch"><b>Delivery</b><em>26%</em><p>Five sequential handoffs extend launch cycles to 14 months and dilute accountability.</p></article>
        </div>
      </div>
      <Columns ratio="1.12fr .88fr" gap={34} style={{ marginTop: 24, flex: 1 }}>
        <Column className="consulting-pareto">
          <div className="consulting-exhibit-head"><span>Share of modeled value leakage</span><span className="consulting-unit">% · $m</span></div>
          {leaks.map(([label, value, amount]) => <div className="consulting-pareto-row" key={label}><span>{label}</span><div className="consulting-pareto-track"><div className="consulting-pareto-bar" style={{ width: `${Number(value) * 2.55}%` }} /></div><b>{value}% · {amount}</b></div>)}
        </Column>
        <Column>
          <div className="consulting-insight"><b>Implication:</b> simplification is not a cost program. It is the prerequisite for redirecting senior attention, innovation capacity, and trade investment toward the growth plays.</div>
          <div className="consulting-insight" style={{ marginTop: 12 }}><b>Near-term move:</b> stop twelve initiatives and 19 tail SKUs now; protect the three priority launches already past consumer proof.</div>
          <div className="consulting-benchmarks">
            <div className="consulting-benchmark"><span>OPERATING METRIC</span><span>NORTHSTAR</span><span>PEER</span></div>
            <div className="consulting-benchmark"><span>Launch cycle</span><span>14 mo.</span><span>8 mo.</span></div>
            <div className="consulting-benchmark"><span>Innovation hit rate</span><span>22%</span><span>41%</span></div>
            <div className="consulting-benchmark"><span>Digital sales mix</span><span>7%</span><span>18%</span></div>
          </div>
        </Column>
      </Columns>
      <Note>Northstar SKU P&amp;L; promotion post-event analysis; initiative census; public peer benchmarks. Leakage values are non-additive until overlap is removed.</Note>
    </Slide>
  );
}
