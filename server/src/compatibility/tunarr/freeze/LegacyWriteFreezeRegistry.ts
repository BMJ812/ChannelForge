export const LegacyWriteFreezeStates = ['ACTIVE', 'FROZEN'] as const;
export type LegacyWriteFreezeState = (typeof LegacyWriteFreezeStates)[number];

export const LegacyWritePathIds = [
  'legacy-management-routes',
  'legacy-jobs',
  'legacy-direct-database-writers',
  'legacy-schedule-writers',
  'legacy-provider-sync-writers',
  'legacy-output-generators',
  'legacy-settings-writers',
  'legacy-cleanup-jobs',
] as const;

export type LegacyWritePathId = (typeof LegacyWritePathIds)[number];

export type LegacyWriteFreezeEntry = Readonly<{
  writePath: LegacyWritePathId;
  concept: string;
  enforcementPoint: string;
  replacement?: string;
  validation: string;
  rollback: string;
  state: LegacyWriteFreezeState;
}>;

export const LegacyWriteFreezeRegistryErrorReasons = [
  'INVALID_ENTRY',
  'DUPLICATE_WRITE_PATH',
  'UNKNOWN_WRITE_PATH',
] as const;

export type LegacyWriteFreezeRegistryErrorReason =
  (typeof LegacyWriteFreezeRegistryErrorReasons)[number];

export class LegacyWriteFreezeRegistryError extends Error {
  constructor(
    readonly reason: LegacyWriteFreezeRegistryErrorReason,
    readonly writePath?: string,
  ) {
    super(writePath === undefined ? reason : `${reason}: ${writePath}`);
    this.name = 'LegacyWriteFreezeRegistryError';
  }
}

function createEntry(input: LegacyWriteFreezeEntry): LegacyWriteFreezeEntry {
  for (const value of [
    input.writePath,
    input.concept,
    input.enforcementPoint,
    input.validation,
    input.rollback,
  ]) {
    if (value.trim().length === 0) {
      throw new LegacyWriteFreezeRegistryError(
        'INVALID_ENTRY',
        input.writePath,
      );
    }
  }

  if (!(LegacyWritePathIds as readonly string[]).includes(input.writePath)) {
    throw new LegacyWriteFreezeRegistryError('INVALID_ENTRY', input.writePath);
  }

  if (!(LegacyWriteFreezeStates as readonly string[]).includes(input.state)) {
    throw new LegacyWriteFreezeRegistryError('INVALID_ENTRY', input.writePath);
  }

  return Object.freeze({ ...input });
}

const active = (
  writePath: LegacyWritePathId,
  concept: string,
  enforcementPoint: string,
  replacement: string | undefined,
  validation: string,
  rollback: string,
): LegacyWriteFreezeEntry =>
  createEntry({
    writePath,
    concept,
    enforcementPoint,
    ...(replacement === undefined ? {} : { replacement }),
    validation,
    rollback,
    state: 'ACTIVE',
  });

export const TunarrLegacyWriteFreezeEntries: readonly LegacyWriteFreezeEntry[] =
  Object.freeze([
    active(
      'legacy-management-routes',
      'legacy-management',
      'server-side route mutation boundary',
      undefined,
      'replacement route/command verified before freeze',
      'restore route write permission',
    ),
    active(
      'legacy-jobs',
      'background-jobs',
      'compatibility legacy-job execution boundary',
      'ChannelForge compatibility job handler',
      'replacement handler verified and legacy write usage measured',
      'restore job execution permission',
    ),
    active(
      'legacy-direct-database-writers',
      'persistence',
      'legacy persistence mutation boundary',
      undefined,
      'canonical repository path verified',
      'restore direct legacy writer permission',
    ),
    active(
      'legacy-schedule-writers',
      'scheduling',
      'legacy schedule mutation boundary',
      'ChannelForge approved schedule plan path',
      'canonical schedule authority and output verified',
      'restore legacy schedule writer permission',
    ),
    active(
      'legacy-provider-sync-writers',
      'media-sources',
      'legacy provider synchronization mutation boundary',
      undefined,
      'provider compatibility replacement verified',
      'restore provider sync writer permission',
    ),
    active(
      'legacy-output-generators',
      'output',
      'legacy generated-artifact mutation boundary',
      'ChannelForge output artifact path',
      'canonical and last-valid output verified',
      'restore legacy output generator permission',
    ),
    active(
      'legacy-settings-writers',
      'settings',
      'legacy settings mutation boundary',
      undefined,
      'replacement settings command verified',
      'restore legacy settings writer permission',
    ),
    active(
      'legacy-cleanup-jobs',
      'cleanup',
      'legacy cleanup mutation boundary',
      undefined,
      'cleanup ownership and retention behavior verified',
      'restore legacy cleanup writer permission',
    ),
  ]);

export class LegacyWriteFreezeRegistry {
  private readonly byWritePath = new Map<
    LegacyWritePathId,
    LegacyWriteFreezeEntry
  >();
  private readonly snapshot: readonly LegacyWriteFreezeEntry[];

  constructor(
    entries: readonly LegacyWriteFreezeEntry[] = TunarrLegacyWriteFreezeEntries,
  ) {
    const snapshot: LegacyWriteFreezeEntry[] = [];

    for (const raw of entries) {
      const entry = createEntry(raw);
      if (this.byWritePath.has(entry.writePath)) {
        throw new LegacyWriteFreezeRegistryError(
          'DUPLICATE_WRITE_PATH',
          entry.writePath,
        );
      }
      this.byWritePath.set(entry.writePath, entry);
      snapshot.push(entry);
    }

    this.snapshot = Object.freeze(snapshot);
  }

  get(writePath: LegacyWritePathId): LegacyWriteFreezeEntry | undefined {
    return this.byWritePath.get(writePath);
  }

  require(writePath: LegacyWritePathId): LegacyWriteFreezeEntry {
    const entry = this.get(writePath);
    if (entry === undefined) {
      throw new LegacyWriteFreezeRegistryError('UNKNOWN_WRITE_PATH', writePath);
    }
    return entry;
  }

  getAll(): readonly LegacyWriteFreezeEntry[] {
    return this.snapshot;
  }

  getFrozen(): readonly LegacyWriteFreezeEntry[] {
    return Object.freeze(
      this.snapshot.filter((entry) => entry.state === 'FROZEN'),
    );
  }
}

export const tunarrLegacyWriteFreezeRegistry = new LegacyWriteFreezeRegistry();
