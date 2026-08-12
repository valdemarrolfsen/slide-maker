import {
  Slide,
  Head,
  Eyebrow,
  Title,
  Fill,
  Columns,
  Column,
  Code,
  Hl,
  Ticks,
  Tick,
} from 'slide-maker/runtime';

export default function CodeSlide() {
  return (
    <Slide>
      <Head>
        <Eyebrow>The interface</Eyebrow>
        <Title>One call, and the retry policy comes with it</Title>
      </Head>

      <Fill>
        <Columns ratio="1.2fr 1fr" gap={44}>
          <Column>
            <Code>
              {`const result = await client.send(job, {\n  idempotencyKey: job.id,\n`}
              <Hl>{`  retry: { attempts: 5, backoff: 'exponential' },`}</Hl>
              {`\n  deadline: '30s',\n});`}
            </Code>
          </Column>
          <Column>
            <Ticks>
              <Tick>
                <b>The key is the job id.</b> Sending the same job twice is a no-op rather
                than a duplicate charge.
              </Tick>
              <Tick>
                <b>Retries are declared, not written.</b> Every caller gets the same backoff
                without copying it.
              </Tick>
              <Tick>
                <b>The deadline is required.</b> A call with no deadline is the failure mode
                we spent last quarter chasing.
              </Tick>
            </Ticks>
          </Column>
        </Columns>
      </Fill>
    </Slide>
  );
}
