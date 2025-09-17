import type { PersonaProfile, TaskManifest } from '../shared/contracts';

type PersonaState = {
  userProfile?: PersonaProfile;
  taskManifest?: TaskManifest;
};

const state: PersonaState = {
  userProfile: undefined,
  taskManifest: undefined,
};

const listeners = new Set<() => void>();

export function setPersona(p?: PersonaProfile) {
  state.userProfile = p;
  listeners.forEach((fn) => fn());
}

export function setTask(t?: TaskManifest) {
  state.taskManifest = t;
  listeners.forEach((fn) => fn());
}

export function getPersona() {
  return state.userProfile;
}

export function getTask() {
  return state.taskManifest;
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
