import { Slide, Columns, Column, Eyebrow, Title, Figure, Kicker, Line } from 'slide-maker/runtime';

export default function SelectedWork() {
  return (
    <Slide label="Mara Vale · Portfolio">
      <Eyebrow>02 · Selected work</Eyebrow>
      <Columns ratio="1.45fr 0.55fr" gap={20} style={{ flex: 1, marginTop: 20 }}>
        <Figure src="/interior.png" alt="Minimal interior with oak furniture" fit="cover" caption="Atelier No. 3 · Brand and environment" />
        <Column style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <Title wide style={{ fontSize: 28, marginTop: 0 }}>Three projects where restraint created distinction.</Title>
          <div><Kicker>01 · Atelier No. 3</Kicker><Line>Identity and environment for a contemporary objects studio.</Line></div>
          <div><Kicker>02 · Common Ground</Kicker><Line>A digital home for a new model of urban hospitality.</Line></div>
          <div><Kicker>03 · Still / Growing</Kicker><Line>Campaign and editorial system for a botanical collection.</Line></div>
        </Column>
      </Columns>
    </Slide>
  );
}
