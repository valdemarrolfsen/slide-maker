import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      eyebrow="Quarterly review · March 2026"
      title={
        <>
          One clear claim,
          <br />
          made on the first slide
        </>
      }
      lede="The sentence you want the room repeating back to you on the way out."
      footerLabel="Presented by"
      footer="Your name, your team"
    />
  );
}
