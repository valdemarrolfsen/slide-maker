import { Slide, Head, Eyebrow, Title, Fill, Columns, Column, Lede, Ticks, Tick, Rows, Row } from 'slide-maker/runtime';

export default function Recommendation() {
  return <Slide><Head><Eyebrow>Recommendation</Eyebrow><Title>Concentrate investment where advantage compounds</Title></Head><Fill><Columns ratio="1.15fr 1fr" gap={48}><Column><Lede>State the answer in one decisive sentence, including the trade-off it requires.</Lede><Ticks><Tick>Focus on the priority segment and its highest-value use case.</Tick><Tick>Build the two capabilities that competitors cannot easily copy.</Tick><Tick>Stop work that does not advance the chosen position.</Tick></Ticks></Column><Column><Rows title="Decision frame"><Row k="Value">Expected outcome and range</Row><Row k="Investment">People, capital, and time</Row><Row k="Owner">One accountable executive</Row><Row k="First gate">Date and proof point</Row><Row k="Key risk">What must be true</Row></Rows></Column></Columns></Fill></Slide>;
}
