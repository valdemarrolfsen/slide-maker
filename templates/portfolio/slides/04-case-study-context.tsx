import { Slide, Columns, Column, Eyebrow, Title, Lede, Figure, DataTable } from 'slide-maker/runtime';

export default function CaseContext() {
  return (
    <Slide label="Mara Vale · Portfolio">
      <Columns ratio="0.72fr 1.28fr" gap={48} style={{ flex: 1 }}>
        <Column style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Eyebrow>03 · Atelier No. 3</Eyebrow>
          <Title wide style={{ fontSize: 54 }}>A brand that leaves room for the object.</Title>
          <Lede style={{ marginTop: 24 }}>The studio had a precise point of view, but its identity competed with the work. We built a quieter frame.</Lede>
          <DataTable columns={['Role', 'Scope']} rows={[
            ['Creative lead', 'Strategy and identity'], ['12 weeks', 'Research through launch'], ['Team of 5', 'Founder, architect, designer'],
          ]} style={{ marginTop: 34 }} />
        </Column>
        <Figure src="/interior.png" alt="Atelier interior" fit="cover" />
      </Columns>
    </Slide>
  );
}
