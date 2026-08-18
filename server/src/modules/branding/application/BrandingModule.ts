import type { ChannelId } from '@/modules/channels/index.js';
import type { NetworkId } from '@/modules/networks/index.js';

import type {
  BrandingProfileId,
  BrandingRevisionId,
} from '../domain/Branding.js';

export type BrandingTarget =
  | Readonly<{
      scope: 'network';
      networkId: NetworkId;
    }>
  | Readonly<{
      scope: 'channel';
      channelId: ChannelId;
    }>;

export type BrandingProfileSummary = Readonly<{
  brandingProfileId: BrandingProfileId;
  activeRevisionId?: BrandingRevisionId;
  name: string;
}>;

export interface BrandingCommandService {
  createBrandingProfile(
    input: Readonly<{ name: string }>,
  ): Promise<BrandingProfileId>;
}

export interface BrandingQueryService {
  getBrandingProfile(
    brandingProfileId: BrandingProfileId,
  ): Promise<BrandingProfileSummary | undefined>;

  resolveEffectiveBranding(
    target: BrandingTarget,
  ): Promise<BrandingProfileSummary | undefined>;
}

export type BrandingModuleDependencies = Readonly<{
  commands: BrandingCommandService;
  queries: BrandingQueryService;
}>;

export type BrandingModule = Readonly<{
  commands: BrandingCommandService;
  queries: BrandingQueryService;
}>;

export function createBrandingModule(
  dependencies: BrandingModuleDependencies,
): BrandingModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
