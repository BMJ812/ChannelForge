import type {
  CompatibilityMetricDimensions,
  CompatibilityMetricResult,
  CompatibilityMetrics,
} from '../ports/index.js';

import type { LegacyRouteRegistration } from './LegacyRouteRegistry.js';

export class LegacyRouteUsageMetrics {
  constructor(
    private readonly metrics: CompatibilityMetrics,
    private readonly applicationVersion?: string,
  ) {}

  recordCall(route: LegacyRouteRegistration): void {
    this.metrics.increment(
      'LEGACY_ROUTE_CALLS',
      this.dimensions(route, 'SUCCESS'),
    );

    if (route.classification === 'DEPRECATE') {
      this.metrics.increment(
        'DEPRECATED_ROUTE_CALLS',
        this.dimensions(route, 'SUCCESS'),
      );
    }
  }

  recordLatency(
    route: LegacyRouteRegistration,
    milliseconds: number,
    result: CompatibilityMetricResult,
  ): void {
    this.metrics.observeMilliseconds(
      'COMPATIBILITY_LATENCY',
      milliseconds,
      this.dimensions(route, result),
    );
  }

  private dimensions(
    route: LegacyRouteRegistration,
    result: CompatibilityMetricResult,
  ): CompatibilityMetricDimensions {
    return Object.freeze({
      concept: 'legacy-route',
      entityType: 'route',
      routeTemplate: route.path,
      operation: `legacy-route:${route.method}`,
      mode: route.compatibilityMode,
      result,
      ...(this.applicationVersion === undefined
        ? {}
        : { applicationVersion: this.applicationVersion }),
    });
  }
}
