import { Slide, Head, Eyebrow, Title, Grid, Cell, Kicker, CardTitle, Line } from 'slide-maker/runtime';

export default function Decision() {
  return <Slide dark grid><Head><Eyebrow>Decision required</Eyebrow><Title>Approve the direction and release the first gate</Title></Head><Grid cols={3} grow><Cell pad="lg"><Kicker accent>Decide</Kicker><CardTitle>Strategic focus</CardTitle><Line>Approve the recommended choice and the work that stops.</Line></Cell><Cell pad="lg"><Kicker accent>Assign</Kicker><CardTitle>Executive owner</CardTitle><Line>Name one person accountable for value, not a committee.</Line></Cell><Cell pad="lg"><Kicker accent>Commit</Kicker><CardTitle>First milestone</CardTitle><Line>Release the initial resources through the first evidence gate.</Line></Cell></Grid></Slide>;
}
