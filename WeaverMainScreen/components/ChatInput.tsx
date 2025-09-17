import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PlusIcon, SendIcon } from '../constants';

interface ChatInputProps {
  onSendMessage: (text: string, files: File[]) => void;
  onStop?: () => void;
  isLoading: boolean;
  engine?: 'openai' | 'gemini';
  openaiModel?: string;
  geminiModel?: string;
  onEngineChange?: (engine: 'openai' | 'gemini') => void;
  onOpenaiModelChange?: (model: string) => void;
  onGeminiModelChange?: (model: string) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  studioId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStop, isLoading, engine = 'openai', openaiModel, geminiModel, onEngineChange, onOpenaiModelChange, onGeminiModelChange, isMuted, onToggleMute, studioId }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLFormElement>(null);
  const lastSentRef = useRef<string>('');
  const studioIdRef = useRef<string>(studioId || 'tale-weaver');
  useEffect(() => { if (studioId) studioIdRef.current = studioId; }, [studioId]);
  const markActive = useCallback(() => {
    try {
      window.dispatchEvent(new Event('mousemove'));
    } catch {}
  }, []);

  // Draft persistence per studio
  useEffect(() => {
    try {
      const id = studioIdRef.current;
      const saved = localStorage.getItem(`wms-draft-${id}`);
      if (saved) setText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const id = studioIdRef.current;
      localStorage.setItem(`wms-draft-${id}`, text);
    } catch {}
  }, [text]);

  // Slash commands (basic)
  const applySlashCommand = (raw: string): boolean => {
    if (!raw.startsWith('/')) return false;
    const [cmd, ...rest] = raw.slice(1).trim().split(/\s+/);
    const arg = rest.join(' ');
    switch (cmd) {
      case 'retry':
        // resend last
        if (lastSentRef.current) onSendMessage(lastSentRef.current, []);
        return true;
      case 'engine':
        const [eng, model] = arg.split(':');
        if (eng === 'openai' || eng === 'gemini') {
          onEngineChange?.(eng as any);
          if (eng === 'openai' && model) onOpenaiModelChange?.(model);
          if (eng === 'gemini' && model) onGeminiModelChange?.(model);
        }
        return true;
      case 'summarize':
        onSendMessage('Summarize the conversation so far in 5 bullets.', []);
        return true;
      case 'persona':
      case 'tone':
        // placeholder: could set persona/tone in store
        return true;
      default:
        return false;
    }
  };
  
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    markActive();
    if (isLoading || (!text.trim() && files.length === 0)) return;
    if (applySlashCommand(text.trim())) { setText(''); return; }
    lastSentRef.current = text;
    onSendMessage(text, files);
    setText('');
    setFiles([]);
  }, [isLoading, text, files, onSendMessage, markActive]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    markActive();
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    markActive();
    // Ctrl+Enter to send
    if ((e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        handleSendMessage(e);
        return;
    }
    // Enter (no shift) sends
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
        return;
    }
    // Up arrow recalls last sent if at start
    if (e.key === 'ArrowUp') {
      const target = e.currentTarget;
      if (target.selectionStart === 0 && target.selectionEnd === 0 && !target.value) {
        e.preventDefault();
        if (lastSentRef.current) setText(lastSentRef.current);
      }
    }
  };

  return (
  <div data-purpose="chat-input-area" className="p-4 bg-transparent">
      {/* File context area */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {files.map((file, index) => {
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            const icon = ['png','jpg','jpeg','gif','webp','bmp'].includes(ext) ? '🖼️' : ['pdf'].includes(ext) ? '📄' : ['mp3','wav','m4a'].includes(ext) ? '🎵' : ['mp4','mov','webm'].includes(ext) ? '🎬' : '📎';
            return (
              <div key={index} className="flex items-center gap-2 border border-[#e0c87a]/30 bg-[#191d24]/60 rounded px-2 py-1 text-xs text-[#e0c87a]/80">
                <span>{icon} {file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="text-[#e0c87a]/60 hover:text-white" aria-label={`Remove ${file.name}`}>×</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main input form */}
      <form
        ref={containerRef}
        onSubmit={handleSendMessage}
        onDragOver={(e) => { e.preventDefault(); (e.dataTransfer.dropEffect = 'copy'); }}
        onDrop={(e) => { e.preventDefault(); const items = Array.from(e.dataTransfer.files || []); if (items.length) setFiles((prev) => [...prev, ...items]); markActive(); }}
        onPaste={(e) => { const items = Array.from(e.clipboardData?.files || []); if (items.length) { setFiles((prev) => [...prev, ...items]); markActive(); } }}
  className="relative flex items-center gap-2 bg-[#0a0c0e] border-2 border-[#e0c87a] rounded-lg focus-within:shadow-[inset_0_0_0_1px_rgba(224,200,122,0.25)]"
      >
        {/* Streaming ribbon */}
        {isLoading && (
          <div className="pointer-events-none absolute top-0 left-0 h-[3px] w-full bg-[#e0c87a]/70 animate-pulse rounded-t-lg" />
        )}
        {/* Engine selector - bottom-left under input */}
        <div className="absolute -bottom-7 left-0 flex items-center gap-2">
          <label className="text-[10px] tracking-widest uppercase text-[#e0c87a]/80">Engine</label>
          <select
            className="bg-[#0a0c0e] border-2 border-[#e0c87a]/60 rounded px-2 py-0.5 text-[11px] focus:outline-none text-[#e0c87a] shadow-[0_0_6px_rgba(224,200,122,0.18)]"
            value={`${engine}:${engine === 'openai' ? (openaiModel ?? '') : (geminiModel ?? '')}`}
            onChange={(e) => {
              const val = e.target.value;
              const [eng, model] = val.split(':');
              if (eng === 'openai') {
                onEngineChange?.('openai');
                if (model) onOpenaiModelChange?.(model);
              } else if (eng === 'gemini') {
                onEngineChange?.('gemini');
                if (model) onGeminiModelChange?.(model);
              }
            }}
          >
            {/* OpenAI options */}
            <option value="openai:gpt-4o">OPEN AI — GPT-4O</option>
            <option value="openai:gpt-4o-mini">OPEN AI — GPT-4O-MINI</option>
            <option value="openai:gpt-4o-realtime-preview">OPEN AI — GPT-4O-REALTIME-PREVIEW</option>
            {/* Gemini options */}
            <option value="gemini:gemini-2.5-pro">GEMINI-2.5-PRO</option>
            <option value="gemini:gemini-2.5-flash">GEMINI-2.5-FLASH</option>
            <option value="gemini:gemini-2.0-flash-001">GEMINI-2.0-FLASH-001</option>
            <option value="gemini:gemini-2.0-flash-lite-001">GEMINI-2.0-FLASH-LITE-001</option>
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); markActive(); }}
          onKeyDown={handleKeyDown}
          onFocus={markActive}
          placeholder="What are you stuck on? Give me the gist."
          rows={1}
          className="w-full bg-transparent text-stone-200 placeholder-stone-500 resize-none border-none focus:ring-0 p-3 text-base outline-none
                     scrollbar-thin scrollbar-thumb-amber-700/50 scrollbar-track-transparent"
          style={{ maxHeight: '150px' }}
          disabled={isLoading}
          aria-label="Chat input field"
        />

    {/* Hint removed per request */}
        
        {/* Button Group */}
        <div className="flex items-center p-1">
          <button
            type="button"
            onClick={() => { markActive(); fileInputRef.current?.click(); }}
            className="p-2 rounded-full bg-[#0a0c0e] border-2 border-[#e0c87a] text-[#e0c87a]/85 transition-colors duration-200 enabled:hover:bg-[#111317] enabled:hover:shadow-[0_0_6px_rgba(224,200,122,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add Context"
            disabled={isLoading}
          >
            <PlusIcon />
          </button>
          <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              multiple 
              className="hidden" 
          />
          <button
            type="submit"
            onClick={markActive}
            disabled={isLoading || (!text.trim() && files.length === 0)}
            className="p-2 rounded-full bg-[#0a0c0e] border-2 border-[#e0c87a] text-[#e0c87a]/85 transition-colors duration-200 enabled:hover:bg-[#111317] enabled:hover:shadow-[0_0_6px_rgba(224,200,122,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send Message"
          >
            <SendIcon />
          </button>

          {/* Stop button when loading */}
          {isLoading && (
            <button type="button" onClick={onStop} className="ml-1 px-2 py-1 text-xs rounded bg-[#0a0c0e] border-2 border-[#e0c87a] text-[#e0c87a] hover:bg-[#111317]">Stop</button>
          )}
        </div>

        {/* helpers removed per request */}
      </form>

      {/* Removed extra overlay; handlers are on the form */}
    </div>
  );
};

export default ChatInput;