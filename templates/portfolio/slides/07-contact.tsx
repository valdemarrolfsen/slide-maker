import { Slide, Columns, Column, Eyebrow, Title, Figure, Kicker, Line } from 'slide-maker/runtime';

export default function Contact() {
  return (
    <Slide bare>
      <Columns ratio="1fr 1fr" gap={54} style={{ flex: 1 }}>
        <Column style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow>05 · Contact</Eyebrow>
          <Title size="big" wide>Let’s make the next idea unmistakable.</Title>
          <div style={{ marginTop: 54 }}><Kicker>New work and collaborations</Kicker><Line>hello@maravale.studio<br />maravale.studio<br />Copenhagen · London · Everywhere</Line></div>
        </Column>
        <Figure src="/still-life.png" alt="Sculptural still life" fit="cover" />
      </Columns>
    </Slide>
  );
}
