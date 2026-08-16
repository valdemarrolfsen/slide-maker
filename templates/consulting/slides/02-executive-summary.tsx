import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function ExecutiveSummary() {
  return <Slide grid><Head><Eyebrow>Executive summary</Eyebrow><Title>We recommend one move, for three reasons</Title></Head><Grid cols={3} grow><Cell pad="lg"><Kicker accent>01 · Situation</Kicker><CardTitle>The market shifted</CardTitle><Line>State the external change and why the current model no longer fits.</Line></Cell><Cell pad="lg"><Kicker accent>02 · Insight</Kicker><CardTitle>Value is concentrated</CardTitle><Line>Name the segment, capability, or constraint where the evidence converges.</Line></Cell><Cell pad="lg"><Kicker accent>03 · Action</Kicker><CardTitle>Focus and sequence</CardTitle><Line>State the recommendation, the first move, and what will deliberately stop.</Line></Cell></Grid></Slide>;
}
