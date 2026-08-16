import { Slide, Head, Eyebrow, Title, DataTable, Note } from 'slide-maker/runtime';

export default function EvidenceTable() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Segment economics</Eyebrow>
        <Title>Two priority segments combine attractive growth with a credible right to win</Title>
      </Head>

      <DataTable
        style={{ marginTop: 28 }}
        columns={['Segment', 'Market size', 'Growth', 'Gross margin', 'Right to win', 'Priority']}
        rows={[
          ['Specialty retail', '$1.8bn', '16%', '48%', 'Strong', '1'],
          ['Direct to consumer', '$1.1bn', '12%', '54%', 'Strong', '2'],
          ['National grocery', '$4.6bn', '5%', '31%', 'Moderate', '3'],
          ['Food service', '$2.3bn', '4%', '27%', 'Limited', '4'],
          ['Wholesale', '$3.9bn', '3%', '22%', 'Limited', '5'],
        ]}
      />

      <Note style={{ marginTop: 20 }}>Illustrative screen. Define scoring thresholds and cite the underlying market model.</Note>
    </Slide>
  );
}
