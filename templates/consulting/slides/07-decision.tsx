import { Slide, Head, Eyebrow, Title, Columns, Column, DataTable, Rows, Row, Note } from 'slide-maker/runtime';

export default function Decision() {
  return (
    <Slide dark label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Decision and implications</Eyebrow><Title wide>Approve the focused portfolio today while explicitly managing three uncertainties</Title></Head>
      <Columns ratio="1.25fr 0.75fr" gap={26} style={{ flex: 1 }}>
        <Column>
          <DataTable columns={['Uncertainty', 'What could be true', 'Leading indicator', 'Mitigation']} rows={[
            ['Consumer adoption', 'Premium benefit does not justify price', 'Concept conversion below 18%', 'Test price and claim independently before scale'],
            ['Retailer support', 'Shelf reset timing delays distribution', 'Fewer than six launch commitments', 'Sequence specialty and digital ahead of grocery'],
            ['Delivery capacity', 'Complexity savings arrive too slowly', 'SKU exits below 15% by gate two', 'Ring-fence simplification team and authority'],
          ]} />
          <Note style={{ marginTop: 12 }}>The recommendation remains robust across downside scenarios; timing and peak funding change, not strategic direction.</Note>
        </Column>
        <Column>
          <Rows title="Required today">
            <Row k="Approve">Two-play portfolio focus</Row>
            <Row k="Release">$18m to evidence gate one</Row>
            <Row k="Assign">One executive value owner</Row>
            <Row k="Stop">Bottom twelve initiatives</Row>
            <Row k="Review">18 November 2026</Row>
          </Rows>
        </Column>
      </Columns>
    </Slide>
  );
}
