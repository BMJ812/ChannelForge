export { createHealthModule } from './application/HealthModule.js';

export type {
  HealthModule,
  HealthModuleDependencies,
  HealthQueryService,
  RecommendationQueryService,
} from './application/HealthModule.js';

export type {
  ModuleHealthSnapshot,
  ModuleHealthStatus,
  Recommendation,
} from './domain/Health.js';
