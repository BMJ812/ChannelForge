import type { InstanceIdentity } from '../domain/InstanceIdentity.js';

export interface InstanceIdentityReader {
  readInstanceIdentity(): InstanceIdentity;
}
