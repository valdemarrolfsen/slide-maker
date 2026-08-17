import { Slide, Columns, Column, Eyebrow, Title, Figure, Grid, Cell, Stat, Note } from 'slide-maker/runtime';

export default function CaseResult() {
  return (
    <Slide dark label="Mara Vale · Portfolio">
      <Columns ratio="1.1fr 0.9fr" gap={44} style={{ flex: 1 }}>
        <Figure src="/dark-installation.png" alt="Plants displayed as sculptural objects" fit="cover" />
        <Column style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow>03 · Atelier No. 3 · Outcome</Eyebrow>
          <Title wide style={{ fontSize: 48 }}>The quieter identity made the work more recognizable.</Title>
          <Grid cols={2} style={{ marginTop: 38 }}>
            <Cell><Stat value="+38%" label="Increase in direct enquiries after launch" accent /></Cell>
            <Cell><Stat value="4.6×" label="Growth in saved and shared editorial content" /></Cell>
          </Grid>
          <Note style={{ marginTop: 26 }}>Six months after launch · Client analytics and enquiry data</Note>
        </Column>
      </Columns>
    </Slide>
  );
}
