import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function Roadmap() {
  return <Slide grid><Head><Eyebrow>Implementation</Eyebrow><Title>Sequence the change around evidence, not activity</Title></Head><Grid cols={4} grow><Cell pad="md"><Kicker accent>0–30 days</Kicker><CardTitle>Align</CardTitle><Line>Confirm the baseline, owner, guardrails, and first test.</Line></Cell><Cell pad="md"><Kicker>31–90 days</Kicker><CardTitle>Prove</CardTitle><Line>Run a narrow pilot against an explicit success threshold.</Line></Cell><Cell pad="md"><Kicker>3–6 months</Kicker><CardTitle>Scale</CardTitle><Line>Extend only what the evidence says is repeatable.</Line></Cell><Cell pad="md"><Kicker>6–12 months</Kicker><CardTitle>Embed</CardTitle><Line>Move ownership into the operating cadence and retire the old path.</Line></Cell></Grid></Slide>;
}
