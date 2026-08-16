import { Slide, Head, Eyebrow, Title, Grid, Cell, Stat, Note } from 'slide-maker/runtime';

export default function Situation() {
  return <Slide grid><Head><Eyebrow>Situation</Eyebrow><Title>Three shifts make the current course unsustainable</Title></Head><Grid cols={3} grow mid><Cell pad="lg"><Stat value="–18%" label="Change in the core profit pool since the baseline year" accent /></Cell><Cell pad="lg"><Stat value="2.4×" label="Faster growth in the priority customer segment" /></Cell><Cell pad="lg"><Stat value="14 mo" label="Window before the next renewal and investment cycle" /></Cell></Grid><Note style={{ marginTop: 28 }}>Replace with sourced evidence. Always include period, baseline, and scope.</Note></Slide>;
}
