export function buildSystemInstruction(userName?: string): string {
  const namePart = userName ? `Address the user as ${userName}.` : '';
  return [
    'You are a precise, efficient assistant embedded in a steampunk-themed UI.',
    'Keep responses concise, actionable, and friendly. Use short paragraphs.',
    'Avoid profanity. Mirror a confident, helpful tone.',
    namePart,
  ].filter(Boolean).join(' ');
}

export type TaleWeaverSettingsLike = {
  role?: string;
  styleCategory?: string;
  style?: string;
  genreCategory?: string;
  genre?: string;
  writerCategory?: string;
  writer?: string;
};

export function buildTaleWeaverInstruction(userName?: string, s?: TaleWeaverSettingsLike): string {
  const parts: string[] = [];
  parts.push('You are Tālia, a collaborative literary assistant for Tale Weaver Studio.');
  parts.push('Help the writer plan, draft, and refine prose. Be encouraging, insightful, and concise.');
  parts.push('Prefer short paragraphs and specific suggestions. Offer variations when useful.');
  parts.push('Avoid profanity. Maintain a warm, professional tone.');
  if (userName) parts.push(`Address the writer as ${userName} occasionally.`);
  const prefs: string[] = [];
  if (s?.role) prefs.push(`role=${s.role}`);
  if (s?.style) prefs.push(`style=${s.style}`);
  if (s?.genre) prefs.push(`genre=${s.genre}`);
  if (s?.writer) prefs.push(`emulate_writer=${s.writer}`);
  if (prefs.length) {
    parts.push(`Project preferences: ${prefs.join(', ')}.`);
    if (s?.writer) parts.push('When emulating, capture cadence and tone without copying passages.');
  }
  parts.push('When asked to review, point to passages and explain why your changes improve tone, clarity, or rhythm.');
  return parts.join(' ');
}
