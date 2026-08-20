export {
  classifyTunarrLegacyRoute,
  getTunarrLegacyRouteRegistrySnapshot,
  legacyRouteCompatibilityMode,
  legacyRouteRegistrationGroup,
  legacyRouteTags,
  LegacyRouteClassifications,
  LegacyRouteRegistrationGroups,
  LegacyRouteRegistry,
  tunarrLegacyRouteRegistry,
} from './LegacyRouteRegistry.js';

export type {
  LegacyRouteClassification,
  LegacyRouteRegistration,
  LegacyRouteRegistrationGroup,
  LegacyRouteRegistrySnapshot,
} from './LegacyRouteRegistry.js';

export { LegacyRouteUsageMetrics } from './LegacyRouteUsageMetrics.js';

export {
  registerTunarrLegacyApiRoutes,
  registerTunarrLegacyStreamRoutes,
} from './registerTunarrLegacyRoutes.js';
