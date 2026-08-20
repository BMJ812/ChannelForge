import type {
  ShadowReadDiagnosticSink,
  ShadowReadFinding,
} from './ShadowReadFramework.js';

export type ShadowReadDiagnosticsSnapshot = Readonly<{
  capacity: number;
  totalRecorded: number;
  findings: readonly ShadowReadFinding[];
}>;

export class ShadowReadDiagnostics implements ShadowReadDiagnosticSink {
  private readonly findings: ShadowReadFinding[] = [];
  private totalRecorded = 0;

  constructor(readonly capacity = 100) {
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10_000) {
      throw new RangeError(
        'Shadow diagnostics capacity must be an integer between 1 and 10000',
      );
    }
  }

  record(finding: ShadowReadFinding): void {
    this.totalRecorded += 1;

    this.findings.push(finding);

    const overflow = this.findings.length - this.capacity;

    if (overflow > 0) {
      this.findings.splice(0, overflow);
    }
  }

  snapshot(): ShadowReadDiagnosticsSnapshot {
    return Object.freeze({
      capacity: this.capacity,
      totalRecorded: this.totalRecorded,
      findings: Object.freeze([...this.findings]),
    });
  }
}
