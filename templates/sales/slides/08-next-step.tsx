import { Slide, Head, Eyebrow, Title } from 'slide-maker/runtime';

export default function NextStep() {
  return (
    <Slide dark className="sales-slide sales-close" label="Pulse × Acme Revenue">
      <Head><Eyebrow>Proposed next step</Eyebrow><Title wide>Leave today with the pilot team, success threshold, and start date agreed.</Title></Head>
      <div className="sales-close-steps">
        <article className="sales-close-step"><b>01 · SCOPE</b><h3>Choose the first team</h3><p>Twenty-five users, one customer segment, and the retention-to-expansion workflow.</p></article>
        <article className="sales-close-step"><b>02 · EVIDENCE</b><h3>Sign the success metric</h3><p>Reduce time-to-action below four days with at least 70% weekly adoption.</p></article>
        <article className="sales-close-step"><b>03 · PEOPLE</b><h3>Name both owners</h3><p>One Acme operating lead and one Pulse solution lead with weekly decision authority.</p></article>
      </div>
      <div className="sales-cta"><b>Recommended kickoff · Monday, 14 September</b><span>Confirm 60-minute scoping session →</span></div>
    </Slide>
  );
}
