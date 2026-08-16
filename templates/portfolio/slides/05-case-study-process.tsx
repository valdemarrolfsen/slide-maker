import { Slide, Eyebrow, Title, Columns, Column, Figure, Kicker, Line } from 'slide-maker/runtime';

export default function CaseProcess() {
  return (
    <Slide label="Mara Vale · Portfolio">
      <Eyebrow>03 · Atelier No. 3 · Process</Eyebrow>
      <Title wide style={{ fontSize: 38 }}>One material language, expressed at three scales.</Title>
      <Columns ratio="0.82fr 1.18fr" gap={18} style={{ height: 440, marginTop: 24 }}>
        <Column style={{ display: 'grid', gridTemplateRows: '355px auto', gap: 18 }}>
          <Figure src="/still-life.png" alt="Material still life" fit="cover" />
          <div><Kicker>Object</Kicker><Line>Warm tactility, imperfect geometry, and a deliberately narrow palette.</Line></div>
        </Column>
        <Column style={{ display: 'grid', gridTemplateRows: '355px auto', gap: 18 }}>
          <Figure src="/interior.png" alt="Studio environment" fit="cover" />
          <Columns ratio="1fr 1fr" gap={28}>
            <div><Kicker>Identity</Kicker><Line>A typographic frame that steps back until it is needed.</Line></div>
            <div><Kicker>Environment</Kicker><Line>Space, image, and signage using the same rhythm and restraint.</Line></div>
          </Columns>
        </Column>
      </Columns>
    </Slide>
  );
}
