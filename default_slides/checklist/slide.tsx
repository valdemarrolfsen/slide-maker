import {
  Slide,
  Head,
  Eyebrow,
  Title,
  Fill,
  Checklist,
  ChecklistRow,
} from 'slide-maker/runtime';

export default function StatusTable() {
  return (
    <Slide>
      <Head>
        <Eyebrow>Launch readiness</Eyebrow>
        <Title>Where each gate stands</Title>
      </Head>

      <Fill>
        <Checklist head={['Gate', 'Status']} foot={['7 of 9 cleared', 'Reviewed 4 March']}>
          <ChecklistRow n="01" status="Done" tone="strong">
            Load tested to three times peak
          </ChecklistRow>
          <ChecklistRow n="02" status="Done" tone="strong">
            Rollback rehearsed against production data
          </ChecklistRow>
          <ChecklistRow n="03" status="Done" tone="strong">
            On-call rota staffed for launch week
          </ChecklistRow>
          <ChecklistRow n="04" status="Done" tone="strong">
            Alerting thresholds agreed with support
          </ChecklistRow>
          <ChecklistRow n="05" status="In review" tone="accent">
            Security review of the new export path
          </ChecklistRow>
          <ChecklistRow n="06" status="Done" tone="strong">
            Migration dry run on a copy of the live database
          </ChecklistRow>
          <ChecklistRow n="07" status="Blocked" tone="accent">
            Legal sign-off on the retention change
          </ChecklistRow>
          <ChecklistRow n="08" status="Done" tone="strong">
            Docs and release notes drafted
          </ChecklistRow>
          <ChecklistRow n="09" status="Out of scope" dim>
            Localisation beyond English
          </ChecklistRow>
        </Checklist>
      </Fill>
    </Slide>
  );
}
