export type Role = 'system' | 'user' | 'assistant';

export interface PromptMessage { role: Role; content: string }

export interface PersonaProfile {
  name?: string;
  role?: string;
  domain?: string;
  preferences?: { tone?: string; depth?: string };
}

export interface TaskManifest {
  intent?: string;
  constraints?: string[];
  outputFormat?: string;
}

export interface OrchestratorInput {
  engine?: 'openai' | 'gemini';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages: PromptMessage[];
  persona?: { userProfile?: PersonaProfile; taskManifest?: TaskManifest };
  systemInstruction?: string;
  projectId?: string;
  location?: string;
  traceId?: string;
}

export interface OrchestratorResult {
  content: string;
  modelUsed: string;
  engine: 'openai' | 'gemini';
  attempts: number;
  traceId: string;
  status?: number;
  error?: string;
}
