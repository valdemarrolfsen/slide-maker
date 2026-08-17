import { Slide, Head, Eyebrow, Title, DataTable, Note } from 'slide-maker/runtime';

export default function Plan() {
  return (
    <Slide className="sales-slide" label="Pulse × Acme Revenue">
      <Head><Eyebrow>Path to value</Eyebrow><Title wide>Acme can go live in 30 days and prove the first outcome before expanding scope.</Title></Head>
      <div className="sales-timeline">
        <article className="sales-timeline-step"><b>WEEK 01</b><h3>Align</h3><p>Confirm the cohort, workflow, systems, owners, and baseline.</p><ul><li>Success metric signed</li><li>Priority accounts selected</li><li>Security path agreed</li></ul></article>
        <article className="sales-timeline-step"><b>WEEKS 02–03</b><h3>Connect</h3><p>Configure data sources, signal logic, plays, and seller experience.</p><ul><li>CRM + product connected</li><li>Three signals validated</li><li>Managers trained</li></ul></article>
        <article className="sales-timeline-step"><b>WEEKS 04–08</b><h3>Prove</h3><p>Run with one team and review action quality every week.</p><ul><li>25-user cohort live</li><li>Weekly evidence review</li><li>Value tracked in CRM</li></ul></article>
        <article className="sales-timeline-step"><b>WEEKS 09–12</b><h3>Scale</h3><p>Extend only after the agreed adoption and outcome threshold is met.</p><ul><li>Playbook refined</li><li>Next cohort selected</li><li>Operating owner ready</li></ul></article>
      </div>
      <DataTable columns={['Acme owner', 'Pulse owner', 'Joint acceptance gate']} rows={[
        ["Executive sponsor · clears decisions and scope", "Solution lead · owns outcome design", "Success metric, cohort, and baseline signed"],
        ["Data owner · grants governed source access", "Data engineer · configures and validates signals", "Three priority signals pass quality review"],
        ["Pilot manager · coaches the 25-user cohort", "Enablement partner · embeds the weekly rhythm", "≥70% adoption and time-to-action below four days"],
      ]} />
      <div className="sales-plan-gates"><b>Operating cadence</b><span><i>MON</i> Signal quality</span><span><i>WED</i> Manager adoption</span><span><i>FRI</i> Outcome evidence</span><strong>30-minute weekly value review</strong></div>
      <Note>Proposed implementation plan. Timing depends on data access, security review, and availability of the buyer’s operating team.</Note>
    </Slide>
  );
}
