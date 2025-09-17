#!/usr/bin/env node
import 'dotenv/config';
import OpenAI from 'openai';

const key = process.env.VITE_OPENAI_API_KEY;
if (!key) {
  console.error('Missing VITE_OPENAI_API_KEY in environment. Create `.env` with your key.');
  process.exit(1);
}

const client = new OpenAI({ apiKey: key });

async function main() {
  try {
    // 1) Basic whoami via a tiny completion
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const res = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a validator.' },
        { role: 'user', content: 'Reply with OK.' }
      ],
      max_tokens: 2,
      temperature: 0,
    });
    const msg = res.choices?.[0]?.message?.content?.trim();
    if (msg !== 'OK') {
      console.warn('Model responded, but content unexpected:', msg);
    }
    console.log('OpenAI chat OK. Model:', model);

    // 2) Optional: list a couple models to verify availability
    try {
      const list = await client.models.list();
      const names = list.data.map(m => m.id).filter(id => /gpt-4o|gpt-4.1|mini|o3|o4/i.test(id)).slice(0, 10);
      console.log('Available models (subset):', names.join(', '));
    } catch (e) {
      console.warn('Model list not accessible with this key:', e?.status || e?.message || e);
    }
  } catch (err) {
    const status = err?.status || err?.response?.status;
    if (status === 401) {
      console.error('Auth failed (401). Check that the API key is valid.');
    } else if (status === 429) {
      console.error('Rate limited (429). Try again later or check quota.');
    } else if (status === 404) {
      console.error('Model not found or not accessible. Set OPENAI_MODEL or check access.');
    } else {
      console.error('OpenAI error:', err?.message || err);
    }
    process.exit(2);
  }
}

main();
