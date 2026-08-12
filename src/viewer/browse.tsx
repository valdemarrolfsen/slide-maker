import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './base.css';
import './chrome.css';
import './library.css';
import { Library } from './Library';

const host = document.getElementById('root');
if (!host) throw new Error('slide-maker: #root is missing from the browse document');

createRoot(host).render(
  <StrictMode>
    <Library />
  </StrictMode>,
);
