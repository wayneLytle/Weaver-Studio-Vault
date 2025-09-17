import React, { useMemo, useState } from 'react';
import { WRITING_ROLES, WRITING_STYLES, WRITING_GENRES, WRITERS } from '../data/writingOptions';
import type { TaleWeaverSettings, WriterCategory, WritingGenreCategory, WritingStyleCategory, WritingRole } from '../types';

export interface TaleWeaverSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (settings: TaleWeaverSettings) => void;
}

type Step = 'role' | 'style' | 'genre' | 'writer' | 'review';

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

const TaleWeaverSetupWizard: React.FC<TaleWeaverSetupWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<Step>('role');
  const [settings, setSettings] = useState<TaleWeaverSettings>({
    role: '', styleCategory: '', style: '', genreCategory: '', genre: '', writerCategory: '', writer: ''
  });

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
      case 'role': return 'Choose Your Role';
      case 'style': return 'Choose Writing Style';
      case 'genre': return 'Choose Genre';
      case 'writer': return 'Choose a Writer Voice';
      case 'review': return 'Review & Enter Studio';
      default: return '';
    }
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl mx-auto rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e] p-4 sm:p-6 md:p-8 shadow-[0_0_20px_rgba(224,200,122,0.2)]">
        <div className="mb-4">
          <h2 className="vault-title text-center">Tale Weaver Studio</h2>
          <p className="text-center text-stone-300">{headerText}</p>
        </div>

        {/* Steps */}
        {step === 'role' && (
          <div>
            <SectionCard title="Your Role" subtitle="Helps tailor guidance and tooling" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WRITING_ROLES.map((r: WritingRole) => (
                <OptionButton key={r.name}
                  title={r.name}
                  description={r.description}
                  active={settings.role === r.name}
                  onClick={() => setSettings((s) => ({ ...s, role: r.name }))}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'style' && (
          <div>
            <SectionCard title="Style Category" subtitle="Pick a category then a style" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WRITING_STYLES.map((cat: WritingStyleCategory) => (
                <div key={cat.category}>
                  <div className="text-[#e0c87a] text-sm tracking-widest uppercase mb-2">{cat.category}</div>
                  {cat.options.map((opt) => (
                    <OptionButton key={opt.name}
                      title={opt.name}
                      description={opt.description}
                      active={settings.style === opt.name}
                      onClick={() => setSettings((s) => ({ ...s, style: opt.name, styleCategory: cat.category }))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'genre' && (
          <div>
            <SectionCard title="Genre" subtitle="Select a genre that fits your project" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WRITING_GENRES.map((cat: WritingGenreCategory) => (
                <div key={cat.category}>
                  <div className="text-[#e0c87a] text-sm tracking-widest uppercase mb-2">{cat.category}</div>
                  {cat.options.map((opt) => (
                    <OptionButton key={opt.name}
                      title={opt.name}
                      description={opt.description}
                      active={settings.genre === opt.name}
                      onClick={() => setSettings((s) => ({ ...s, genre: opt.name, genreCategory: cat.category }))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'writer' && (
          <div>
            <SectionCard title="Writer Voice" subtitle="Pick a voice to emulate (optional)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WRITERS.map((cat: WriterCategory) => (
                <div key={cat.category}>
                  <div className="text-[#e0c87a] text-sm tracking-widest uppercase mb-2">{cat.category}</div>
                  {cat.writers.map((w) => (
                    <OptionButton key={w.name}
                      title={w.name}
                      description={w.description}
                      active={settings.writer === w.name}
                      onClick={() => setSettings((s) => ({ ...s, writer: w.name, writerCategory: cat.category }))}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div>
            <SectionCard title="Review" subtitle="Confirm your setup before entering the studio" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Role:</span> {settings.role}</div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Style:</span> {settings.style} <span className="text-stone-400">({settings.styleCategory})</span></div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Genre:</span> {settings.genre} <span className="text-stone-400">({settings.genreCategory})</span></div>
              <div className="text-stone-300"><span className="text-[#e0c87a] uppercase tracking-widest">Writer:</span> {settings.writer} <span className="text-stone-400">({settings.writerCategory})</span></div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="mt-6 flex items-center justify-between">
          <button onClick={onClose} className="rounded-md border-2 border-[#e0c87a] bg-transparent text-[#e0c87a] px-3 py-1 text-sm uppercase tracking-widest hover:bg-[#0f1317]">Cancel</button>
          <div className="flex items-center gap-2">
            {step !== 'role' && (
              <button onClick={() => setStep((s) => s === 'style' ? 'role' : s === 'genre' ? 'style' : s === 'writer' ? 'genre' : 'writer')} className="rounded-md border-2 border-[#e0c87a] bg-transparent text-[#e0c87a] px-3 py-1 text-sm uppercase tracking-widest hover:bg-[#0f1317]">Back</button>
            )}
            {step !== 'review' && (
              <button
                disabled={!canNext}
                onClick={() => setStep((s) => s === 'role' ? 'style' : s === 'style' ? 'genre' : s === 'genre' ? 'writer' : 'review')}
                className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-4 py-1.5 text-sm uppercase tracking-widest disabled:opacity-60 hover:shadow-[0_0_16px_rgba(224,200,122,0.2)]"
              >
                Next
              </button>
            )}
            {step === 'review' && (
              <button
                onClick={() => onComplete(settings)}
                className="rounded-md border-2 border-[#e0c87a] bg-[#0a0c0e] text-[#e0c87a] px-4 py-1.5 text-sm uppercase tracking-widest hover:shadow-[0_0_16px_rgba(224,200,122,0.2)]"
              >
                Enter Studio
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaleWeaverSetupWizard;
