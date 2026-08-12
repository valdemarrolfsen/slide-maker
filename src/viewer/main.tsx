import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'virtual:slide-maker/style';
import './base.css';
import './studio.css';
import { Studio } from './Studio';

const host = document.getElementById('root');
if (!host) throw new Error('slide-maker: #root is missing from the studio document');

createRoot(host).render(
  <StrictMode>
    <Studio />
  </StrictMode>,
);
