
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  files?: File[];
  engineUsed?: 'openai' | 'gemini';
  modelUsed?: string;
}

export interface Studio {
  id: string;
  title: string;
  description: string;
}

export type AiEngine = 'openai' | 'gemini';

export interface EngineConfig {
  defaultEngine: AiEngine;
  perContainer?: Record<string, AiEngine>; // keyed by container id/name
}

// Tale Weaver types
export interface WritingRole { name: string; description: string }
export interface WritingStyle { name: string; description: string }
export interface WritingStyleCategory { category: string; options: WritingStyle[] }
export interface WritingGenre { name: string; description: string }
export interface WritingGenreCategory { category: string; options: WritingGenre[] }
export interface Writer { name: string; description: string }
export interface WriterCategory { category: string; writers: Writer[] }

export type TaleWeaverSettings = {
  role: string;
  styleCategory: string;
  style: string;
  genreCategory: string;
  genre: string;
  writerCategory: string;
  writer: string;
};
