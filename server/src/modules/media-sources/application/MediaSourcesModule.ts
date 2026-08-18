import type {
  MediaSourceSynchronizationPort,
  MediaSourceSynchronizationRequest,
} from '../ports/MediaSourceSynchronization.js';

export interface MediaSourcesCommandService {
  requestSynchronization(
    request: MediaSourceSynchronizationRequest,
  ): Promise<boolean>;
}

export type MediaSourcesModuleDependencies = Readonly<{
  synchronization: MediaSourceSynchronizationPort;
}>;

export type MediaSourcesModule = Readonly<{
  commands: MediaSourcesCommandService;
}>;

class DefaultMediaSourcesCommandService implements MediaSourcesCommandService {
  constructor(
    private readonly synchronization: MediaSourceSynchronizationPort,
  ) {}

  requestSynchronization(
    request: MediaSourceSynchronizationRequest,
  ): Promise<boolean> {
    return this.synchronization.requestSynchronization(request);
  }
}

export function createMediaSourcesModule(
  dependencies: MediaSourcesModuleDependencies,
): MediaSourcesModule {
  return Object.freeze({
    commands: new DefaultMediaSourcesCommandService(
      dependencies.synchronization,
    ),
  });
}
