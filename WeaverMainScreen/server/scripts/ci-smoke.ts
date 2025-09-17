import 'dotenv/config';
import { orchestrate } from '../src/orchestrator';

async function run() {
  const tests = [
    { engine: 'openai', model: 'gpt-4o-mini', token: 'OPENAI_SMOKE' },
    { engine: 'gemini', model: 'gemini-2.5-flash', token: 'GEMINI_SMOKE' },
  ] as const;

  for (const t of tests) {
    const res = await orchestrate({
      engine: t.engine as any,
      model: t.model,
      messages: [{ role: 'user', content: `Reply with ${t.token} only.` }],
      temperature: 0.2,
      maxTokens: 40,
    });
    if (!res.content?.includes(t.token)) {
      console.error(`${t.engine} smoke failed:`, res.status || '', res.error || '', res.content.slice(0, 120));
      process.exit(1);
    }
    console.log(`${t.engine} smoke: OK via ${res.modelUsed}`);
  }
  console.log('Smoke tests: OK');
}

run().catch((e) => { console.error('Smoke runner error:', e?.message || e); process.exit(1); });
