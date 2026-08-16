import { Slide, Head, Eyebrow, Title, Columns, Column, DataTable, Rows, Row, Note } from 'slide-maker/runtime';

export default function ExecutiveSummary() {
  return (
    <Slide label="Northstar Foods · Growth strategy">
      <Head><Eyebrow>Executive summary</Eyebrow><Title wide>Three moves can restore 6–8 points of margin while returning the portfolio to growth</Title></Head>
      <Columns ratio="2.25fr 0.75fr" gap={18} style={{ flex: 1 }}>
        <Column>
          <DataTable
            columns={['Priority', 'What the evidence says', 'Recommended move', '2028 impact']}
            rows={[
              [<b>01 · Focus the portfolio</b>, '71% of category growth sits in two premium subsegments where Northstar already has permission to win.', 'Move 60% of innovation and media behind functional snacking and premium convenience.', <b>+$145m revenue</b>],
              [<b>02 · Reset the channel mix</b>, 'Digital and specialty channels grow 3.2× faster and carry 420 bps more contribution margin.', 'Build dedicated propositions and a joint planning model for the top twelve accounts.', <b>+3.1 pts margin</b>],
              [<b>03 · Simplify delivery</b>, 'Thirty-seven active initiatives dilute expert capacity and extend launch cycles by five months.', 'Stop the bottom third, install one value owner, and fund by milestone.', <b>$38m capacity</b>],
            ]}
          />
          <Note style={{ marginTop: 12 }}>Source: category model, customer interviews (n=42), initiative census, management estimates. Ranges reflect execution uncertainty.</Note>
        </Column>
        <Column>
          <Rows title="Decision today">
            <Row k="Direction">Approve the portfolio focus</Row>
            <Row k="Capital">Release $18m through gate one</Row>
            <Row k="Owner">Name one transformation lead</Row>
            <Row k="Review">90-day evidence checkpoint</Row>
          </Rows>
        </Column>
      </Columns>
    </Slide>
  );
}
