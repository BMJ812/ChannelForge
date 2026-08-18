import type { InstanceIdentity } from '../domain/InstanceIdentity.js';
import type { InstanceIdentityReader } from '../ports/InstanceIdentityReader.js';

export interface InstanceQueryService {
  getInstanceIdentity(): InstanceIdentity;
}

export type InstanceModuleDependencies = Readonly<{
  identityReader: InstanceIdentityReader;
}>;

export type InstanceModule = Readonly<{
  queries: InstanceQueryService;
}>;

class DefaultInstanceQueryService implements InstanceQueryService {
  constructor(private readonly identityReader: InstanceIdentityReader) {}

  getInstanceIdentity(): InstanceIdentity {
    return this.identityReader.readInstanceIdentity();
  }
}

export function createInstanceModule(
  dependencies: InstanceModuleDependencies,
): InstanceModule {
  const queries: InstanceQueryService = new DefaultInstanceQueryService(
    dependencies.identityReader,
  );

  return Object.freeze({
    queries,
  });
}
