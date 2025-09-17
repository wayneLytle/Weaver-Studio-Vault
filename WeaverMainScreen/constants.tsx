
import React from 'react';
import type { Studio } from './types';

export const STUDIO_BUTTONS: Studio[] = [
  {
    id: 'tale-weaver',
    title: 'TALE WEAVER STUDIO',
    description: 'Craft writings tailored to your genre, voice, and vision',
  },
  {
    id: 'ink-weaver',
    title: 'INK WEAVER STUDIO',
    description: 'Sketch and design your masterpieces',
  },
  {
    id: 'scene-weaver',
    title: 'SCENE WEAVER STUDIO',
    description: 'Edit and design your cinematic masterpieces',
  },
  {
    id: 'code-weaver',
    title: 'CODE WEAVER STUDIO',
    description: 'Write code with logic, syntax, and modular architecture',
  },
  {
    id: 'battle-bot',
    title: 'BATTLE BOT STUDIO',
    description: 'Unleash a battle royale of intelligence',
  },
  {
    id: 'audio-weaver',
    title: 'AUDIO WEAVER STUDIO',
    description: 'Compose or edit music or audio files',
  },
];

export const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 1 0-1.06 1.06l1.72 1.72H8.25a.75.75 0 0 0 0 1.5h5.69l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3Z" clipRule="evenodd" />
    </svg>
);


export const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
    </svg>
);

export const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2a6 6 0 0 0-6 6v2.586l-1.293 1.293A1 1 0 0 0 5 14h14a1 1 0 0 0 .707-1.707L18.414 10.586V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22z" />
  </svg>
);

export const BellOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M3.707 2.293a1 1 0 1 0-1.414 1.414l18 18a1 1 0 0 0 1.414-1.414l-2.842-2.842A1.997 1.997 0 0 0 19 17h-1V8a6 6 0 0 0-8.828-5.314l-1.465-1.465zM7 17H5a1 1 0 0 0-.707 1.707L5.586 20h12.828L7 8.586V17zm5 5a3 3 0 0 0 2.995-2.824L15 19H9a3 3 0 0 0 2.824 2.995L12 22z" />
  </svg>
);
