import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      dark
      grid={false}
      eyebrow="Northstar Foods · Growth strategy"
      title={<>Rewiring Northstar<br />for the next growth curve</>}
      lede="A fact-based plan to concentrate the portfolio, redirect commercial investment, and restore profitable growth"
      footerLabel="CONFIDENTIAL"
      footer="Executive steering committee · 18 August 2026"
    />
  );
}
