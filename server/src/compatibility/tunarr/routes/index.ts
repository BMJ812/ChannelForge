export {
  classifyTunarrLegacyRoute,
  getTunarrLegacyRouteRegistrySnapshot,
  legacyRouteCompatibilityMode,
  legacyRouteDeprecationMetadata,
  legacyRouteRegistrationGroup,
  legacyRouteTags,
  LegacyRouteClassifications,
  LegacyRouteRegistrationGroups,
  LegacyRouteRegistry,
  tunarrLegacyRouteRegistry,
} from './LegacyRouteRegistry.js';

export type {
  LegacyRouteClassification,
  LegacyRouteDeprecationMetadata,
  LegacyRouteRegistration,
  LegacyRouteRegistrationGroup,
  LegacyRouteRegistrySnapshot,
} from './LegacyRouteRegistry.js';

export { LegacyRouteUsageMetrics } from './LegacyRouteUsageMetrics.js';

export {
  registerTunarrLegacyApiRoutes,
  registerTunarrLegacyStreamRoutes,
} from './registerTunarrLegacyRoutes.js';

export {
  canonicalMediaSourceScanPolicyToLegacyResponse,
  createTunarrMediaSourceSettingsRouteAdapter,
  legacyMediaSourceSettingsRequestToCanonical,
  TunarrMediaSourceSettingsRouteAdapter,
} from './MediaSourceSettingsRouteAdapter.js';

export type {
  LegacyMediaSourceSettingsRequest,
  LegacyMediaSourceSettingsResponse,
} from './MediaSourceSettingsRouteAdapter.js';
