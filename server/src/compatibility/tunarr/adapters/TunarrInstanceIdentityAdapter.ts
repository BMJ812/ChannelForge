import type { SettingsDB } from '@/db/SettingsDB.js';

import type {
  ChannelForgeInstanceIdentity,
  TunarrInstanceIdentityPort,
} from '../ports/index.js';
import {
  TunarrCompatibilityUsageMetrics,
  tunarrCompatibilityUsageMetrics,
} from '../usage/CompatibilityUsageMetrics.js';

export class TunarrInstanceIdentityAdapter
  implements TunarrInstanceIdentityPort
{
  constructor(
    private readonly settingsDB: Pick<SettingsDB, 'clientId'>,
    private readonly usageMetrics: TunarrCompatibilityUsageMetrics = tunarrCompatibilityUsageMetrics,
  ) {}

  readInstanceIdentity(): ChannelForgeInstanceIdentity {
    this.usageMetrics.record('instance-identity-read');

    return Object.freeze({
      instanceId: this.settingsDB.clientId(),
    });
  }
}
