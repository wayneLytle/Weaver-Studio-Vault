import React from 'react';
import type { Studio } from '../types';

type StudioButtonProps = Omit<Studio, 'id'> & {
  height?: number;
  width?: number;
  descriptionLeftShift?: boolean;
  active?: boolean;
  onClick?: () => void;
};

// Typewriter-like hover SFX (shared across buttons)
let _audioCtx: AudioContext | null = null;
let _lastHoverPlay = 0;
let _noiseBuffer: AudioBuffer | null = null;
let _lastClickPlay = 0;

function ensureNoiseBuffer(ctx: AudioContext) {
  if (_noiseBuffer) return _noiseBuffer;
  const duration = 0.15; // 150ms buffer, we envelope it shorter
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(duration * sampleRate));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    // Slightly pink-ish noise by averaging a couple randoms
    data[i] = (Math.random() * 2 - 1 + Math.random() * 2 - 1) * 0.5;
  }
  _noiseBuffer = buffer;
  return buffer;
}

function playHoverSound() {
  try {
    const AudioContextCtor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!_audioCtx) {
      _audioCtx = new AudioContextCtor();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume().catch(() => {});
    }

    const nowMs = performance.now();
    if (nowMs - _lastHoverPlay < 140) return; // throttle quick re-enters
    _lastHoverPlay = nowMs;

    const now = _audioCtx.currentTime;

    // Subtle master bus with a soft compressor for cohesiveness
  const comp = _audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-30, now);
    comp.knee.setValueAtTime(24, now);
    comp.ratio.setValueAtTime(4, now);
    comp.attack.setValueAtTime(0.003, now);
    comp.release.setValueAtTime(0.08, now);

    const mix = _audioCtx.createGain();
    mix.gain.setValueAtTime(0.2, now); // overall level (subtle)
  mix.connect(comp);
  const vintageLPF = _audioCtx.createBiquadFilter();
  vintageLPF.type = 'lowpass';
  vintageLPF.frequency.setValueAtTime(5000, now);
  vintageLPF.Q.setValueAtTime(0.707, now);
  comp.connect(vintageLPF);
  vintageLPF.connect(_audioCtx.destination);

    // Slight per-hit variation
    const vrand = (min: number, max: number) => min + Math.random() * (max - min);

    // Typewriter key press impression: click (high), clack (low), faint ring

    // 1) Click — sharp high-frequency noise burst (key cap)
    const noiseBuf = ensureNoiseBuffer(_audioCtx);
    const click = _audioCtx.createBufferSource();
    click.buffer = noiseBuf;
    const clickHP = _audioCtx.createBiquadFilter();
    clickHP.type = 'highpass';
    clickHP.frequency.setValueAtTime(vrand(2600, 3400), now);
    const clickBP = _audioCtx.createBiquadFilter();
    clickBP.type = 'bandpass';
    clickBP.frequency.setValueAtTime(vrand(3200, 4200), now);
    clickBP.Q.setValueAtTime(0.9, now);
    const clickGain = _audioCtx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(vrand(0.05, 0.07), now + 0.003);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + vrand(0.045, 0.06));
    click.connect(clickHP);
    clickHP.connect(clickBP);
    clickBP.connect(clickGain);
    clickGain.connect(mix);
    click.start(now);
    click.stop(now + 0.08);

    // 2) Clack — short low-mid thud (mechanical bottom-out)
    const clackOsc = _audioCtx.createOscillator();
    const clackGain = _audioCtx.createGain();
    clackOsc.type = 'square';
    clackOsc.frequency.setValueAtTime(vrand(180, 240), now);
    clackOsc.frequency.exponentialRampToValueAtTime(vrand(140, 190), now + 0.06);
    clackGain.gain.setValueAtTime(0.0001, now);
    clackGain.gain.exponentialRampToValueAtTime(vrand(0.07, 0.1), now + 0.006);
    clackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    // Touch of saturation
    const shaper = _audioCtx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(2.5 * x);
    }
    shaper.curve = curve;
    shaper.oversample = '2x';
    const bodyPEQ = _audioCtx.createBiquadFilter();
    bodyPEQ.type = 'peaking';
    bodyPEQ.frequency.setValueAtTime(vrand(380, 520), now);
    bodyPEQ.Q.setValueAtTime(1.5, now);
    bodyPEQ.gain.setValueAtTime(6, now);
    const delay = _audioCtx.createDelay(0.2);
    delay.delayTime.setValueAtTime(0.018, now);
    const fb = _audioCtx.createGain();
    fb.gain.setValueAtTime(0.12, now);
    const delayLP = _audioCtx.createBiquadFilter();
    delayLP.type = 'lowpass';
    delayLP.frequency.setValueAtTime(1400, now);
    shaper.connect(bodyPEQ);
    bodyPEQ.connect(clackGain);
    // Send a bit into a woody short delay
    const send = _audioCtx.createGain();
    send.gain.setValueAtTime(0.2, now);
    bodyPEQ.connect(send);
    send.connect(delay);
    delay.connect(delayLP);
    delayLP.connect(fb);
    fb.connect(delay);
    const returnGain = _audioCtx.createGain();
    returnGain.gain.setValueAtTime(0.18, now);
    delayLP.connect(returnGain);
    returnGain.connect(mix);
    clackGain.connect(mix);
    clackOsc.start(now);
    clackOsc.stop(now + 0.13);

    // 3) Rattle — brief bandpassed noise for mechanical chatter
    const ratt = _audioCtx.createBufferSource();
    ratt.buffer = noiseBuf;
  const rattBP = _audioCtx.createBiquadFilter();
    rattBP.type = 'bandpass';
  rattBP.frequency.setValueAtTime(vrand(800, 1200), now);
    rattBP.Q.setValueAtTime(1.2, now);
    const rattGain = _audioCtx.createGain();
    rattGain.gain.setValueAtTime(0.0001, now);
    rattGain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    rattGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    ratt.connect(rattBP);
    rattBP.connect(rattGain);
    rattGain.connect(mix);
    ratt.start(now);
    ratt.stop(now + 0.09);

    // 4) Ring — light metallic overtones
    const ringOsc = _audioCtx.createOscillator();
    const ringGain = _audioCtx.createGain();
    ringOsc.type = 'triangle';
    ringOsc.frequency.setValueAtTime(vrand(1800, 2200), now);
    ringGain.gain.setValueAtTime(0.0001, now);
    ringGain.gain.exponentialRampToValueAtTime(0.025, now + 0.004);
    ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    ringOsc.connect(ringGain);
    ringGain.connect(mix);
    ringOsc.start(now);
    ringOsc.stop(now + 0.1);
  } catch {}
}

function playCarriageReturn() {
  try {
    const AudioContextCtor: any = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!_audioCtx) {
      _audioCtx = new AudioContextCtor();
    }
    if (_audioCtx.state === 'suspended') {
      _audioCtx.resume().catch(() => {});
    }

    const nowMs = performance.now();
    if (nowMs - _lastClickPlay < 150) return;
    _lastClickPlay = nowMs;

    const now = _audioCtx.currentTime;

    // Master chain
    const comp = _audioCtx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-28, now);
    comp.knee.setValueAtTime(24, now);
    comp.ratio.setValueAtTime(3.5, now);
    comp.attack.setValueAtTime(0.005, now);
    comp.release.setValueAtTime(0.12, now);

    const mix = _audioCtx.createGain();
    mix.gain.setValueAtTime(0.22, now);
    mix.connect(comp);
    comp.connect(_audioCtx.destination);

    const vrand = (min: number, max: number) => min + Math.random() * (max - min);
    const noiseBuf = ensureNoiseBuffer(_audioCtx);

    // 1) Ratchet/slide: band-passed noise with slight downward sweep
    const slide = _audioCtx.createBufferSource();
    slide.buffer = noiseBuf;
    const slideBP = _audioCtx.createBiquadFilter();
    slideBP.type = 'bandpass';
    slideBP.frequency.setValueAtTime(vrand(1400, 1700), now);
    slideBP.Q.setValueAtTime(1.0, now);
    const slideGain = _audioCtx.createGain();
    slideGain.gain.setValueAtTime(0.0001, now);
    slideGain.gain.exponentialRampToValueAtTime(0.06, now + 0.015);
    slideGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    slide.connect(slideBP);
    slideBP.connect(slideGain);
    slideGain.connect(mix);
    slide.start(now);
    slide.stop(now + 0.24);

    // 2) Carriage body thunk
    const thunkOsc = _audioCtx.createOscillator();
    const thunkGain = _audioCtx.createGain();
    thunkOsc.type = 'square';
    thunkOsc.frequency.setValueAtTime(vrand(140, 180), now);
    thunkOsc.frequency.exponentialRampToValueAtTime(vrand(90, 120), now + 0.06);
    thunkGain.gain.setValueAtTime(0.0001, now);
    thunkGain.gain.exponentialRampToValueAtTime(0.08, now + 0.008);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    const thunkShape = _audioCtx.createWaveShaper();
    const tcurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      tcurve[i] = Math.tanh(2.2 * x);
    }
    thunkShape.curve = tcurve;
    thunkShape.oversample = '2x';
    thunkOsc.connect(thunkShape);
    thunkShape.connect(thunkGain);
    thunkGain.connect(mix);
    thunkOsc.start(now);
    thunkOsc.stop(now + 0.15);

    // 3) End-of-line bell ding (soft, pleasant)
    const bell = _audioCtx.createOscillator();
    const bellGain = _audioCtx.createGain();
    bell.type = 'sine';
    // Two partials for a more bell-like sound
    const bell2 = _audioCtx.createOscillator();
    const bell2Gain = _audioCtx.createGain();
    bell.frequency.setValueAtTime(vrand(1800, 2000), now + 0.04);
    bell2.frequency.setValueAtTime(vrand(2600, 2900), now + 0.04);
    bellGain.gain.setValueAtTime(0.0001, now + 0.04);
    bellGain.gain.exponentialRampToValueAtTime(0.03, now + 0.06);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    bell2Gain.gain.setValueAtTime(0.0001, now + 0.04);
    bell2Gain.gain.exponentialRampToValueAtTime(0.018, now + 0.065);
    bell2Gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    bell.connect(bellGain);
    bell2.connect(bell2Gain);
    bellGain.connect(mix);
    bell2Gain.connect(mix);
    bell.start(now + 0.04);
    bell2.start(now + 0.04);
    bell.stop(now + 0.26);
    bell2.stop(now + 0.26);

    // 4) Tiny ratchet ticks
    const ticks = _audioCtx.createBufferSource();
    ticks.buffer = noiseBuf;
    const ticksHP = _audioCtx.createBiquadFilter();
    ticksHP.type = 'highpass';
    ticksHP.frequency.setValueAtTime(2500, now);
    const ticksGain = _audioCtx.createGain();
    ticksGain.gain.setValueAtTime(0.0001, now);
    ticksGain.gain.exponentialRampToValueAtTime(0.02, now + 0.03);
    ticksGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    ticks.connect(ticksHP);
    ticksHP.connect(ticksGain);
    ticksGain.connect(mix);
    ticks.start(now + 0.02);
    ticks.stop(now + 0.14);
  } catch {}
}

const StudioButton = React.forwardRef<HTMLButtonElement, StudioButtonProps>(({ title, description, height, width, descriptionLeftShift, active = false, onClick }, ref) => {
  const handleClick = () => {
    playCarriageReturn();
    onClick?.();
  };
  return (
    <button
      data-purpose="studio-button"
      data-persona-target={title.split(' ')[0].toLowerCase()}
      ref={ref}
  onMouseEnter={playHoverSound}
  onClick={handleClick}
      aria-pressed={active}
      className={
        "group rounded-lg border-2 border-[#e0c87a] bg-[#0a0c0e]/100 px-4 py-1.5 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#e0c87a] focus:ring-offset-2 focus:ring-offset-black flex flex-col justify-center overflow-hidden " +
        (active
          ? "shadow-[0_0_20px_rgba(224,200,122,0.35)]"
          : "hover:shadow-[0_0_20px_rgba(224,200,122,0.35)]")
      }
      style={{ ...(height ? { height } : {}), ...(width ? { width } : {}) }}
    >
      {/* Title */}
      <h3 className="w-full text-center text-sm tracking-widest text-[#e0c87a] group-hover:text-amber-200 uppercase leading-tight whitespace-nowrap">
        {title}
      </h3>
      {/* Description */}
      <p className={(descriptionLeftShift ? "w-full text-left -ml-2" : "w-full text-center") + " mt-0.5 text-xs text-stone-400 group-hover:text-stone-300 italic leading-tight whitespace-nowrap"}>
        {description.replace(/\band\b/gi, '&')}
      </p>
    </button>
  );
});

export default StudioButton;