import { Slide, Columns, Column, Eyebrow, Title, Lede, DataTable, Note } from 'slide-maker/runtime';

export default function Profile() {
  return (
    <Slide label="Mara Vale · Portfolio">
      <Columns ratio="1.35fr 0.65fr" gap={84} style={{ flex: 1, alignItems: 'center' }}>
        <Column>
          <Eyebrow>01 · Practice</Eyebrow>
          <Title size="big" wide style={{ marginTop: 22 }}>I make quiet systems for ambitious ideas.</Title>
          <Lede style={{ marginTop: 30, maxWidth: 560 }}>My work moves between strategy, identity, and digital product. I join early, find the idea with enough tension to travel, then build the system around it.</Lede>
        </Column>
        <Column>
          <DataTable columns={['Selected capabilities']} rows={[
            ['Creative direction'], ['Brand strategy'], ['Identity systems'], ['Digital experience'], ['Editorial design'], ['Spatial storytelling'],
          ]} />
          <Note style={{ marginTop: 18 }}>Based in Copenhagen · Working internationally</Note>
        </Column>
      </Columns>
    </Slide>
  );
}
