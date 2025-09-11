import React, { useRef, useEffect } from 'react';

type Manifest = Record<string, any>;

interface InsertComponentNameHereProps {
  manifest?: Manifest; // manifest driving layout/content
  personaOverlays?: any[]; // array of persona overlay descriptors
  onAction?: (actionId: string, payload?: any) => void;
}

/**
 * InsertComponentNameHere
 * - Desktop-first, manifest-driven scaffold for Tale Weaver Studio
 * - Drop this file into `components/` and import where needed
 *
 * Contract:
 * - Inputs: `manifest` (object), `personaOverlays` (list), `onAction` (callback)
 * - Outputs: emits actions via `onAction`
 * - Error modes: render safe fallback UI if manifest keys missing
 * - Success: semantic layout rendered, keyboard accessible, manifest annotations present
 */
export default function InsertComponentNameHere({
  manifest = {},
  personaOverlays = [],
  onAction,
}: InsertComponentNameHereProps) {
  const mainRef = useRef<HTMLElement | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Announce manifest load for screen readers
    if (liveRef.current) {
      liveRef.current.textContent = manifest?.title ? `Loaded ${manifest.title}` : 'Loaded workspace';
    }
  }, [manifest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Basic keyboard navigation hints (expand as needed)
    // Arrow keys to navigate panels, Enter/Space to activate primary action
    if (e.key === 'ArrowLeft') {
      onAction?.('navigate.prev');
    } else if (e.key === 'ArrowRight') {
      onAction?.('navigate.next');
    } else if (e.key === 'Escape') {
      onAction?.('overlay.dismiss');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0b0b0d] text-[#E0C87A] font-['Playfair_Display_SC'] antialiased"
      onKeyDown={handleKeyDown}
      aria-label={manifest?.title ?? 'Tale Weaver Workspace'}
    >
      {/* manifest: meta.header */}
      <div className="sr-only" aria-live="polite" ref={liveRef} />

      <header
        role="banner"
        aria-roledescription="application header"
        className="w-full border-b border-[#2c2a28] p-6 lg:px-12 lg:py-8 flex items-center justify-between"
      >
        {/* manifest: header.brand */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-[url('/assets/logo.png')] bg-cover bg-center rounded-md" aria-hidden="true" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" aria-label={manifest?.title ?? 'Tale Weaver Studio'}>
              {manifest?.title ?? 'Tale Weaver Studio'}
            </h1>
            <p className="text-xs lg:text-sm text-[#cab67f]/80">{manifest?.subtitle ?? 'Manifest-driven editorial'}</p>
          </div>
        </div>

        {/* manifest: header.actions */}
        <nav role="navigation" aria-label="Global actions" className="flex gap-3 items-center">
          <button
            className="px-4 py-2 rounded-md border border-[#C9B35F] text-sm lg:text-base hover:bg-[#171718] focus:outline-none focus:ring-2 focus:ring-[#C9B35F]"
            onClick={() => onAction?.('action.create')}
            aria-label="Create new document"
          >
            New
          </button>
          <button
            className="px-4 py-2 rounded-md border border-[#C9B35F] text-sm lg:text-base hover:bg-[#171718] focus:outline-none focus:ring-2 focus:ring-[#C9B35F]"
            onClick={() => onAction?.('action.save')}
            aria-label="Save document"
          >
            Save
          </button>
        </nav>
      </header>

      <main
        ref={mainRef}
        role="main"
        aria-label="Main Panel"
        className="p-6 lg:p-8 xl:p-12 grid grid-cols-12 gap-6"
      >
        {/* manifest: panel.main */}
        {/* Desktop-first layout: two-column main area + right persona overlay */}
        <section
          role="region"
          aria-label="Editor and Canvas"
          className="col-span-8 lg:col-span-9 bg-[#0f1113]/60 rounded-lg p-6 shadow-inner overflow-auto"
          tabIndex={0}
        >
          {/* manifest: editor.content */}
          <div className="flex flex-col gap-6">
            {/* Primary editor row */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              {/* manifest: editor.toolbar */}
              <div className="flex-none w-full lg:w-48">
                <div className="bg-[#0d0e10] border border-[#2b2a28] rounded-md p-3">
                  <p className="text-sm opacity-80">Toolbar</p>
                  {/* manifest: button.action */}
                  <button
                    className="mt-3 w-full text-left px-3 py-2 rounded-md border border-[#C9B35F] focus:outline-none focus:ring-2 focus:ring-[#C9B35F]"
                    onClick={() => onAction?.('toolbar.toggle')}
                  >
                    Toggle
                  </button>
                </div>
              </div>

              {/* manifest: editor.canvas */}
              <div className="flex-1 bg-[#060607] rounded-md p-4 min-h-[540px]">
                <div className="prose prose-invert text-[#E0C87A]">
                  <h2 className="text-xl lg:text-2xl">{manifest?.document?.title ?? 'Untitled'}</h2>
                  <p className="text-sm lg:text-base opacity-80">
                    {/* TODO: renderer will mount here. manifest: renderer.primary */}
                    Content renderer placeholder — renderer will map blocks from manifest.document.blocks
                  </p>
                </div>

                {/* manifest: renderer.controls */}
                <div className="mt-4 flex gap-3">
                  <button
                    className="px-4 py-2 rounded-md border border-[#C9B35F] focus:ring-2 focus:ring-[#C9B35F]"
                    onClick={() => onAction?.('renderer.prev')}
                    aria-label="Previous block"
                  >
                    Prev
                  </button>
                  <button
                    className="px-4 py-2 rounded-md border border-[#C9B35F] focus:ring-2 focus:ring-[#C9B35F]"
                    onClick={() => onAction?.('renderer.next')}
                    aria-label="Next block"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* manifest: panel.secondary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-[#0d0e10] p-3 rounded-md">Inspector (manifest: inspector)</div>
              <div className="col-span-1 bg-[#0d0e10] p-3 rounded-md">Assets (manifest: assets)</div>
              <div className="col-span-1 bg-[#0d0e10] p-3 rounded-md">History (manifest: history)</div>
            </div>
          </div>
        </section>

        {/* manifest: overlay.persona */}
        {/* Right-side persona overlay — desktop only (converts to drawer on mobile) */}
        <aside
          role="complementary"
          aria-label="Persona Overlays"
          className="col-span-4 lg:col-span-3 xl:col-span-3 hidden lg:flex flex-col gap-4"
        >
          <div className="sticky top-6">
            <div className="bg-[#0d0e10] p-4 rounded-md border border-[#2b2a28]">
              <h3 className="text-lg font-medium">Personas</h3>
              <p className="text-sm opacity-80">Active overlays</p>

              <ul className="mt-3 flex flex-col gap-2" role="list" aria-label="Active persona overlays">
                {personaOverlays.length === 0 && (
                  <li className="text-sm opacity-70">No persona overlays configured</li>
                )}
                {personaOverlays.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3" role="listitem">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs opacity-70">{p.description}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded border border-[#C9B35F] text-xs"
                        onClick={() => onAction?.('persona.toggle', p)}
                        aria-label={`Toggle ${p.name}`}
                      >
                        Toggle
                      </button>
                      <button
                        className="px-3 py-1 rounded border border-[#C9B35F] text-xs"
                        onClick={() => onAction?.('persona.config', p)}
                        aria-label={`Configure ${p.name}`}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* manifest: overlay.presets */}
            <div className="mt-4 bg-[#0d0e10] p-3 rounded-md border border-[#2b2a28]">
              <h4 className="text-sm font-semibold">Quick Presets</h4>
              <div className="mt-2 flex flex-col gap-2">
                <button onClick={() => onAction?.('preset.apply', 'muse')} className="text-sm px-3 py-1 rounded border">
                  Muse
                </button>
                <button onClick={() => onAction?.('preset.apply', 'critic')} className="text-sm px-3 py-1 rounded border">
                  Critic
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile placeholders (manifest: nav.mobile) */}
        {/* TODO: For `sm` and `xs` implement: - persona overlay becomes a bottom drawer - right aside -> collapsible drawer - toolbar collapses into icon row */}
      </main>

      <footer role="contentinfo" className="p-4 lg:p-6 border-t border-[#1f1e1d] text-xs text-[#cab67f]/70">
        {/* manifest: footer.meta */}
        <div className="flex items-center justify-between">
          <div>© Tale Weaver Studio</div>
          <div className="opacity-70">Status: {manifest?.status ?? 'Ready'}</div>
        </div>
      </footer>
    </div>
  );
}
