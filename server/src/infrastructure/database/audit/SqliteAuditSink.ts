import type Database from 'better-sqlite3';

import { AuditRecordId } from './AuditRecordId.js';

export type AuditOutcome = 'SUCCESS' | 'FAILURE';

export type AuditRecord = Readonly<{
  auditRecordId: AuditRecordId;
  occurredAt: string;
  actorType: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  outcome: AuditOutcome;
  migrationRunId?: string;
  correlationId?: string;
  requestId?: string;
  details: Readonly<Record<string, unknown>>;
}>;

export type AppendAuditRecordRequest = Readonly<{
  actorType: string;
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  outcome: AuditOutcome;
  migrationRunId?: string;
  correlationId?: string;
  requestId?: string;
  details?: Readonly<Record<string, unknown>>;
  now?: () => Date;
}>;

function requireNonEmpty(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

export class SqliteAuditSink {
  constructor(private readonly database: Database.Database) {}

  append(request: AppendAuditRecordRequest): AuditRecord {
    const occurredAt = (request.now ?? (() => new Date()))().toISOString();

    const record: AuditRecord = Object.freeze({
      auditRecordId: AuditRecordId.generate(),

      occurredAt,

      actorType: requireNonEmpty('actorType', request.actorType),

      ...(request.actorId === undefined
        ? {}
        : {
            actorId: request.actorId,
          }),

      action: requireNonEmpty('action', request.action),

      targetType: requireNonEmpty('targetType', request.targetType),

      ...(request.targetId === undefined
        ? {}
        : {
            targetId: request.targetId,
          }),

      outcome: request.outcome,

      ...(request.migrationRunId === undefined
        ? {}
        : {
            migrationRunId: request.migrationRunId,
          }),

      ...(request.correlationId === undefined
        ? {}
        : {
            correlationId: request.correlationId,
          }),

      ...(request.requestId === undefined
        ? {}
        : {
            requestId: request.requestId,
          }),

      details: Object.freeze({
        ...(request.details ?? {}),
      }),
    });

    this.database
      .prepare(
        `
          INSERT INTO cf_audit_record (
            audit_record_id,
            occurred_at,
            actor_type,
            actor_id,
            action,
            target_type,
            target_id,
            outcome,
            migration_run_id,
            correlation_id,
            request_id,
            details_json
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
          )
        `,
      )
      .run(
        record.auditRecordId,
        record.occurredAt,
        record.actorType,
        record.actorId ?? null,
        record.action,
        record.targetType,
        record.targetId ?? null,
        record.outcome,
        record.migrationRunId ?? null,
        record.correlationId ?? null,
        record.requestId ?? null,
        JSON.stringify(record.details),
      );

    return record;
  }
}
