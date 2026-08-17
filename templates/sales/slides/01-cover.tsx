import { Slide, Columns, Column, Eyebrow, Title, Lede } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Slide bare className="sales-slide sales-cover">
      <Columns ratio=".88fr 1.12fr" gap={46} style={{ flex: 1, alignItems: 'center' }}>
        <Column className="sales-cover-copy">
          <Eyebrow>Prepared for Acme Revenue · 21 August 2026</Eyebrow>
          <Title as="h1" size="huge" wide>Turn every account signal into the next best action.</Title>
          <Lede>Pulse gives revenue teams one living view of customer intent, risk, and momentum—without replacing the tools they already use.</Lede>
          <div className="sales-cover-proof">
            <span><b>32%</b>faster sales cycles</span>
            <span><b>2.4×</b>more risk detected early</span>
            <span><b>21 days</b>to first value</span>
          </div>
        </Column>
        <Column>
          <div className="sales-browser">
            <div className="sales-browser-top"><i /><i /><i /></div>
            <div className="sales-browser-body">
              <aside className="sales-ui-sidebar"><div className="sales-ui-logo">PULSE</div><div className="sales-ui-nav active">Revenue overview</div><div className="sales-ui-nav">Accounts</div><div className="sales-ui-nav">Signals</div><div className="sales-ui-nav">Plays</div><div className="sales-ui-nav">Reports</div></aside>
              <main className="sales-ui-main">
                <div className="sales-ui-heading"><span>Revenue overview</span><span className="sales-ui-button">Create play</span></div>
                <div className="sales-ui-metrics"><div className="sales-ui-metric"><b>$4.8m</b>pipeline at risk</div><div className="sales-ui-metric"><b>74</b>active signals</div><div className="sales-ui-metric"><b>18%</b>forecast lift</div></div>
                <div className="sales-ui-chart"><i style={{ height: '36%' }} /><i style={{ height: '68%' }} /><i style={{ height: '52%' }} /><i style={{ height: '76%' }} /><i style={{ height: '92%' }} /><i style={{ height: '81%' }} /></div>
                <div className="sales-ui-list"><div><span>Northwind · expansion intent</span><b>High</b></div><div><span>Mercury · adoption risk</span><b>Review</b></div><div><span>Atlas · executive change</span><b>New</b></div></div>
              </main>
            </div>
          </div>
        </Column>
      </Columns>
      <div className="sales-footer"><span>Pulse × Acme Revenue</span><span>CONFIDENTIAL</span></div>
    </Slide>
  );
}
