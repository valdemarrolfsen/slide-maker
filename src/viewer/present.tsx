import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from 'virtual:slide-maker/deck';
import 'virtual:slide-maker/theme';
import './base.css';
import { Presenter } from './Presenter';

document.title = config.title;

// The page box has to match the slide canvas or printing letterboxes every
// slide. CSS custom properties are not allowed inside @page, so the rule is
// generated from the deck's dimensions at 96dpi.
const pageRule = document.createElement('style');
pageRule.textContent = `@page { size: ${config.width / 96}in ${config.height / 96}in; margin: 0; }`;
document.head.appendChild(pageRule);

const host = document.getElementById('root');
if (!host) throw new Error('slide-maker: #root is missing from the presentation document');

createRoot(host).render(
  <StrictMode>
    <Presenter />
  </StrictMode>,
);
