import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ChatHistory from './ChatHistory';
import ChatInput from './ChatInput';
import type { ChatMessage, AiEngine } from '../types';
import { chat } from '../services/chatService';
import { getPersona, getTask } from '../services/personaStore';
import { buildSystemInstruction } from '../services/promptHelpers';

interface ChatContainerProps {
  userName: string;
  engine?: AiEngine;
  geminiModel?: string;
  openaiModel?: string;
  onEngineChange?: (engine: AiEngine) => void;
  onOpenaiModelChange?: (model: string) => void;
  onGeminiModelChange?: (model: string) => void;
  studioId?: string;
  isMuted?: boolean;
  onToggleMute?: () => void;
  systemInstructionOverride?: string;
  containerClassName?: string;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ userName, engine = 'openai', geminiModel, openaiModel, onEngineChange, onOpenaiModelChange, onGeminiModelChange, studioId, isMuted, onToggleMute, systemInstructionOverride, containerClassName }) => {
  const taliagreetings = useMemo(() => [
    `Hello, ${userName}. I’m Tālia. Let’s weave a tale. Where shall we begin?`,
    `Hello, ${userName}. Let’s weave a tale together. What’s stirring your imagination first?`,
    `Greetings, ${userName}. The loom is ready. Shall we start with a character, a scene, or a feeling?`,
    `Welcome back, ${userName}. I kept the narrative threads warm. Where do we pick up?`,
    `A blank space and infinite possibility, ${userName}. What thread would you like to pull?`,
    `${userName}, I’m here. Shall we discover a voice, refine a passage, or begin anew?`,
  ], [userName]);
  const initialBot = useMemo(() => {
    if (studioId === 'tale-weaver') {
      const idx = Math.floor(Math.random() * taliagreetings.length);
      return taliagreetings[idx];
    }
    return `Alright ${userName}, what do you need? Be concise and direct so I can solve it fast.`;
  }, [studioId, taliagreetings, userName]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init-0', sender: 'bot', text: initialBot }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  useEffect(() => {
    let timer: any = null;
    const reset = () => {
      setIsIdle(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), 10000);
    };
    reset();
    const onMove = () => reset();
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onMove, { passive: true });
    window.addEventListener('touchstart', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove as any);
      window.removeEventListener('mousedown', onMove as any);
      window.removeEventListener('touchstart', onMove as any);
      if (timer) clearTimeout(timer);
    };
  }, []);
  // Local chime mute state (used only if no external control is provided)
  const [muteChime, setMuteChime] = useState<boolean>(() => {
    try { return localStorage.getItem('wms-mute-chime') === '1'; } catch { return false; }
  });
  useEffect(() => {
    if (typeof isMuted === 'boolean') return; // external control provided; don't persist local
    try { localStorage.setItem('wms-mute-chime', muteChime ? '1' : '0'); } catch {}
  }, [muteChime, isMuted]);
  const effectiveMuted = typeof isMuted === 'boolean' ? isMuted : muteChime;
  const systemInstruction = useMemo(() => systemInstructionOverride || buildSystemInstruction(userName), [userName, systemInstructionOverride]);

  // Soft response chime
  const audioCtxRefObj = (window as any).__wms_audio_ctx_ref || { ctx: null as AudioContext | null };
  (window as any).__wms_audio_ctx_ref = audioCtxRefObj;
  const playResponseChime = () => {
    try {
      const Ctor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      if (!audioCtxRefObj.ctx) audioCtxRefObj.ctx = new Ctor();
      if (audioCtxRefObj.ctx.state === 'suspended') {
        audioCtxRefObj.ctx.resume().catch(() => {});
      }
      const ctx = audioCtxRefObj.ctx;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      gain.connect(ctx.destination);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  };


  const handleSendMessage = useCallback(async (text: string, files: File[]) => {
    if (!text.trim() && files.length === 0) return;

    // Add user's message to the chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      files,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // OrchestratorInput payload
    const history = messages.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }));
    const fileNotes = files && files.length ? `\n\nContext files: ${files.map((f)=>`${f.name} (${f.type||'unknown'})`).join(', ')}` : '';
    const payload = {
      engine,
      model: engine === 'openai' ? openaiModel : geminiModel,
      messages: [...history, { role: 'user', content: text + fileNotes }],
      systemInstruction,
      persona: { userProfile: getPersona(), taskManifest: getTask() },
    } as const;
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const result = await chat(payload as any, abortRef.current.signal);
      const content = result?.content || '';
      console.log('[frontend] backend response length:', content.length, 'engine:', engine, 'modelUsed:', result?.modelUsed);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: content && content.trim().length > 0 ? content : '…',
        engineUsed: result?.engine as any,
        modelUsed: result?.modelUsed,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      // Chime on response land (skip for reduced motion OR if muted)
      try {
        const prefersReduced = typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReduced && !effectiveMuted) playResponseChime();
      } catch {}
    } catch (error) {
      console.error("Failed to get response from backend", error);
      const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Sorry, something failed upstream. Try switching engines or retrying.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, systemInstruction, engine, openaiModel, geminiModel]);

  const handleStop = useCallback(() => {
    try { abortRef.current?.abort(); } catch {}
    setIsLoading(false);
  }, []);

  const wrapperClass = containerClassName || "h-[70vh] w-full max-w-4xl flex flex-col rounded-lg bg-transparent";
  return (
    <div data-purpose="chat-interface-container" data-layout="chat-panel" className={wrapperClass}>
      <ChatHistory messages={messages} isLoading={isLoading} isIdle={isIdle} />
      <ChatInput
        onSendMessage={handleSendMessage}
        onStop={handleStop}
        isLoading={isLoading}
        engine={engine}
        openaiModel={openaiModel}
        geminiModel={geminiModel}
        onEngineChange={onEngineChange}
        onOpenaiModelChange={onOpenaiModelChange}
        onGeminiModelChange={onGeminiModelChange}
        isMuted={effectiveMuted}
        onToggleMute={onToggleMute ?? (() => setMuteChime((m) => !m))}
        studioId={studioId}
      />
    </div>
  );
};

export default ChatContainer;