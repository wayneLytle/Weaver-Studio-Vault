import React, { useEffect, useState } from 'react';
import TaleWeaverStudio from '../components/TaleWeaverStudio';
import type { TaleWeaverSettings, AiEngine } from '../types';
import { useEngine } from '../hooks/useEngine';

const TaleWeaverStudioPage: React.FC = () => {
  const [userName] = useState<string>(() => {
    try { return localStorage.getItem('wms-user') || 'Writer'; } catch { return 'Writer'; }
  });
  const [settings, setSettings] = useState<TaleWeaverSettings | null>(null);
  const [engine, setEngine] = useEngine('tw-studio', 'openai');
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4o-mini');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [muteChime, setMuteChime] = useState<boolean>(() => {
    try { return localStorage.getItem('wms-mute-chime') === '1'; } catch { return false; }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('wms-tw-settings');
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black text-[#e0c87a]">
        Missing studio settings. Please return to setup.
      </div>
    );
  }

  return (
    <div className="tw-shell tw-shell--studio theme-studio">
      <TaleWeaverStudio
        userName={userName}
        settings={settings}
        engine={engine}
        openaiModel={openaiModel}
        geminiModel={geminiModel}
        onEngineChange={(e) => setEngine(e as AiEngine)}
        onOpenaiModelChange={setOpenaiModel}
        onGeminiModelChange={setGeminiModel}
        // @ts-ignore
        isMuted={muteChime}
        onToggleMute={() => setMuteChime((m) => !m)}
      />
    </div>
  );
};

export default TaleWeaverStudioPage;
