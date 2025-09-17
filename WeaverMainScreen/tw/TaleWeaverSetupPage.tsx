import React, { useMemo, useState } from 'react';
import { WRITERS, WRITING_GENRES, WRITING_ROLES, WRITING_STYLES } from '../data/writingOptions';
import type { TaleWeaverSettings, WriterCategory, WritingGenreCategory, WritingRole, WritingStyleCategory } from '../types';
import { useNavigate } from 'react-router-dom';

// This page reproduces BeVa's flow on its own route to avoid layering conflicts.

type Step = 'landing' | 'role' | 'style' | 'genre' | 'writer' | 'review';

const SectionCard: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-4">
    <h3 className="text-[#e0c87a] tracking-widest uppercase text-sm">{title}</h3>
    {subtitle && <p className="text-stone-400 text-xs mt-1">{subtitle}</p>}
  </div>
);

const OptionButton: React.FC<{
  title: string;
  description?: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ title, description, active, onClick }) => (
  <button
    onClick={onClick}
    className={
      "w-full text-left rounded-lg border-2 px-3 py-2 transition-all duration-200 mb-2 " +
      (active
        ? 'border-amber-300/90 bg-[#0a0c0e] shadow-[0_0_16px_rgba(224,200,122,0.2)]'
        : 'border-[#e0c87a] bg-[#0a0c0e] hover:shadow-[0_0_16px_rgba(224,200,122,0.2)]')
    }
  >
    <div className="text-[#e0c87a] text-sm tracking-widest uppercase">{title}</div>
    {description && <div className="text-xs text-stone-400 mt-0.5">{description}</div>}
  </button>
);

const LandingCard: React.FC<{ onWeave: () => void; onCoWeave: () => void; onReturn: () => void; userName: string }>
  = ({ onWeave, onCoWeave, onReturn, userName }) => (
  <div className="w-full max-w-3xl mx-auto rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e] p-6 shadow-[0_0_20px_rgba(224,200,122,0.2)]">
    <h2 className="vault-title text-center mb-2">Tale Weaver Studio</h2>
    <p className="text-center text-stone-300 mb-6">Welcome, {userName}. Every story etched in ink becomes a monument in time. How would you like to proceed?</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <button onClick={onWeave} className="rounded-lg border-2 border-[#e0c87a] bg-[#13161a] px-6 py-6 text-left">
        <div className="text-lg text-[#e0c87a] font-semibold">Weave a New Tale</div>
        <div className="text-stone-300 text-sm mt-1">Start a fresh story in a solo session.</div>
      </button>
      <button onClick={onCoWeave} className="rounded-lg border-2 border-[#e0c87a] bg-[#13161a] px-6 py-6 text-left">
        <div className="text-lg text-[#e0c87a] font-semibold">Co-Weave a Tale</div>
        <div className="text-stone-300 text-sm mt-1">Create or join a collaborative writing session.</div>
      </button>
    </div>
    <button onClick={onReturn} className="w-full rounded-lg border-2 border-[#e0c87a] bg-[#13161a] px-6 py-4 text-center">
      <div className="text-lg text-[#e0c87a] font-semibold">Return to the Loom</div>
      <div className="text-stone-300 text-sm mt-1">Continue one of your saved projects.</div>
    </button>
    <div className="text-center text-stone-400 text-xs mt-4">← Back to Weaver Vault</div>
  </div>
);

const TaleWeaverSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [userName] = useState<string>(() => {
    try { return localStorage.getItem('wms-user') || 'Writer'; } catch { return 'Writer'; }
  });
  const [step, setStep] = useState<Step>('landing');
  const [styleTab, setStyleTab] = useState<string>('Major Writing Styles');
  const [genreTab, setGenreTab] = useState<string>('Major Genre Styles');
  const [writerTab, setWriterTab] = useState<string>('Popular Writers');
  const [writerQuery, setWriterQuery] = useState('');
  const [settings, setSettings] = useState<TaleWeaverSettings>({ role: '', styleCategory: '', style: '', genreCategory: '', genre: '', writerCategory: '', writer: '' });

  const canNext = useMemo(() => {
    switch (step) {
      case 'role': return Boolean(settings.role);
      case 'style': return Boolean(settings.style && settings.styleCategory);
      case 'genre': return Boolean(settings.genre && settings.genreCategory);
      case 'writer': return Boolean(settings.writer && settings.writerCategory);
      case 'review': return true;
      default: return false;
    }
  }, [step, settings]);

  const headerText = useMemo(() => {
    switch (step) {
      case 'role': return 'Choose Your Writing Role';
      case 'style': return 'Choose Your Writing Style';
      case 'genre': return 'Choose Your Writing Genre';
      case 'writer': return 'Choose a Writer to Emulate';
      case 'review': return 'Weave Your Tale: Project Setup';
      default: return 'Tale Weaver Studio';
    }
  }, [step]);

  const goStudio = () => {
    try { localStorage.setItem('wms-tw-settings', JSON.stringify(settings)); } catch {}
    navigate('/tale-weaver/studio');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-black">
      {step === 'landing' ? (
        <LandingCard
          userName={userName}
          onWeave={() => setStep('role')}
          onCoWeave={() => setStep('role')}
          onReturn={() => setStep('role')}
        />
      ) : (
        <div className="w-full max-w-5xl rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e] p-4 sm:p-6 md:p-8 shadow-[0_0_20px_rgba(224,200,122,0.2)]">
          <h2 className="vault-title text-center mb-4">{headerText}</h2>
          {/* Progress bar */}
          {step !== 'landing' && (
            <div className="w-full h-2 bg-[#1a1e22] rounded mb-4">
              <div className="h-2 bg-[#e0c87a] rounded" style={{ width: (
                step==='role'? '20%': step==='style'? '40%': step==='genre'? '60%': step==='writer'? '80%': '100%'
              ) }} />
            </div>
          )}

          {step === 'role' && (
            <div>
              <SectionCard title="Choose Your Writing Role" />
              <div className="h-[55vh] overflow-y-auto pr-2">
                {WRITING_ROLES.map((r: WritingRole) => (
                  <OptionButton key={r.name} title={r.name} description={r.description} active={settings.role === r.name} onClick={() => setSettings((s) => ({ ...s, role: r.name }))}/>
                ))}
              </div>
            </div>
          )}

          {step === 'style' && (
            <div className="grid grid-cols-[220px_1fr] gap-6">
              <div className="flex flex-col gap-2">
                {WRITING_STYLES.map((cat: WritingStyleCategory) => (
                  <button key={cat.category} onClick={() => setStyleTab(cat.category)} className={(styleTab===cat.category? 'bg-[#1a1e22] ':'') + " text-left rounded border border-[#e0c87a] px-3 py-2 text-[#e0c87a]"}>{cat.category}</button>
                ))}
              </div>
              <div className="h-[55vh] overflow-y-auto pr-2">
                {WRITING_STYLES.filter((c)=>c.category===styleTab).map((cat: WritingStyleCategory) => (
                  <div key={cat.category} className="mb-4">
                    {cat.options.map((opt) => (
                      <OptionButton key={opt.name} title={opt.name} description={opt.description} active={settings.style === opt.name} onClick={() => setSettings((s) => ({ ...s, style: opt.name, styleCategory: cat.category }))} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'genre' && (
            <div className="grid grid-cols-[220px_1fr] gap-6">
              <div className="flex flex-col gap-2">
                {WRITING_GENRES.map((cat: WritingGenreCategory) => (
                  <button key={cat.category} onClick={() => setGenreTab(cat.category)} className={(genreTab===cat.category? 'bg-[#1a1e22] ':'') + " text-left rounded border border-[#e0c87a] px-3 py-2 text-[#e0c87a]"}>{cat.category}</button>
                ))}
              </div>
              <div className="h-[55vh] overflow-y-auto pr-2">
                {WRITING_GENRES.filter((c)=>c.category===genreTab).map((cat: WritingGenreCategory) => (
                  <div key={cat.category} className="mb-4">
                    {cat.options.map((opt) => (
                      <OptionButton key={opt.name} title={opt.name} description={opt.description} active={settings.genre === opt.name} onClick={() => setSettings((s) => ({ ...s, genre: opt.name, genreCategory: cat.category }))} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'writer' && (
            <div className="grid grid-cols-[220px_1fr] gap-6">
              <div className="flex flex-col gap-2">
                {WRITERS.map((cat: WriterCategory) => (
                  <button key={cat.category} onClick={() => setWriterTab(cat.category)} className={(writerTab===cat.category? 'bg-[#1a1e22] ':'') + " text-left rounded border border-[#e0c87a] px-3 py-2 text-[#e0c87a]"}>{cat.category}</button>
                ))}
              </div>
              <div>
                <input value={writerQuery} onChange={(e)=>setWriterQuery(e.target.value)} placeholder="Search for a writer..." className="w-full mb-3 rounded border border-[#e0c87a] bg-transparent text-stone-200 px-3 py-2" />
                <div className="h-[50vh] overflow-y-auto pr-2">
                  {WRITERS.filter((c)=>c.category===writerTab).map((cat: WriterCategory) => (
                    <div key={cat.category} className="mb-4">
                      {cat.writers.filter((w)=>w.name.toLowerCase().includes(writerQuery.toLowerCase())).map((w) => (
                        <OptionButton key={w.name} title={w.name} description={w.description} active={settings.writer === w.name} onClick={() => setSettings((s) => ({ ...s, writer: w.name, writerCategory: cat.category }))} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Role:</span> {settings.role}</div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Style:</span> {settings.style} <span className="text-stone-400">({settings.styleCategory})</span></div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Genre:</span> {settings.genre} <span className="text-stone-400">({settings.genreCategory})</span></div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Writer:</span> {settings.writer} <span className="text-stone-400">({settings.writerCategory})</span></div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => navigate('/')} className="rounded-md border-2 border-[#e0c87a] bg-transparent text-[#e0c87a] px-3 py-1 text-sm uppercase tracking-widest hover:bg-[#0f1317]">Exit to Vault</button>
            <div className="flex items-center gap-2">
              {step !== 'role' && step !== 'landing' && (
                <button onClick={() => setStep((s) => s === 'style' ? 'role' : s === 'genre' ? 'style' : s === 'writer' ? 'genre' : 'writer')} className="rounded-md border-2 border-[#e0c87a] bg-transparent text-[#e0c87a] px-3 py-1 text-sm uppercase tracking-widest hover:bg-[#0f1317]">Back</button>
              )}
              {step !== 'review' && (
                <button disabled={!canNext} onClick={() => setStep((s) => s === 'landing' ? 'role' : s === 'role' ? 'style' : s === 'style' ? 'genre' : s === 'genre' ? 'writer' : 'review')} className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-4 py-1.5 text-sm uppercase tracking-widest disabled:opacity-60 hover:shadow-[0_0_16px_rgba(224,200,122,0.2)]">Next</button>
              )}
              {step === 'review' && (
                <button onClick={goStudio} className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-4 py-1.5 text-sm uppercase tracking-widest hover:shadow-[0_0_16px_rgba(224,200,122,0.2)]">Enter Studio</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaleWeaverSetupPage;
