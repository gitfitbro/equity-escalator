export interface FormatterConfig {
  prefix: string;
  padLength: number;
  resetDaily: boolean;
}

interface FormatterState {
  counter: number;
  lastDate: string;
}

const states = new Map<string, FormatterState>();

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getState(key: string): FormatterState {
  if (!states.has(key)) {
    states.set(key, { counter: 0, lastDate: todayKey() });
  }
  return states.get(key)!;
}

/**
 * Challenge 5: Deterministic padded reference numbers with reset rules.
 * Production analog: check/ACH/VCC sequencing at Capital Rx.
 */
export function nextReference(config: FormatterConfig): string {
  const stateKey = config.prefix;
  const state = getState(stateKey);
  const today = todayKey();

  if (config.resetDaily && state.lastDate !== today) {
    state.counter = 0;
    state.lastDate = today;
  }

  state.counter += 1;

  const padded = String(state.counter).padStart(config.padLength, '0');
  return `${config.prefix}-${padded}`;
}

/** Reset state — for testing only */
export function resetFormatterState(): void {
  states.clear();
}