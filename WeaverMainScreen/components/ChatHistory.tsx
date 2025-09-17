import React, { useEffect, useRef, useState } from 'react';
import ChatMessageComponent from './ChatMessage';
import type { ChatMessage } from '../types';

interface ChatHistoryProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isIdle?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading, isIdle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [isScrollable, setIsScrollable] = useState(false);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const canScroll = el.scrollHeight > el.clientHeight + 1;
    setIsScrollable(canScroll);
    setAtTop(el.scrollTop <= 1);
    setAtBottom(el.scrollHeight - el.clientHeight - el.scrollTop <= 1);
  }, [messages, isLoading]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const canScroll = el.scrollHeight > el.clientHeight + 1;
      setIsScrollable(canScroll);
      setAtTop(el.scrollTop <= 1);
      setAtBottom(el.scrollHeight - el.clientHeight - el.scrollTop <= 1);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll as any);
  }, []);

  const topFade = isScrollable && !atTop ? 32 : 0;
  const bottomFade = isScrollable && !atBottom ? 32 : 0;
  const maskGradient = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${topFade}px, rgba(0,0,0,1) calc(100% - ${bottomFade}px), rgba(0,0,0,0) 100%)`;

  return (
    <div
      ref={scrollRef}
      data-purpose="chat-history-area"
      // Custom scrollbar styles via Tailwind utilities
  className={`flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto 
         scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-[#e0c87a]/50 hover:scrollbar-thumb-[#e0c87a]/80 
         scrollbar-track-transparent ${isIdle ? 'opacity-60 transition-opacity duration-500' : 'opacity-100 transition-opacity duration-200'}`}
      style={{ WebkitMaskImage: maskGradient as any, maskImage: maskGradient as any }}
    >
      {messages.map((msg, idx) => (
        <ChatMessageComponent key={msg.id} message={msg} index={idx} isIdle={isIdle} total={messages.length} />
      ))}
      {isLoading && (
        <div className="flex items-center space-x-2 text-stone-400 motion-reduce:animate-none" aria-live="polite" aria-atomic="true">
          <div className="w-2 h-2 bg-[#e0c87a] rounded-full animate-pulse [animation-duration:360ms] [animation-timing-function:ease-out] [animation-delay:-0.24s] motion-reduce:animate-none"></div>
          <div className="w-2 h-2 bg-[#e0c87a] rounded-full animate-pulse [animation-duration:360ms] [animation-timing-function:ease-out] [animation-delay:-0.12s] motion-reduce:animate-none"></div>
          <div className="w-2 h-2 bg-[#e0c87a] rounded-full animate-pulse [animation-duration:360ms] [animation-timing-function:ease-out] motion-reduce:animate-none"></div>
          <span className="text-sm">Processing. Hold a moment…</span>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;