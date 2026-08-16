import { Slide, Fill, Statement, Note } from 'slide-maker/runtime';

export default function StatementSlide() {
  return (
    <Slide notes="Pause here. The slide says one thing, so let it.">
      <Fill>
        <Statement>Support volume fell by a third once we rewrote the first email.</Statement>
      </Fill>

      <Note>Measured across the eight weeks after the change shipped, against the eight before.</Note>
    </Slide>
  );
}
