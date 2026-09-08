import { loadSemesterConfig, saveSemesterConfig } from '../storage';
import { pushSemesterConfig } from '../sync/semester-sync';
import { SemesterConfig } from '../types';

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export async function loadSemester(): Promise<SemesterConfig | null> {
  return loadSemesterConfig();
}

export async function saveSemester(config: SemesterConfig): Promise<void> {
  await saveSemesterConfig(config);
  notify();
  // Fire-and-forget push: a network failure (or missing token) must not fail
  // the local save. Semester config is small and LWW, so the next save wins.
  void pushSemesterConfig(config).catch((error) => {
    console.warn('Semester config push failed', error);
  });
}

export function subscribeToSemester(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetSemesterState(): void {
  notify();
}
