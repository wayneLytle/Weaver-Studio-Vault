import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ChatContainer from './components/ChatContainer';
import StudioButton from './components/StudioButton';
import { STUDIO_BUTTONS } from './constants';
import { useEngine } from './hooks/useEngine';
import { useAmbientAudio } from './hooks/useAmbientAudio';
import { BellIcon, BellOffIcon } from './constants';
import { loadGoogleFont, applyTitleFont } from './utils/fontLoader';
import type { TaleWeaverSettings } from './types';
import { useNavigate } from 'react-router-dom';
import { loadManifests } from './services/manifestLoader';
import { setPersona, setTask } from './services/personaStore';
import DevManifestsPanel from './components/DevManifestsPanel';

const App: React.FC = () => {
  // Utility: Only show header if not on /tale-weaver/studio
  function shouldShowHeader(pathname: string) {
    return !pathname.startsWith('/tale-weaver/studio');
  }
  const currentPath = window.location.pathname;
  const [userName, setUserName] = useState<string | null>(null);
  const [engine, setEngine] = useEngine('main-chat', 'openai');
  const [openaiModel, setOpenaiModel] = useState<string>('gpt-4o-mini');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-2.5-flash');
  const [nameInput, setNameInput] = useState('');
  const [activeStudioId, setActiveStudioId] = useState<string>('tale-weaver');
  const navigate = useNavigate();
  const [ambientOn, setAmbientOn] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('wms-ambient-enabled');
      return v ? v === '1' : true;
    } catch {
      return true;
    }
  });
  const [muteChime, setMuteChime] = useState<boolean>(() => {
    try { return localStorage.getItem('wms-mute-chime') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('wms-mute-chime', muteChime ? '1' : '0'); } catch {}
  }, [muteChime]);

  const ambient = useAmbientAudio({
    enabled: Boolean(userName) && ambientOn,
    // Add typewriter and talking, keep biohazard theme
    sources: {
      room: ['/audio/typewriter.mp3'],
      footsteps: ['/audio/talking.mp3'],
      music: ['/audio/biohazard-theme.mp3', '/audio/biohazard-theme.m4a', '/audio/biohazard-theme.ogg'],
    },
  // Mix: music(biohazard)=0.06, typewriter=0.06, talking slightly lower=0.05
  volumes: { room: 0.06, footsteps: 0.05, music: 0.06 },
    crossfadeMs: 900,
  });

  const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE !== 'production');
  const [showMix, setShowMix] = useState(false);
  const [mix, setMix] = useState<{ room: number; footsteps: number; music: number }>({ room: 0.06, footsteps: 0.05, music: 0.06 });
  const [titleFont, setTitleFont] = useState<string>(() => {
    try { return localStorage.getItem('wms-title-font') || "'Marcellus'"; } catch { return "'Marcellus'"; }
  });
  const [titleWeight, setTitleWeight] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('wms-title-weight') || '800', 10); } catch { return 800; }
  });
  // Load saved mix
  useEffect(() => {
    try {
      const r = parseFloat(localStorage.getItem('wms-mix-room') || '');
      const f = parseFloat(localStorage.getItem('wms-mix-footsteps') || '');
      const m = parseFloat(localStorage.getItem('wms-mix-music') || '');
      setMix((prev) => ({
        room: Number.isFinite(r) ? r : prev.room,
        footsteps: Number.isFinite(f) ? f : prev.footsteps,
        music: Number.isFinite(m) ? m : prev.music,
      }));
    } catch {}
  }, []);
  // Apply mix to ambient
  useEffect(() => {
    try {
      ambient.setVolume?.('room', mix.room);
      ambient.setVolume?.('footsteps', mix.footsteps);
      ambient.setVolume?.('music', mix.music);
    } catch {}
  }, [mix, ambient]);
  // Persist mix
  useEffect(() => {
    try {
      localStorage.setItem('wms-mix-room', String(mix.room));
      localStorage.setItem('wms-mix-footsteps', String(mix.footsteps));
      localStorage.setItem('wms-mix-music', String(mix.music));
    } catch {}
  }, [mix]);

  // Apply font choice via CSS variables on root
  useEffect(() => {
    try {
      const displayName = titleFont.replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');
      loadGoogleFont(displayName, [700,800,900]);
      applyTitleFont(titleFont, titleWeight);
      localStorage.setItem('wms-title-font', titleFont);
      localStorage.setItem('wms-title-weight', String(titleWeight));
    } catch {}
  }, [titleFont, titleWeight]);

  useEffect(() => {
    try {
      const keys = [
        'user',
        'currentUser',
        'auth',
        'token',
        'beva-user',
        'tale-weaver-sessions',
      ];
      keys.forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {}
  }, []);

  // Boot: load manifests and set default persona/task intent
  useEffect(() => {
    (async () => {
      try {
        const m = await loadManifests();
        if (m?.persona?.persona) setPersona(m.persona.persona);
        // Default to editorial intent for Tale Weaver to route via OpenAI
        const defaultIntent = 'editorial';
        setTask({ intent: defaultIntent });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('wms-ambient-enabled', ambientOn ? '1' : '0');
    } catch {}
  }, [ambientOn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed) {
      try { localStorage.setItem('wms-user', trimmed); } catch {}
      setUserName(trimmed);
    }
  };

  // Desired left-panel order for studios
  const orderedStudios = useMemo(() => (
    ['tale-weaver', 'ink-weaver', 'scene-weaver', 'code-weaver', 'audio-weaver', 'battle-bot']
    .map((id) => STUDIO_BUTTONS.find((s) => s.id === id))
    .filter((s): s is typeof STUDIO_BUTTONS[number] => Boolean(s))
  ), []);

  // Measure widest studio button after first render
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [uniformWidth, setUniformWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const widths = buttonRefs.current
      .map((el) => el?.offsetWidth || 0);
    const max = Math.max(0, ...widths);
    if (max && max !== uniformWidth) setUniformWidth(max);
  }, [orderedStudios, userName]);

  return (
    <div
      data-purpose="app-container"
      data-layout="main"
      className="relative min-h-screen w-full flex flex-col text-stone-200"
    >
      {/* Header (shown after login, hidden on /tale-weaver/studio) */}
      {userName && shouldShowHeader(currentPath) && (
        <header
          className="w-full z-10 py-3 sm:py-4 md:py-5"
          data-purpose="app-header"
        >
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <h1
              className="vault-title text-center flex-1 overflow-visible"
            >
              Welcome To The Vault
            </h1>
          </div>
        </header>
      )}

      {/* Login Gate (identical to BeVa) */}
      {!userName && (
        <div
          className="h-screen w-screen flex flex-col items-center p-4 font-body bg-vault"
        >
          {/* Darkening overlay */}
          <div className="absolute inset-0 bg-black/60"></div>

          {/* Content container */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-4xl py-16 md:py-24">
            {/* Title matches main area header style (no background bar) */}
            <div className="w-full text-center">
              <h1 className="vault-title overflow-visible">
                Weavers Studio Vault
              </h1>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="w-full max-w-xs flex flex-col gap-6">
              {/* Name Input styled like StudioButtons */}
              <div className="relative">
                <div className="relative z-10 group rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e]/100 px-4 py-3 transition-all duration-300 focus-within:shadow-[0_0_20px_rgba(224,200,122,0.35)]">
                  <label htmlFor="wms-name-input" className="block text-xs tracking-widest uppercase text-[#e0c87a]/90 mb-1">Name</label>
                  <input
                    id="wms-name-input"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-transparent text-stone-200 text-lg placeholder-stone-500 focus:outline-none caret-[#e0c87a]"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button styled like StudioButtons */}
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full group rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e]/100 px-4 py-3 text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(224,200,122,0.35)] focus:outline-none focus:ring-2 focus:ring-[#e0c87a] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="block text-[#e0c87a] group-hover:text-amber-200 font-title text-xl tracking-widest uppercase">
                  Enter The Vault
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Content Wrapper */}
      {userName && (
  <div className="w-full flex-grow grid grid-cols-1 md:grid-cols-[385px_1fr] items-stretch gap-6 p-4 sm:p-6 md:p-8 z-10">
        {/* Left: Stacked Studio Buttons (fixed 385px rail) */}
        <aside className="w-full space-y-4" data-purpose="studio-selector-left">
          {orderedStudios.map((studio, idx) => (
            <StudioButton
              key={studio.id}
              ref={(el) => (buttonRefs.current[idx] = el)}
              title={studio.title}
              description={studio.description}
              height={55}
              width={385}
              descriptionLeftShift={studio.id === 'code-weaver'}
              active={activeStudioId === studio.id}
              onClick={() => {
                setActiveStudioId(studio.id);
                if (studio.id === 'tale-weaver') {
                  navigate('/tale-weaver/setup');
                }
              }}
            />
          ))}
        </aside>

        {/* Right: Chat Area aligned right (auto column) */}
        <main className="w-full h-full flex items-end justify-center z-10" data-purpose="main-content">
          <ChatContainer
            userName={userName}
            engine={engine}
            geminiModel={geminiModel}
            openaiModel={openaiModel}
            onEngineChange={(e) => setEngine(e)}
            onOpenaiModelChange={(m) => setOpenaiModel(m)}
            onGeminiModelChange={(m) => setGeminiModel(m)}
            studioId={activeStudioId}
            // pass mute overrides
            // @ts-ignore
            isMuted={muteChime}
            onToggleMute={() => setMuteChime((m) => !m)}
          />
        </main>
      </div>
      )}

      {/* Ambient toggle moved to bottom-left, styled like input background, scaled 75% */}
      {userName && (
        <div className="fixed bottom-4 left-4 z-20 flex items-center gap-2 transform-gpu scale-75 origin-bottom-left">
          <button
            type="button"
            title={ambientOn ? 'Ambient on' : 'Ambient off'}
            onClick={() => setAmbientOn((v) => !v)}
            className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-3 py-1 text-sm tracking-widest uppercase shadow-[0_0_10px_rgba(0,0,0,0.35)] hover:text-amber-200 hover:shadow-[0_0_16px_rgba(224,200,122,0.25)]"
          >
            {ambientOn ? 'Ambient: On' : 'Ambient: Off'}
          </button>
          {isDev && (
            <>
              <button
                type="button"
                onClick={() => setShowMix((v) => !v)}
                className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-2 py-1 text-sm shadow-[0_0_10px_rgba(0,0,0,0.35)] hover:text-amber-200 hover:shadow-[0_0_16px_rgba(224,200,122,0.25)]"
                title="Adjust ambient volumes"
              >
                {showMix ? 'Hide Mix' : 'Mix'}
              </button>
              <div className="relative flex items-center">
                <select
                  value={titleFont}
                  onChange={(e) => {
                    const value = e.target.value;
                    const displayName = value.replace(/^'+|'+$/g, '').replace(/^"+|"+$/g, '');
                    loadGoogleFont(displayName, [700,800,900]);
                    setTitleFont(value);
                  }}
                  className="ml-2 rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-2 py-1 text-sm shadow-[0_0_10px_rgba(0,0,0,0.35)]"
                  title="Title Font"
                >
                  {/* Curated display/serif titling faces suited for steampunk/brass */}
                  <option value="'Marcellus'">Marcellus</option>
                  <option value="'Cinzel Decorative'">Cinzel Decorative</option>
                  <option value="'Cinzel'">Cinzel</option>
                  <option value="'Cormorant SC'">Cormorant SC</option>
                  <option value="'Cormorant Garamond'">Cormorant Garamond</option>
                  <option value="'Cormorant Upright'">Cormorant Upright</option>
                  <option value="'Gloock'">Gloock</option>
                  <option value="'Prata'">Prata</option>
                  <option value="'Bodoni Moda'">Bodoni Moda</option>
                  <option value="'DM Serif Display'">DM Serif Display</option>
                  <option value="'Arapey'">Arapey</option>
                  <option value="'Spectral SC'">Spectral SC</option>
                  <option value="'Lustria'">Lustria</option>
                  <option value="'Yeseva One'">Yeseva One</option>
                  <option value="'Alexandria'">Alexandria</option>
                  <option value="'Brygada 1918'">Brygada 1918</option>
                  <option value="'Rosarivo'">Rosarivo</option>
                  <option value="'Cinzel Decorative'">Cinzel Decorative</option>
                  <option value="'Libre Baskerville'">Libre Baskerville</option>
                  <option value="'Playfair Display'">Playfair Display</option>
                  <option value="'Playfair Display SC'">Playfair Display SC</option>
                  <option value="'Crimson Pro'">Crimson Pro</option>
                  <option value="'EB Garamond'">EB Garamond</option>
                  <option value="'Vidaloka'">Vidaloka</option>
                  <option value="'Stoke'">Stoke</option>
                  <option value="'Abhaya Libre'">Abhaya Libre</option>
                  <option value="'Cardo'">Cardo</option>
                  <option value="'Faustina'">Faustina</option>
                  <option value="'Quattrocento'">Quattrocento</option>
                  <option value="'Quattrocento Sans'">Quattrocento Sans</option>
                  <option value="'Italiana'">Italiana</option>
                  <option value="'Forum'">Forum</option>
                  <option value="'Alice'">Alice</option>
                  <option value="'Cinzel'">Cinzel</option>
                  <option value="'Castoro Titling'">Castoro Titling</option>
                  <option value="'IM Fell English SC'">IM Fell English SC</option>
                  <option value="'IM Fell English'">IM Fell English</option>
                  <option value="'Unna'">Unna</option>
                  <option value="'Rosarivo'">Rosarivo</option>
                  <option value="'Lora'">Lora</option>
                  <option value="'Cormorant Infant'">Cormorant Infant</option>
                  <option value="'Cinzel Decorative'">Cinzel Decorative</option>
                  <option value="'GFS Didot'">GFS Didot</option>
                  <option value="'Cormorant Garamond'">Cormorant Garamond</option>
                  <option value="'Noto Serif Display'">Noto Serif Display</option>
                  <option value="'Sorts Mill Goudy'">Sorts Mill Goudy</option>
                  <option value="'Cormorant'">Cormorant</option>
                  <option value="'Cormorant SC'">Cormorant SC</option>
                  <option value="'Grenze Gotisch'">Grenze Gotisch</option>
                  <option value="'Junge'">Junge</option>
                </select>
                <select
                  value={titleWeight}
                  onChange={(e) => setTitleWeight(parseInt(e.target.value, 10))}
                  className="ml-2 rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-2 py-1 text-sm shadow-[0_0_10px_rgba(0,0,0,0.35)]"
                  title="Title Weight"
                >
                  <option value={700}>700</option>
                  <option value={800}>800</option>
                  <option value={900}>900</option>
                </select>
              </div>
              {showMix && (
                <div className="absolute -top-44 left-0 w-64 rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] p-3 shadow-[0_0_16px_rgba(224,200,122,0.2)]">
                  <div className="text-xs uppercase tracking-widest text-[#e0c87a]/80 mb-2">Ambient Mix</div>
                  <div className="mb-2">
                    <label className="flex justify-between text-[11px] text-[#e0c87a]/90 mb-1">
                      <span>Typewriter</span>
                      <span>{mix.room.toFixed(3)}</span>
                    </label>
                    <input aria-label="Typewriter volume" title="Typewriter volume" type="range" min={0} max={0.3} step={0.005} value={mix.room}
                      onChange={(e) => setMix((m) => ({ ...m, room: parseFloat(e.target.value) }))}
                      className="w-full accent-amber-400" />
                  </div>
                  <div className="mb-2">
                    <label className="flex justify-between text-[11px] text-[#e0c87a]/90 mb-1">
                      <span>Talking</span>
                      <span>{mix.footsteps.toFixed(3)}</span>
                    </label>
                    <input aria-label="Talking volume" title="Talking volume" type="range" min={0} max={0.3} step={0.005} value={mix.footsteps}
                      onChange={(e) => setMix((m) => ({ ...m, footsteps: parseFloat(e.target.value) }))}
                      className="w-full accent-amber-400" />
                  </div>
                  <div>
                    <label className="flex justify-between text-[11px] text-[#e0c87a]/90 mb-1">
                      <span>Music</span>
                      <span>{mix.music.toFixed(3)}</span>
                    </label>
                    <input aria-label="Music volume" title="Music volume" type="range" min={0} max={0.3} step={0.005} value={mix.music}
                      onChange={(e) => setMix((m) => ({ ...m, music: parseFloat(e.target.value) }))}
                      className="w-full accent-amber-400" />
                  </div>
                </div>
              )}
            </>
          )}
          <button
            type="button"
            title={muteChime ? 'Unmute chime' : 'Mute chime'}
            onClick={() => setMuteChime((m) => !m)}
            className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-2 py-1 shadow-[0_0_10px_rgba(0,0,0,0.35)] hover:text-amber-200 hover:shadow-[0_0_16px_rgba(224,200,122,0.25)]"
            aria-label={muteChime ? 'Unmute response chime' : 'Mute response chime'}
          >
            {muteChime ? <BellOffIcon /> : <BellIcon />}
          </button>
        </div>
      )}
      {userName && isDev && (
        <DevManifestsPanel />
      )}
    </div>
  );
};

export default App;