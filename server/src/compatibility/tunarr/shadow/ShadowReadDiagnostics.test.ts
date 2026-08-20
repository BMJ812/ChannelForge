import { describe, expect, it } from 'vitest';

import { ShadowReadDiagnostics } from './ShadowReadDiagnostics.js';

import type { ShadowReadFinding } from './ShadowReadFramework.js';

function finding(operation: string): ShadowReadFinding {
  return Object.freeze({
    concept: 'diagnostic-proof',

    authority: 'CANONICAL',

    legacyChecksum: 'a'.repeat(64),

    canonicalChecksum: 'b'.repeat(64),

    differenceClass: 'VALUE_MISMATCH',

    operation,

    timestamp: '2026-08-19T10:40:00.000Z',

    severity: 'ERROR',
  });
}

describe('ShadowReadDiagnostics', () => {
  it('retains a bounded newest-first window without changing total evidence count', () => {
    const diagnostics = new ShadowReadDiagnostics(2);

    diagnostics.record(finding('first'));

    diagnostics.record(finding('second'));

    diagnostics.record(finding('third'));

    const snapshot = diagnostics.snapshot();

    expect(snapshot.capacity).toBe(2);

    expect(snapshot.totalRecorded).toBe(3);

    expect(snapshot.findings.map((entry) => entry.operation)).toEqual([
      'second',
      'third',
    ]);
  });

  it('rejects unbounded diagnostic capacities', () => {
    expect(() => new ShadowReadDiagnostics(0)).toThrow();

    expect(() => new ShadowReadDiagnostics(10_001)).toThrow();
  });
});
