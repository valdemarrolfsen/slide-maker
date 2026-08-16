import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      dark
      grid={false}
      eyebrow="Northstar Foods · Growth strategy"
      title={<>Winning the next<br />growth horizon</>}
      lede="A focused shift toward high-value channels can restore profitable growth within 24 months."
      footerLabel="Confidential"
      footer="Executive steering committee · 18 August 2026"
    />
  );
}
