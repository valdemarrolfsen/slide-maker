import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      eyebrow="Presentation · Date"
      title={<>Your presentation<br />starts here</>}
      lede="Replace this with the one sentence the audience should remember."
      footerLabel="Presented by"
      footer="Your name · Your team"
    />
  );
}
