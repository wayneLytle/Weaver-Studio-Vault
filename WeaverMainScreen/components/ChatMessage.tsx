import React, { useEffect, useState } from 'react';
import type { ChatMessage } from '../types';

interface ChatMessageProps {
  message: ChatMessage;
  index?: number;
  total?: number;
  isIdle?: boolean;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message, index = 0, total = 1, isIdle = false }) => {
  const [mounted, setMounted] = useState(false);
  const [currentDuration, setCurrentDuration] = useState<number | null>(null);
  const [shimmerOpacity, setShimmerOpacity] = useState<number>(1);
  const [shimmerShadow, setShimmerShadow] = useState<string>('none');
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const isUser = message.sender === 'user';
  const lineCount = (message.text?.split(/\n+/)?.length || 1);
  const botDuration = Math.min(450, 380 + Math.max(0, lineCount - 1) * 35);
  const userDuration = 220;
  const durationMs = isUser ? userDuration : botDuration;
  const delayMs = isUser ? 0 : Math.min(120, Math.max(0, lineCount - 1) * 20);

  useEffect(() => {
    setCurrentDuration(durationMs);
  }, [durationMs]);

  useEffect(() => {
    if (!mounted) return;
    if (isUser) return;
    const prefersReduced = typeof window !== 'undefined' && 'matchMedia' in window && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const totalTime = delayMs + durationMs + 20;
    const timer = setTimeout(() => {
      setCurrentDuration(0);
      setShimmerOpacity(0.95);
      setShimmerShadow('0 0 8px rgba(224,200,122,0.15)');
      requestAnimationFrame(() => {
        setCurrentDuration(80);
        setShimmerOpacity(1);
        setShimmerShadow('none');
      });
    }, totalTime);
    return () => clearTimeout(timer);
  }, [mounted, isUser, delayMs, durationMs]);
  
  // Base container styles
  const containerClasses = `flex items-start gap-2 w-full max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`;
  
  // Bubble styles
  const bubbleClasses = `rounded-lg px-4 py-2 text-stone-200 bg-[#0a0c0e]/100 border-2 border-[#e0c87a] transition-all ease-out [will-change:transform,opacity] motion-reduce:transition-none motion-reduce:transform-none ` +
    (mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-1 scale-[0.99]');
  const bubbleStyle: React.CSSProperties = {
    transitionDuration: `${(currentDuration ?? durationMs)}ms`,
    transitionDelay: `${delayMs}ms`,
    ...(mounted ? { opacity: shimmerOpacity, boxShadow: shimmerShadow } : {}),
    ...(isIdle
      ? {
          opacity: 0,
          transitionDuration: '800ms',
          transitionDelay: `${Math.min(600, index * 80)}ms`,
        }
      : {}),
  };
  
  // Persona avatar styles
  const avatarClasses = `w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isUser ? 'bg-amber-800 text-amber-200' : 'bg-slate-600 text-slate-200'}`;

  return (
    <div 
        data-purpose="chat-message" 
        data-sender={message.sender}
        className={containerClasses}>
      {isUser ? (
        <>
          <div className={bubbleClasses} style={bubbleStyle}>
            {/* Engine/Model badge for assistant replies */}
            {message.sender === 'bot' && (message.engineUsed || message.modelUsed) && (
              <div className="-mt-1 -mb-1 mb-1 flex justify-end">
                <span className="inline-flex items-center gap-1 text-[10px] tracking-wide px-2 py-[2px] rounded border border-[#e0c87a]/60 text-[#e0c87a]/90 bg-black/30">
                  {message.engineUsed ? message.engineUsed.toUpperCase() : null}
                  {message.modelUsed ? `— ${message.modelUsed}` : null}
                </span>
              </div>
            )}
            <p className="whitespace-pre-wrap not-italic">{message.text}</p>
            {message.files && message.files.length > 0 && (
              <div className="mt-2 pt-2 border-t border-stone-500/50">
                {message.files.map((file, index) => (
                  <span key={index} className="text-xs text-stone-400 block">
                    Context: {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={avatarClasses}>U</div>
        </>
      ) : (
        <>
          <div className={avatarClasses}>🧨</div>
          <div className={bubbleClasses} style={bubbleStyle}>
        {/* Engine/Model badge for assistant replies */}
        {message.sender === 'bot' && (message.engineUsed || message.modelUsed) && (
          <div className="-mt-1 -mb-1 mb-1 flex justify-end">
            <span className="inline-flex items-center gap-1 text-[10px] tracking-wide px-2 py-[2px] rounded border border-[#e0c87a]/60 text-[#e0c87a]/90 bg-black/30">
              {message.engineUsed ? message.engineUsed.toUpperCase() : null}
              {message.modelUsed ? `— ${message.modelUsed}` : null}
            </span>
          </div>
        )}
        <p className="whitespace-pre-wrap not-italic">{message.text}</p>
        {message.files && message.files.length > 0 && (
            <div className="mt-2 pt-2 border-t border-stone-500/50">
                {message.files.map((file, index) => (
                    <span key={index} className="text-xs text-stone-400 block">
                        Context: {file.name}
                    </span>
                ))}
            </div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMessageComponent;