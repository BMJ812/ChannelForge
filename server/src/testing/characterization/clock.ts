export type TestInstant = Date | number | string;

export interface ManualTestClock {
  now(): Date;
  nowMs(): number;
  set(instant: TestInstant): void;
  advance(milliseconds: number): void;
  snapshot(): string;
}

function toEpochMilliseconds(instant: TestInstant): number {
  const milliseconds =
    instant instanceof Date
      ? instant.getTime()
      : typeof instant === 'string'
        ? Date.parse(instant)
        : instant;

  if (!Number.isFinite(milliseconds)) {
    throw new TypeError(`Invalid test instant: ${String(instant)}`);
  }

  return milliseconds;
}

function assertMilliseconds(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Milliseconds must be a safe integer: ${value}`);
  }
}

/**
 * Creates a test-owned clock without modifying the process-wide clock.
 *
 * Production code can accept this object through a clock-shaped boundary while
 * unrelated tests remain independent of fake-timer state.
 */
export function createManualTestClock(
  initialInstant: TestInstant,
): ManualTestClock {
  let currentMilliseconds = toEpochMilliseconds(initialInstant);

  return {
    now() {
      return new Date(currentMilliseconds);
    },

    nowMs() {
      return currentMilliseconds;
    },

    set(instant) {
      currentMilliseconds = toEpochMilliseconds(instant);
    },

    advance(milliseconds) {
      assertMilliseconds(milliseconds);
      currentMilliseconds += milliseconds;
    },

    snapshot() {
      return new Date(currentMilliseconds).toISOString();
    },
  };
}
