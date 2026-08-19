import type Database from 'better-sqlite3';

export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type IdempotencyRecord = Readonly<{
  scope: string;
  actorId: string;
  idempotencyKey: string;
  requestHash: string;
  status: IdempotencyStatus;
  resultReference?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
  errorSummary?: string;
}>;

export type BeginIdempotentOperationRequest = Readonly<{
  scope: string;
  actorId?: string;
  idempotencyKey: string;
  requestHash: string;
  expiresAt?: string;
  now?: () => Date;
}>;

export type BeginIdempotentOperationResult =
  | Readonly<{
      kind: 'STARTED';
      record: IdempotencyRecord;
    }>
  | Readonly<{
      kind: 'REPLAY';
      record: IdempotencyRecord;
    }>;

export class IdempotencyConflictError extends Error {
  constructor(
    readonly existingRequestHash: string,
    readonly incomingRequestHash: string,
  ) {
    super('Idempotency key was reused with a different request hash');

    this.name = 'IdempotencyConflictError';
  }
}

export class IdempotencyRecordNotFoundError extends Error {
  constructor() {
    super('Idempotency record does not exist');

    this.name = 'IdempotencyRecordNotFoundError';
  }
}

export class IdempotencyStateError extends Error {
  constructor(readonly status: IdempotencyStatus) {
    super(`Idempotency record cannot transition from ${status}`);

    this.name = 'IdempotencyStateError';
  }
}

type IdempotencyRecordRow = Readonly<{
  scope: string;
  actor_id: string;
  idempotency_key: string;
  request_hash: string;
  status: IdempotencyStatus;
  result_reference: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
  error_summary: string | null;
}>;

function requireNonEmpty(label: string, value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new RangeError(`${label} must not be empty`);
  }

  return normalized;
}

function requireSha256(value: string): string {
  const normalized = value.toLowerCase();

  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new RangeError('requestHash must be a lowercase SHA-256 hex digest');
  }

  return normalized;
}

function mapRow(row: IdempotencyRecordRow): IdempotencyRecord {
  return Object.freeze({
    scope: row.scope,

    actorId: row.actor_id,

    idempotencyKey: row.idempotency_key,

    requestHash: row.request_hash,

    status: row.status,

    ...(row.result_reference === null
      ? {}
      : {
          resultReference: row.result_reference,
        }),

    createdAt: row.created_at,

    ...(row.completed_at === null
      ? {}
      : {
          completedAt: row.completed_at,
        }),

    ...(row.expires_at === null
      ? {}
      : {
          expiresAt: row.expires_at,
        }),

    ...(row.error_summary === null
      ? {}
      : {
          errorSummary: row.error_summary,
        }),
  });
}

export class SqliteIdempotencyStore {
  constructor(private readonly database: Database.Database) {}

  begin(
    request: BeginIdempotentOperationRequest,
  ): BeginIdempotentOperationResult {
    const scope = requireNonEmpty('scope', request.scope);

    const actorId = request.actorId ?? '';

    const idempotencyKey = requireNonEmpty(
      'idempotencyKey',
      request.idempotencyKey,
    );

    const requestHash = requireSha256(request.requestHash);

    const existing = this.get(scope, actorId, idempotencyKey);

    if (existing !== undefined) {
      if (existing.requestHash !== requestHash) {
        throw new IdempotencyConflictError(existing.requestHash, requestHash);
      }

      return Object.freeze({
        kind: 'REPLAY',
        record: existing,
      });
    }

    const createdAt = (request.now ?? (() => new Date()))().toISOString();

    this.database
      .prepare(
        `
          INSERT INTO cf_idempotency_record (
            scope,
            actor_id,
            idempotency_key,
            request_hash,
            status,
            result_reference,
            created_at,
            completed_at,
            expires_at,
            error_summary
          )
          VALUES (
            ?,
            ?,
            ?,
            ?,
            'IN_PROGRESS',
            NULL,
            ?,
            NULL,
            ?,
            NULL
          )
        `,
      )
      .run(
        scope,
        actorId,
        idempotencyKey,
        requestHash,
        createdAt,
        request.expiresAt ?? null,
      );

    const record = this.get(scope, actorId, idempotencyKey);

    if (record === undefined) {
      throw new Error('Idempotency record disappeared after creation');
    }

    return Object.freeze({
      kind: 'STARTED',
      record,
    });
  }

  complete(
    scope: string,
    actorId: string | undefined,
    idempotencyKey: string,
    resultReference: string,
    now: () => Date = () => new Date(),
  ): IdempotencyRecord {
    return this.finish(
      scope,
      actorId ?? '',
      idempotencyKey,
      'COMPLETED',
      resultReference,
      undefined,
      now,
    );
  }

  fail(
    scope: string,
    actorId: string | undefined,
    idempotencyKey: string,
    errorSummary: string,
    now: () => Date = () => new Date(),
  ): IdempotencyRecord {
    return this.finish(
      scope,
      actorId ?? '',
      idempotencyKey,
      'FAILED',
      undefined,
      errorSummary.slice(0, 2_048),
      now,
    );
  }

  get(
    scope: string,
    actorId: string,
    idempotencyKey: string,
  ): IdempotencyRecord | undefined {
    const row = this.database
      .prepare(
        `
            SELECT
              scope,
              actor_id,
              idempotency_key,
              request_hash,
              status,
              result_reference,
              created_at,
              completed_at,
              expires_at,
              error_summary
            FROM cf_idempotency_record
            WHERE
              scope = ?
              AND actor_id = ?
              AND idempotency_key = ?
          `,
      )
      .get(scope, actorId, idempotencyKey) as IdempotencyRecordRow | undefined;

    return row === undefined ? undefined : mapRow(row);
  }

  private finish(
    scope: string,
    actorId: string,
    idempotencyKey: string,
    status: 'COMPLETED' | 'FAILED',
    resultReference: string | undefined,
    errorSummary: string | undefined,
    now: () => Date,
  ): IdempotencyRecord {
    const existing = this.get(scope, actorId, idempotencyKey);

    if (existing === undefined) {
      throw new IdempotencyRecordNotFoundError();
    }

    if (existing.status !== 'IN_PROGRESS') {
      throw new IdempotencyStateError(existing.status);
    }

    const completedAt = now().toISOString();

    const result = this.database
      .prepare(
        `
            UPDATE cf_idempotency_record
            SET
              status = ?,
              result_reference = ?,
              completed_at = ?,
              error_summary = ?
            WHERE
              scope = ?
              AND actor_id = ?
              AND idempotency_key = ?
              AND status =
                'IN_PROGRESS'
          `,
      )
      .run(
        status,
        resultReference ?? null,
        completedAt,
        errorSummary ?? null,
        scope,
        actorId,
        idempotencyKey,
      );

    if (result.changes !== 1) {
      const current = this.get(scope, actorId, idempotencyKey);

      throw new IdempotencyStateError(current?.status ?? existing.status);
    }

    const updated = this.get(scope, actorId, idempotencyKey);

    if (updated === undefined) {
      throw new Error('Idempotency record disappeared after transition');
    }

    return updated;
  }
}
