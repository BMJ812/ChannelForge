import type { ModuleHealthSnapshot, Recommendation } from '../domain/Health.js';

export interface HealthQueryService {
  getModuleHealth(): Promise<readonly ModuleHealthSnapshot[]>;
}

export interface RecommendationQueryService {
  getRecommendations(): Promise<readonly Recommendation[]>;
}

export type HealthModuleDependencies = Readonly<{
  health: HealthQueryService;
  recommendations: RecommendationQueryService;
}>;

export type HealthModule = Readonly<{
  health: HealthQueryService;
  recommendations: RecommendationQueryService;
}>;

export function createHealthModule(
  dependencies: HealthModuleDependencies,
): HealthModule {
  return Object.freeze({
    health: dependencies.health,
    recommendations: dependencies.recommendations,
  });
}
