export const LegacyJobClassifications = [
  'READ_ONLY',
  'LEGACY_WRITE',
  'COMPATIBILITY_PROJECTION',
  'PROVIDER_SYNCHRONIZATION',
  'SCHEDULE_GENERATION',
  'ARTIFACT_GENERATION',
  'CLEANUP',
  'BACKUP',
  'UNKNOWN',
] as const;

export type LegacyJobClassification = (typeof LegacyJobClassifications)[number];

export const LegacyJobTriggerKinds = [
  'STARTUP',
  'SCHEDULED',
  'DYNAMIC',
] as const;

export type LegacyJobTriggerKind = (typeof LegacyJobTriggerKinds)[number];

export type LegacyJobDescriptor = Readonly<{
  id: string;
  sourcePath: string;
  sourceSymbol: string;
  classifications: readonly LegacyJobClassification[];
  triggers: readonly LegacyJobTriggerKind[];
  hidden: boolean;
}>;

export const LegacyJobRegistryErrorReasons = [
  'INVALID_DESCRIPTOR',
  'DUPLICATE_JOB_ID',
  'DUPLICATE_SOURCE',
  'UNKNOWN_JOB',
] as const;

export type LegacyJobRegistryErrorReason =
  (typeof LegacyJobRegistryErrorReasons)[number];

export class LegacyJobRegistryError extends Error {
  constructor(
    readonly reason: LegacyJobRegistryErrorReason,
    readonly jobId?: string,
  ) {
    super(jobId === undefined ? reason : `${reason}: ${jobId}`);
    this.name = 'LegacyJobRegistryError';
  }
}

function makeJob(input: LegacyJobDescriptor): LegacyJobDescriptor {
  const classifications = Object.freeze([...new Set(input.classifications)]);
  const triggers = Object.freeze([...new Set(input.triggers)]);

  if (
    input.id.trim().length === 0 ||
    input.sourceSymbol.trim().length === 0 ||
    !input.sourcePath.startsWith('server/src/') ||
    classifications.length === 0 ||
    triggers.length === 0
  ) {
    throw new LegacyJobRegistryError('INVALID_DESCRIPTOR', input.id);
  }

  if (
    classifications.some(
      (value) =>
        !(LegacyJobClassifications as readonly string[]).includes(value),
    ) ||
    triggers.some(
      (value) => !(LegacyJobTriggerKinds as readonly string[]).includes(value),
    )
  ) {
    throw new LegacyJobRegistryError('INVALID_DESCRIPTOR', input.id);
  }

  return Object.freeze({ ...input, classifications, triggers });
}

const j = (
  id: string,
  sourcePath: string,
  classifications: readonly LegacyJobClassification[],
  triggers: readonly LegacyJobTriggerKind[],
  hidden = false,
  sourceSymbol = id,
): LegacyJobDescriptor =>
  makeJob({
    id,
    sourcePath,
    sourceSymbol,
    classifications,
    triggers,
    hidden,
  });

export const TunarrLegacyJobs: readonly LegacyJobDescriptor[] = Object.freeze([
  j('BackupTask', 'server/src/tasks/BackupTask.ts', ['BACKUP'], ['SCHEDULED']),
  j(
    'CleanupSessionsTask',
    'server/src/tasks/CleanupSessionsTask.ts',
    ['CLEANUP', 'LEGACY_WRITE'],
    ['SCHEDULED'],
  ),
  j(
    'ClearM3uCacheTask',
    'server/src/tasks/ClearM3uCacheTask.ts',
    ['CLEANUP'],
    ['DYNAMIC'],
  ),
  j(
    'OnDemandChannelStateTask',
    'server/src/tasks/OnDemandChannelStateTask.ts',
    ['LEGACY_WRITE'],
    ['SCHEDULED', 'STARTUP'],
  ),
  j(
    'ReconcileProgramDurationsTask',
    'server/src/tasks/ReconcileProgramDurationsTask.ts',
    ['LEGACY_WRITE'],
    ['DYNAMIC'],
    true,
  ),
  j(
    'RefreshMediaSourceLibraryTask',
    'server/src/tasks/RefreshMediaSourceLibraryTask.ts',
    ['PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['SCHEDULED', 'STARTUP'],
  ),
  j(
    'RemoveDanglingProgramsFromSearchTask',
    'server/src/tasks/RemoveDanglingProgramsFromSearchTask.ts',
    ['CLEANUP', 'LEGACY_WRITE'],
    ['DYNAMIC'],
  ),
  j(
    'RollLogFileTask',
    'server/src/tasks/RollLogFileTask.ts',
    ['CLEANUP'],
    ['DYNAMIC'],
  ),
  j(
    'ScanLibrariesTask',
    'server/src/tasks/ScanLibrariesTask.ts',
    ['PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['SCHEDULED'],
  ),
  j(
    'SubtitleExtractorTask',
    'server/src/tasks/SubtitleExtractorTask.ts',
    ['ARTIFACT_GENERATION'],
    ['SCHEDULED', 'STARTUP'],
  ),
  j(
    'SyncCollectionsTask',
    'server/src/tasks/SyncCollectionsTask.ts',
    ['PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['SCHEDULED'],
  ),
  j(
    'SyncCustomShowsTask',
    'server/src/tasks/SyncCustomShowsTask.ts',
    ['PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['SCHEDULED'],
  ),
  j(
    'UpdateXmlTvTask',
    'server/src/tasks/UpdateXmlTvTask.ts',
    ['ARTIFACT_GENERATION', 'PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['SCHEDULED', 'STARTUP'],
  ),
  j(
    'UpdatePlexPlayStatusScheduledTask',
    'server/src/tasks/plex/UpdatePlexPlayStatusTask.ts',
    ['PROVIDER_SYNCHRONIZATION'],
    ['DYNAMIC', 'SCHEDULED'],
    true,
  ),
  j(
    'UpdatePlexPlayStatusTask',
    'server/src/tasks/plex/UpdatePlexPlayStatusTask.ts',
    ['PROVIDER_SYNCHRONIZATION'],
    ['DYNAMIC'],
    true,
  ),
  j(
    'UpdateJellyfinPlayStatusScheduledTask',
    'server/src/tasks/jellyfin/UpdateJellyfinPlayStatusTask.ts',
    ['PROVIDER_SYNCHRONIZATION'],
    ['DYNAMIC', 'SCHEDULED'],
    true,
  ),
  j(
    'UpdateJellyfinPlayStatusTask',
    'server/src/tasks/jellyfin/UpdateJellyfinPlayStatusTask.ts',
    ['PROVIDER_SYNCHRONIZATION'],
    ['DYNAMIC'],
    true,
  ),
  j(
    'ChannelLineupMigratorStartupTask',
    'server/src/services/startup/ChannelLineupMigratorStartupTask.ts',
    ['LEGACY_WRITE'],
    ['STARTUP'],
  ),
  j(
    'ClearM3uCacheStartupTask',
    'server/src/services/startup/ClearM3uCacheStartupTask.ts',
    ['CLEANUP'],
    ['STARTUP'],
  ),
  j(
    'GenerateGuideStartupTask',
    'server/src/services/startup/GenerateGuideStartupTask.ts',
    ['ARTIFACT_GENERATION'],
    ['STARTUP'],
  ),
  j(
    'RefreshLibrariesStartupTask',
    'server/src/services/startup/RefreshLibrariesStartupTask.ts',
    ['PROVIDER_SYNCHRONIZATION', 'LEGACY_WRITE'],
    ['STARTUP'],
  ),
  j(
    'ScheduleJobsStartupTask',
    'server/src/services/startup/ScheduleJobsStartupTask.ts',
    ['READ_ONLY'],
    ['STARTUP'],
  ),
  j(
    'SeedFfmpegInfoCache',
    'server/src/services/startup/SeedFfmpegInfoCache.ts',
    ['READ_ONLY'],
    ['STARTUP'],
  ),
  j(
    'SeedSystemDevicesStartupTask',
    'server/src/services/startup/SeedSystemDevicesStartupTask.ts',
    ['LEGACY_WRITE'],
    ['STARTUP'],
  ),
  j(
    'FixerRunner',
    'server/src/tasks/fixers/FixerRunner.ts',
    ['LEGACY_WRITE'],
    ['STARTUP'],
  ),
]);

const sourceKey = (job: LegacyJobDescriptor) =>
  `${job.sourcePath}#${job.sourceSymbol}`;

export class LegacyJobRegistry {
  private readonly byId = new Map<string, LegacyJobDescriptor>();
  private readonly snapshot: readonly LegacyJobDescriptor[];

  constructor(entries: readonly LegacyJobDescriptor[] = TunarrLegacyJobs) {
    const seenSources = new Set<string>();
    const snapshot: LegacyJobDescriptor[] = [];

    for (const raw of entries) {
      const entry = makeJob(raw);
      if (this.byId.has(entry.id)) {
        throw new LegacyJobRegistryError('DUPLICATE_JOB_ID', entry.id);
      }

      const source = sourceKey(entry);
      if (seenSources.has(source)) {
        throw new LegacyJobRegistryError('DUPLICATE_SOURCE', entry.id);
      }

      this.byId.set(entry.id, entry);
      seenSources.add(source);
      snapshot.push(entry);
    }

    this.snapshot = Object.freeze(snapshot);
  }

  get(jobId: string): LegacyJobDescriptor | undefined {
    return this.byId.get(jobId);
  }

  require(jobId: string): LegacyJobDescriptor {
    const entry = this.get(jobId);
    if (entry === undefined) {
      throw new LegacyJobRegistryError('UNKNOWN_JOB', jobId);
    }
    return entry;
  }

  getAll(): readonly LegacyJobDescriptor[] {
    return this.snapshot;
  }

  byClassification(
    classification: LegacyJobClassification,
  ): readonly LegacyJobDescriptor[] {
    return Object.freeze(
      this.snapshot.filter((job) =>
        job.classifications.includes(classification),
      ),
    );
  }

  byTrigger(trigger: LegacyJobTriggerKind): readonly LegacyJobDescriptor[] {
    return Object.freeze(
      this.snapshot.filter((job) => job.triggers.includes(trigger)),
    );
  }
}

export const tunarrLegacyJobRegistry = new LegacyJobRegistry();
