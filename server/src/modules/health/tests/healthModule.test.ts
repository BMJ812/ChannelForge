import { describe, expect, it, vi } from 'vitest';

import {
  createHealthModule,
  type HealthQueryService,
  type RecommendationQueryService,
} from '../index.js';

describe('Health module shell', () => {
  it('registers health and recommendation queries', () => {
    const health: HealthQueryService = {
      getModuleHealth: vi.fn(async () => []),
    };

    const recommendations: RecommendationQueryService = {
      getRecommendations: vi.fn(async () => []),
    };

    const module = createHealthModule({
      health,
      recommendations,
    });

    expect(module.health).toBe(health);
    expect(module.recommendations).toBe(recommendations);
    expect(Object.isFrozen(module)).toBe(true);
  });
});
