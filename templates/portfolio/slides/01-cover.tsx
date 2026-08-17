import { Slide, Columns, Column, Eyebrow, Title, Rule, Line, Figure, Kicker } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Slide bare>
      <Columns ratio="0.9fr 1.1fr" gap={44} style={{ flex: 1 }}>
        <Column style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow>Independent creative studio · Selected work</Eyebrow>
          <Title as="h1" size="huge" wide>Portfolio</Title>
          <Rule style={{ marginTop: 28, width: 210, height: 1 }} />
          <Line style={{ marginTop: 20, maxWidth: 300 }}>Brand identities, digital experiences, and spaces shaped around a single clear idea.</Line>
          <Kicker style={{ marginTop: 'auto', marginBottom: 8 }}>Mara Vale · 2024–2026</Kicker>
        </Column>
        <Figure src="/still-life.png" alt="Sculptural ceramic vase with dried stems" fit="cover" />
      </Columns>
    </Slide>
  );
}
