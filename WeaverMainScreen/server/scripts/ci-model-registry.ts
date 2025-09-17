import { OpenAIModels, GeminiModels } from '../src/modelRegistry';

function assertUnique(arr: readonly string[], name: string) {
  const set = new Set(arr);
  if (set.size !== arr.length) throw new Error(`${name} contains duplicates`);
}

assertUnique(OpenAIModels as unknown as string[], 'OpenAIModels');
assertUnique(GeminiModels as unknown as string[], 'GeminiModels');

for (const m of OpenAIModels) {
  if (!/^gpt-/.test(m)) throw new Error(`Suspicious OpenAI model name: ${m}`);
}
for (const m of GeminiModels) {
  if (!/^gemini-/.test(m)) throw new Error(`Suspicious Gemini model name: ${m}`);
}

console.log('Model registry validation: OK');
