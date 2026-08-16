import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function Diagnosis() {
  return <Slide grid><Head><Eyebrow>Diagnosis</Eyebrow><Title>The gap comes from three independent constraints</Title></Head><Grid cols={3} grow><Cell pad="lg"><Kicker>Demand</Kicker><CardTitle>Wrong segment mix</CardTitle><Line>Show which customers create value and where effort is currently spent.</Line></Cell><Cell pad="lg"><Kicker>Offer</Kicker><CardTitle>Undifferentiated promise</CardTitle><Line>Explain the unmet need and why today’s proposition does not win it.</Line></Cell><Cell pad="lg"><Kicker>Delivery</Kicker><CardTitle>Fragmented ownership</CardTitle><Line>Quantify the hand-offs, delay, or cost created by the operating model.</Line></Cell></Grid></Slide>;
}
