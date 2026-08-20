import {
  createMediaSourceScanPolicy,
  type MediaSourceScanPolicy,
  type MediaSourceScanPolicyInput,
} from '../domain/MediaSourceScanPolicy.js';
import type { MediaSourceScanPolicyStore } from '../ports/MediaSourceScanPolicyStore.js';

export interface MediaSourceScanPolicyApplicationService {
  getPolicy(): Promise<MediaSourceScanPolicy>;

  updatePolicy(
    input: MediaSourceScanPolicyInput,
  ): Promise<MediaSourceScanPolicy>;
}

class DefaultMediaSourceScanPolicyApplicationService
  implements MediaSourceScanPolicyApplicationService
{
  constructor(private readonly store: MediaSourceScanPolicyStore) {}

  getPolicy(): Promise<MediaSourceScanPolicy> {
    return this.store.read();
  }

  async updatePolicy(
    input: MediaSourceScanPolicyInput,
  ): Promise<MediaSourceScanPolicy> {
    const policy = createMediaSourceScanPolicy(input);

    await this.store.write(policy);

    // Read back through the port so the result reflects the authoritative
    // persisted representation rather than assuming the write echoed exactly.
    return this.store.read();
  }
}

export function createMediaSourceScanPolicyApplicationService(
  store: MediaSourceScanPolicyStore,
): MediaSourceScanPolicyApplicationService {
  return new DefaultMediaSourceScanPolicyApplicationService(store);
}
