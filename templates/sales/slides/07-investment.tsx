import { Slide, Head, Eyebrow, Title, Fill, Columns, Column, Lede, Rows, Row } from 'slide-maker/runtime';

export default function Investment() {
  return <Slide><Head><Eyebrow>Investment</Eyebrow><Title>Frame the price against the outcome it unlocks</Title></Head><Fill><Columns ratio="1.1fr 1fr" gap={48}><Column><Lede>Lead with the value already established, then make scope, price, terms, and assumptions easy to compare.</Lede></Column><Column><Rows title="Commercial frame"><Row k="Scope">Pilot team and priority workflow</Row><Row k="Software">$XX,000 annual</Row><Row k="Services">$XX,000 one-time</Row><Row k="Term">12 months</Row><Row k="Value case">X× expected return</Row></Rows></Column></Columns></Fill></Slide>;
}
