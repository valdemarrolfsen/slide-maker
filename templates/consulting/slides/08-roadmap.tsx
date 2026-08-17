import { Slide, Head, Eyebrow, Title, Note } from 'slide-maker/runtime';
import type { ReactNode } from 'react';

const row = (label: string, cells: ReactNode[]) => <div className="consulting-gantt-row"><div>{label}</div>{cells.map((cell, i) => <div key={i}>{cell}</div>)}</div>;

export default function Roadmap() {
  return (
    <Slide className="consulting-roadmap" label="Northstar Foods · Growth strategy">
      <Head>
        <Eyebrow>06 · How to deliver</Eyebrow>
        <Title wide>A 12-month mobilization front-loads proof points while keeping irreversible investment below $5m</Title>
      </Head>
      <div className="consulting-gantt">
        <div className="consulting-gantt-row consulting-gantt-head"><div>WORKSTREAM</div><div>0–30 DAYS · ALIGN</div><div>31–90 DAYS · PROVE</div><div>3–6 MONTHS · SCALE</div><div>6–12 MONTHS · EMBED</div></div>
        {row('Portfolio', [<div className="consulting-work">Confirm stop list and platform guardrails</div>, <div className="consulting-work strong">Test two propositions and pack-price ladders</div>, <div className="consulting-work">Launch winners in six markets</div>, 'Refresh portfolio; exit legacy tail'])}
        {row('Direct channel', ['Define repeat occasions and economics', <div className="consulting-work strong">Pilot bundles and replenishment with 15k users</div>, <div className="consulting-work">Scale acquisition and retention engine</div>, 'Integrate first-party learning'])}
        {row('Commercial', ['Select twelve priority accounts', <div className="consulting-work">Co-design two specialty pilots</div>, <div className="consulting-work">Scale account playbook and content</div>, 'Move choices into annual plans'])}
        {row('Operating model', ['Name two value owners; stand up pods', 'Move experts and decision rights', <div className="consulting-work">Replicate cadence across markets</div>, 'Retire transformation office'])}
        {row('Evidence gates', [<span className="consulting-milestone">Baseline signed</span>, <span className="consulting-milestone">Consumer + customer proof</span>, <span className="consulting-milestone">Economics at scale</span>, <span className="consulting-milestone">Run-rate value</span>])}
      </div>
      <Note>Transformation office plan; workstream owner interviews. Capital released at evidence gates; failure to meet thresholds triggers redesign or stop.</Note>
    </Slide>
  );
}
