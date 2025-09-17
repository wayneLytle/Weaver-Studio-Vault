export function buildSystemInstruction(base?: string, user?: { name?: string; role?: string; domain?: string; preferences?: { tone?: string; depth?: string } }, task?: { intent?: string; constraints?: string[]; outputFormat?: string }) {
  const parts: string[] = [];
  if (base) parts.push(base.trim());
  if (user?.name) parts.push(`Address the user as ${user.name}.`);
  if (user?.role) parts.push(`The user is a ${user.role}.`);
  if (user?.domain) parts.push(`Primary domain: ${user.domain}.`);
  const tone = user?.preferences?.tone || 'concise';
  const depth = user?.preferences?.depth || 'brief';
  parts.push(`Tone: ${tone}. Level of detail: ${depth}.`);
  if (task?.intent) parts.push(`Intent: ${task.intent}.`);
  if (task?.constraints?.length) parts.push(`Constraints: ${task.constraints.join('; ')}.`);
  if (task?.outputFormat) parts.push(`Output format: ${task.outputFormat}.`);
  parts.push('Avoid profanity. Keep responses actionable, using short paragraphs.');
  let result = parts.join(' ').trim();
  if (!result) result = 'You are helpful and concise.';
  console.log('[persona] systemInstruction:', result);
  return result;
}
