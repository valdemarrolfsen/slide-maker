import { Cover } from 'slide-maker/runtime';

export default function CoverSlide() {
  return (
    <Cover
      eyebrow="Draft · replace this line"
      title={
        <>
          A deck you build
          <br />
          by talking to Claude
        </>
      }
      lede="Write slides in the terminal. Review them in the browser. Comment on anything."
      footerLabel="slide-maker"
      footer="Your name here"
    />
  );
}
