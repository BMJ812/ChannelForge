import type { MediaSourceScanPolicy } from '../domain/MediaSourceScanPolicy.js';

export interface MediaSourceScanPolicyStore {
  read(): Promise<MediaSourceScanPolicy>;
  write(policy: MediaSourceScanPolicy): Promise<void>;
}
