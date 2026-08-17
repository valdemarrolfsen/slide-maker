import {
  Slide,
  Head,
  Eyebrow,
  Title,
  Fill,
  Columns,
  Column,
  Lede,
  Ticks,
  Tick,
  Rows,
  Row,
} from 'slide-maker/runtime';

export default function DetailPanel() {
  return (
    <Slide>
      <Head>
        <Eyebrow>The ask</Eyebrow>
        <Title>One team, one quarter, one number</Title>
      </Head>

      <Fill>
        <Columns ratio="1.15fr 1fr" gap={48}>
          <Column>
            <Lede>
              We can do this with the people we already have, provided they stop doing the
              migration work in parallel.
            </Lede>
            <Ticks>
              <Tick>Nothing new to buy, and no new system to run afterwards.</Tick>
              <Tick>Reversible until the last two weeks of the quarter.</Tick>
              <Tick>Ends with a written handover, not with a demo.</Tick>
            </Ticks>
          </Column>
          <Column>
            <Rows title="At a glance">
              <Row k="Scope">Billing and invoicing only</Row>
              <Row k="Team">Four engineers, one designer</Row>
              <Row k="Starts">6 April 2026</Row>
              <Row k="Ends">26 June 2026</Row>
              <Row k="Owner">Platform</Row>
              <Row k="Risk">Medium, reversible</Row>
            </Rows>
          </Column>
        </Columns>
      </Fill>
    </Slide>
  );
}
